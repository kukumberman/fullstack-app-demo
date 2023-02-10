import fetch from "node-fetch"
import { FastifyInstance } from "fastify"
import oauthPlugin, {
  FastifyOAuth2Options,
  ProviderConfiguration,
  OAuth2Namespace,
  Token,
} from "@fastify/oauth2"
import { IDatabase } from "./types.js"
import { UserModel } from "./db/lowdb.js"
import { ExternalLogin, generateTimestampString, UserIdentifier } from "./utils.js"

const GET_OAUTH2 = "customOAuth2"
const GET_DATABASE = "db"

declare module "fastify" {
  interface FastifyInstance {
    [GET_OAUTH2]: Map<string, OAuth2Handler>
    [GET_DATABASE]: IDatabase
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

  abstract createOrUpdateUser(db: IDatabase, fields: any): Promise<string>

  abstract assign(): Promise<void>

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
        const guid = request.query.guid
        if (guid === undefined) {
          return "none"
        }
        return guid
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

  async createOrUpdateUser(db: IDatabase, fields: any): Promise<string> {
    const now = generateTimestampString()
    const candidate = await db.findUserByDiscordId(fields.id)
    if (candidate != null) {
      const discord = candidate.authentication.discord!
      discord.id = fields.id
      discord.username = fields.username
      discord.avatar = fields.avatar
      discord.discriminator = fields.discriminator
      discord.updatedAt = now
      candidate.updatedAt = now
      await db.save()
      return candidate.id
    } else {
      const newUser = new UserModel()
      newUser.authentication.discord = {
        id: fields.id,
        username: fields.username,
        avatar: fields.avatar,
        discriminator: fields.discriminator,
        createdAt: now,
        updatedAt: now,
      }
      await db.addUser(newUser)
      return newUser.id
    }
  }

  assign(): Promise<void> {
    throw new Error("Method not implemented.")
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

    if (guid === undefined) {
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
    const shouldConnect = false // ("state.token" exists && is valid) && (user.authentication[methodName] === null)

    if (shouldConnect) {
      // await handler.assign()
    } else {
      const db = request.server[GET_DATABASE]
      const id = await handler.createOrUpdateUser(db, data)
      const token = request.server.jwt.sign({ id })
      //todo: set "expire_date" (cookie and token)
      reply.setCookie(UserIdentifier.COOKIE_NAME, token, { path: "/" })
      reply.redirect("/")

      if (state.length > 0 && state != "none") {
        externalLogin.saveTokenInMemory(state, token)
      }
    }
  })
}
