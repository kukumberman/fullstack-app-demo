import fetch from "node-fetch"
import { FastifyInstance } from "fastify"
import oauthPlugin, {
  FastifyOAuth2Options,
  ProviderConfiguration,
  OAuth2Namespace,
  Token,
} from "@fastify/oauth2"
import { UserTokenPayload } from "./types.js"
import { UserDatabase } from "./db/lowdb.js"
import { ExternalLogin, generateTimestampString, UserIdentifier } from "./utils.js"
import { UserModel } from "./db/UserModel.js"

const GET_OAUTH2 = "customOAuth2"
const GET_DATABASE = "db"

declare module "fastify" {
  interface FastifyInstance {
    [GET_OAUTH2]: Map<string, OAuth2Handler>
    [GET_DATABASE]: UserDatabase
  }
}

abstract class OAuth2Handler {
  constructor(
    public readonly name: string,
    public readonly clientId: string,
    public readonly clientSecret: string,
    public readonly scope: string[],
    public readonly api: string
  ) {}

  abstract getProviderConfiguration(): ProviderConfiguration

  abstract createOrUpdateUser(db: UserDatabase, fields: any): Promise<string>

  abstract assign(user: UserModel, fields: any): void

  getPropertyName() {
    return `${this.name}OAuth2`
  }

  getPlugin(instance: FastifyInstance) {
    const key = this.getPropertyName()
    return instance[key as keyof FastifyInstance] as OAuth2Namespace
  }

  async identify(token: Token): Promise<any> {
    const response = await fetch(this.api, {
      headers: {
        Authorization: `${token.token_type} ${token.access_token}`,
      },
    })
    const data = await response.json()
    return data
  }

  register(instance: FastifyInstance) {
    //todo: state functions
    const options: FastifyOAuth2Options = {
      name: this.getPropertyName(),
      scope: this.scope,
      credentials: {
        client: {
          id: this.clientId,
          secret: this.clientSecret,
        },
        auth: this.getProviderConfiguration(),
      },
      callbackUri: `http://localhost:${process.env.PORT!}/login/${this.name}/callback`,
      generateStateFunction(request: any) {
        const state: string | undefined = request.query.state
        if (state === undefined || state.length === 0) {
          return "none"
        }
        return state
      },
      checkStateFunction(returnedState: string, callback: Function) {
        callback()
      },
    }
    instance.register(oauthPlugin, options)
  }
}

class DiscordOAuth2Handler extends OAuth2Handler {
  constructor() {
    super(
      "discord",
      process.env.DISCORD_CLIENT_ID!,
      process.env.DISCORD_CLIENT_SECRET!,
      ["identify"],
      "https://discord.com/api/users/@me"
    )
  }

  getProviderConfiguration(): oauthPlugin.ProviderConfiguration {
    return oauthPlugin.fastifyOauth2.DISCORD_CONFIGURATION
  }

  async createOrUpdateUser(db: UserDatabase, fields: any): Promise<string> {
    const now = generateTimestampString()
    const candidate = await db.findUserByDiscordId(fields.id)
    if (candidate != null) {
      const discord = candidate.data.authentication.discord!
      discord.id = fields.id
      discord.username = fields.username
      discord.avatar = fields.avatar
      discord.discriminator = fields.discriminator
      discord.updatedAt = now
      candidate.data.updatedAt = now
      await db.save()
      return candidate.data.id
    } else {
      const newUser = UserModel.Empty()
      newUser.data.authentication.discord = {
        id: fields.id,
        username: fields.username,
        avatar: fields.avatar,
        discriminator: fields.discriminator,
        createdAt: now,
        updatedAt: now,
      }
      await db.addUser(newUser)
      return newUser.data.id
    }
  }

  assign(user: UserModel, fields: any) {
    const now = generateTimestampString()
    user.data.authentication.discord = {
      id: fields.id,
      username: fields.username,
      avatar: fields.avatar,
      discriminator: fields.discriminator,
      createdAt: now,
      updatedAt: now,
    }
    user.data.updatedAt = now
  }
}

export function registerOAuth2(instance: FastifyInstance) {
  const methods: OAuth2Handler[] = [new DiscordOAuth2Handler()]
  methods.forEach((m) => m.register(instance))

  const map = new Map<string, OAuth2Handler>()
  methods.forEach((m) => map.set(m.name, m))

  instance.decorate(GET_OAUTH2, map)

  instance.get("/login/methods", (request, reply) => {
    const storage = request.server[GET_OAUTH2]
    const keys = Array.from(storage.keys())
    return keys
  })

  const externalLogin = new ExternalLogin()

  interface IExternalLoginRequest {
    Querystring: {
      guid: string | undefined
    }
  }

  instance.get<IExternalLoginRequest>("/login/external", (request, reply) => {
    const guid = request.query.guid

    if (guid === undefined || guid.length === 0) {
      return {
        message: "not allowed",
      }
    }

    const token = externalLogin.popToken(guid)
    externalLogin.tryRemoveExpiredEntries()

    if (token != null) {
      return { token }
    }

    return {
      message: "not found",
    }
  })

  interface ILoginRequest {
    Params: {
      method: string
    }
  }

  instance.get<ILoginRequest>("/login/:method", (request, reply) => {
    const methodName = request.params.method
    const storage = request.server[GET_OAUTH2]
    if (!storage.has(methodName)) {
      //todo: error
      return {
        message: "method not found",
      }
    }

    const handler: OAuth2Handler = storage.get(methodName)!
    const plugin: OAuth2Namespace = handler.getPlugin(instance)
    const url: string = plugin.generateAuthorizationUri(request)
    return { redirect: url }
  })

  interface ICallbackRequest {
    Querystring: {
      state: string
    }
    Params: {
      method: string
    }
  }

  instance.get<ICallbackRequest>("/login/:method/callback", async (request, reply) => {
    const methodName = request.params.method
    const storage = request.server[GET_OAUTH2]
    if (!storage.has(methodName)) {
      //todo: error
      return {
        message: "method not found",
      }
    }

    const handler: OAuth2Handler = storage.get(methodName)!
    const plugin: OAuth2Namespace = handler.getPlugin(instance)
    const token: Token = (await plugin.getAccessTokenFromAuthorizationCodeFlow(request)).token

    const data: any = await handler.identify(token)

    const state: string = request.query.state
    const [stateId, stateValue] = decodeURIComponent(state).split(":")

    const db = request.server[GET_DATABASE]

    //todo: also handle token validation before callback method?
    if (stateId === "token") {
      try {
        const payload = request.server.jwt.verify(stateValue) as UserTokenPayload
        const id = payload.id
        const user = await db.findUserById(id)
        if (user == null) {
          return {
            message: "how did you get this token?",
          }
        }

        if (user.hasConnectedAuth(methodName)) {
          return {
            message: `${methodName} is already connected`,
          }
        }

        handler.assign(user, data)
        await db.save()

        return {
          message: `${methodName} assigned successfully`,
        }
      } catch (error) {
        // someone can manually send request with fake token, so jwt error is handled here

        if (error instanceof Error) {
          return {
            error: {
              name: error.name,
              message: error.message,
            },
          }
        }

        return {
          message: "invalid token",
        }
      }
    }

    const id = await handler.createOrUpdateUser(db, data)
    const accessToken = request.server.jwt.sign({ id })
    //todo: set "expire_date" (for cookie and accessToken)
    reply.setCookie(UserIdentifier.COOKIE_NAME, accessToken, { path: "/" })
    reply.redirect("/")

    const notEmptyState = state.length > 0 && state != "none"
    const isValidGuid = stateId === "guid" && stateValue.length > 0
    if (notEmptyState && isValidGuid) {
      externalLogin.saveTokenInMemory(stateValue, accessToken)
    }
  })
}
