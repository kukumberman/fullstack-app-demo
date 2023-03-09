import axios from "axios"
import { FastifyInstance } from "fastify"
import oauthPlugin, {
  FastifyOAuth2Options,
  ProviderConfiguration,
  OAuth2Namespace,
  Token,
} from "@fastify/oauth2"
import { UserTokenPayload } from "./types"
import { generateTimestampString } from "./utils"
import { UserModel } from "./db/UserModel"
import { UserService } from "./services/UserService"

const GET_OAUTH2 = "customOAuth2"

declare module "fastify" {
  interface FastifyInstance {
    [GET_OAUTH2]: Map<string, OAuth2Handler>
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

  abstract createOrUpdateUser(userService: UserService, fields: any): Promise<UserModel>

  abstract assign(user: UserModel, fields: any): void

  getPropertyName() {
    return `${this.name}OAuth2`
  }

  getPlugin(instance: FastifyInstance) {
    const key = this.getPropertyName()
    return instance[key as keyof FastifyInstance] as OAuth2Namespace
  }

  async identify(token: Token): Promise<any> {
    const response = await axios.get(this.api, {
      headers: {
        Authorization: `${token.token_type} ${token.access_token}`,
      },
    })
    return response.data
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

  getProviderConfiguration(): ProviderConfiguration {
    return oauthPlugin.DISCORD_CONFIGURATION
  }

  async createOrUpdateUser(userService: UserService, fields: any): Promise<UserModel> {
    const now = generateTimestampString()
    const candidate = await userService.findOneByDiscordId(fields.id)
    if (candidate != null) {
      const discord = candidate.data.signIn.platforms.discord!
      discord.id = fields.id
      discord.username = fields.username
      discord.avatar = fields.avatar
      discord.discriminator = fields.discriminator
      discord.updatedAt = now
      candidate.data.updatedAt = now
      return candidate
    } else {
      const newUser = UserModel.New()
      newUser.data.signIn.platforms.discord = {
        id: fields.id,
        username: fields.username,
        avatar: fields.avatar,
        discriminator: fields.discriminator,
        createdAt: now,
        updatedAt: now,
      }
      return newUser
    }
  }

  assign(user: UserModel, fields: any) {
    const now = generateTimestampString()
    user.data.signIn.platforms.discord = {
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

class GoogleOAuth2Handler extends OAuth2Handler {
  constructor() {
    super(
      "google",
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      ["profile", "email"],
      "https://www.googleapis.com/oauth2/v2/userinfo"
    )
  }

  getProviderConfiguration(): ProviderConfiguration {
    return oauthPlugin.GOOGLE_CONFIGURATION
  }

  async createOrUpdateUser(userService: UserService, fields: any): Promise<UserModel> {
    const now = generateTimestampString()
    const candidate = await userService.findOneByGoogleId(fields.id)
    if (candidate != null) {
      const google = candidate.data.signIn.platforms.google!
      google.id = fields.id
      google.email = fields.email
      google.name = fields.name
      google.picture = fields.picture
      google.updatedAt = now
      candidate.data.updatedAt = now
      return candidate
    } else {
      const newUser = UserModel.New()
      newUser.data.signIn.platforms.google = {
        id: fields.id,
        email: fields.email,
        name: fields.name,
        picture: fields.picture,
        createdAt: now,
        updatedAt: now,
      }
      return newUser
    }
  }

  assign(user: UserModel, fields: any): void {
    const now = generateTimestampString()
    user.data.signIn.platforms.google = {
      id: fields.id,
      email: fields.email,
      name: fields.name,
      picture: fields.picture,
      createdAt: now,
      updatedAt: now,
    }
    user.data.updatedAt = now
  }
}

export function registerOAuth2(instance: FastifyInstance) {
  const methods: OAuth2Handler[] = [new DiscordOAuth2Handler(), new GoogleOAuth2Handler()]
  methods.forEach((m) => m.register(instance))

  const map = new Map<string, OAuth2Handler>()
  methods.forEach((m) => map.set(m.name, m))

  instance.decorate(GET_OAUTH2, map)

  instance.get("/login/methods", (request, reply) => {
    const storage = request.server[GET_OAUTH2]
    const keys = Array.from(storage.keys())
    return keys
  })

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

    const externalLogin = request.server.app.externalLogin
    const token = externalLogin.popEntry(guid)
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
      platform: string
    }
  }

  instance.get<ILoginRequest>("/login/:platform", (request, reply) => {
    const platformName = request.params.platform
    const storage = request.server[GET_OAUTH2]
    if (!storage.has(platformName)) {
      //todo: error
      return {
        message: "platform not found",
      }
    }

    const handler: OAuth2Handler = storage.get(platformName)!
    const plugin: OAuth2Namespace = handler.getPlugin(instance)
    const url: string = plugin.generateAuthorizationUri(request)
    return { redirect: url }
  })

  interface ICallbackRequest {
    Querystring: {
      state: string
    }
    Params: {
      platform: string
    }
  }

  instance.get<ICallbackRequest>("/login/:platform/callback", async (request, reply) => {
    const platformName = request.params.platform
    const storage = request.server[GET_OAUTH2]
    if (!storage.has(platformName)) {
      //todo: error
      return {
        message: "method not found",
      }
    }

    const handler: OAuth2Handler = storage.get(platformName)!
    const plugin: OAuth2Namespace = handler.getPlugin(instance)
    const token: Token = (await plugin.getAccessTokenFromAuthorizationCodeFlow(request)).token

    const data: any = await handler.identify(token)

    const state: string = request.query.state
    const [stateId, stateValue] = decodeURIComponent(state).split(":")

    const userService: UserService = request.server.app.userService
    const jwtService = request.server.app.jwtService
    const cookieService = request.server.app.cookieService

    //todo: also handle token validation before callback method?
    if (stateId === "token") {
      try {
        const payload = jwtService.verify(stateValue) as UserTokenPayload
        const id = payload.id
        const user = await userService.findOneById(id)
        if (user == null) {
          return {
            message: "how did you get this token?",
          }
        }

        if (user.hasConnectedPlatform(platformName)) {
          return {
            message: `${platformName} is already connected`,
          }
        }

        handler.assign(user, data)
        await userService.save(user)

        return {
          message: `${platformName} assigned successfully`,
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

    const user = await handler.createOrUpdateUser(userService, data)

    const tokenPayload = { id: user.data.id }
    const tokenPair = jwtService.generatePair(tokenPayload)
    user.refreshToken = tokenPair.refreshToken
    await userService.save(user)

    cookieService.setTokens(reply, tokenPair)
    reply.redirect("/")

    const notEmptyState = state.length > 0 && state != "none"
    const isValidGuid = stateId === "guid" && stateValue.length > 0
    if (notEmptyState && isValidGuid) {
      const externalLogin = request.server.app.externalLogin
      //todo: probably should be saved both tokens
      externalLogin.addEntry(stateValue, tokenPair)
    }
  })
}
