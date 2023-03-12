import { AccessToken, AuthorizationCode, Token } from "simple-oauth2"
import axios from "axios"
import Ajv, { JSONSchemaType, ValidateFunction } from "ajv"
import { UserModel } from "../db/UserModel"
import { DiscordUserFields, GoogleUserFields } from "../types"
import { generateTimestampString } from "../utils"
import { UserService } from "../services/UserService"

const ajv = new Ajv()

async function fetchProfile(profileApiUri: string, token: Token): Promise<any> {
  const response = await axios.get(profileApiUri, {
    headers: {
      Authorization: `${token.token_type} ${token.access_token}`,
    },
  })
  return response.data
}

export abstract class OAuth2Handler {
  public readonly client: AuthorizationCode

  constructor(
    public readonly name: string,
    protected readonly clientId: string,
    protected readonly clientSecret: string,
    protected readonly scope: string[],
    private readonly profileApiUrl: string
  ) {
    this.client = this.createClient()
  }

  protected abstract createClient(): AuthorizationCode

  abstract isDifferentAccountConnected(user: UserModel, data: any): boolean

  abstract assignOrUpdateFields(user: UserModel, data: any): void

  abstract findUserWithSamePlatform(
    userService: UserService,
    data: any
  ): Promise<UserModel | undefined>

  abstract isDataValid(data: any): boolean

  fetchProfile(token: Token): Promise<any> {
    return fetchProfile(this.profileApiUrl, token)
  }

  getRedirectUri(): string {
    //todo
    return `http://localhost:3000/login/${this.name}/callback`
  }

  authorizeURL(state: string) {
    return this.client.authorizeURL({
      redirect_uri: this.getRedirectUri(),
      scope: this.scope,
      state: state,
    })
  }

  getToken(code: string): Promise<AccessToken> {
    return this.client.getToken({
      code,
      redirect_uri: this.getRedirectUri(),
    })
  }

  getPublicData(state: string) {
    return {
      name: this.name,
      authorizationUri: this.authorizeURL(state),
    }
  }
}

export class DiscordOAuth2Handler extends OAuth2Handler {
  private readonly validateFunction: ValidateFunction

  constructor() {
    super(
      "discord",
      process.env.DISCORD_CLIENT_ID!,
      process.env.DISCORD_CLIENT_SECRET!,
      ["identify"],
      "https://discord.com/api/users/@me"
    )

    const schema: JSONSchemaType<DiscordUserFields> = {
      type: "object",
      properties: {
        id: { type: "string" },
        username: { type: "string" },
        discriminator: { type: "string" },
        avatar: { type: "string" },
      },
      additionalProperties: true,
      required: ["id", "username", "discriminator", "avatar"],
    }
    this.validateFunction = ajv.compile(schema)
  }

  protected createClient(): AuthorizationCode {
    return new AuthorizationCode({
      client: {
        id: this.clientId,
        secret: this.clientSecret,
      },
      auth: {
        authorizeHost: "https://discord.com",
        authorizePath: "/api/oauth2/authorize",
        tokenHost: "https://discord.com",
        tokenPath: "/api/oauth2/token",
      },
    })
  }

  isDifferentAccountConnected(user: UserModel, data: any): boolean {
    const fields = data as DiscordUserFields
    const platform = user.data.signIn.platforms.discord
    if (platform === null) {
      return false
    }
    if (platform.id !== fields.id) {
      return true
    }
    return false
  }

  assignOrUpdateFields(user: UserModel, data: any) {
    const fields = data as DiscordUserFields
    const now = generateTimestampString()
    if (user.data.signIn.platforms.discord === null) {
      user.data.signIn.platforms.discord = {
        id: fields.id,
        avatar: fields.avatar,
        username: fields.username,
        discriminator: fields.discriminator,
        createdAt: now,
        updatedAt: now,
      }
    } else {
      const discordFields = user.data.signIn.platforms.discord
      discordFields.id = fields.id
      discordFields.avatar = fields.avatar
      discordFields.username = fields.username
      discordFields.discriminator = fields.discriminator
      discordFields.updatedAt = now
    }
  }

  findUserWithSamePlatform(userService: UserService, data: any): Promise<UserModel | undefined> {
    const fields = data as DiscordUserFields
    return userService.findOneByDiscordId(fields.id)
  }

  isDataValid(data: any): boolean {
    return this.validateFunction(data)
  }
}

export class GoogleOAuth2Handler extends OAuth2Handler {
  private readonly validateFunction: ValidateFunction

  constructor() {
    super(
      "google",
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      ["profile", "email"],
      "https://www.googleapis.com/oauth2/v2/userinfo"
    )

    const schema: JSONSchemaType<GoogleUserFields> = {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string" },
        name: { type: "string" },
        picture: { type: "string" },
      },
      additionalProperties: true,
      required: ["id", "email", "name", "picture"],
    }

    this.validateFunction = ajv.compile(schema)
  }

  protected createClient(): AuthorizationCode {
    return new AuthorizationCode({
      client: {
        id: this.clientId,
        secret: this.clientSecret,
      },
      auth: {
        authorizeHost: "https://accounts.google.com",
        authorizePath: "/o/oauth2/v2/auth",
        tokenHost: "https://www.googleapis.com",
        tokenPath: "/oauth2/v4/token",
      },
    })
  }

  isDifferentAccountConnected(user: UserModel, data: any): boolean {
    const fields = data as GoogleUserFields
    const platform = user.data.signIn.platforms.google
    if (platform === null) {
      return false
    }
    if (platform.id !== fields.id) {
      return true
    }
    return false
  }

  assignOrUpdateFields(user: UserModel, data: any) {
    const fields = data as GoogleUserFields
    const now = generateTimestampString()
    if (user.data.signIn.platforms.google === null) {
      user.data.signIn.platforms.google = {
        id: fields.id,
        email: fields.email,
        name: fields.name,
        picture: fields.picture,
        createdAt: now,
        updatedAt: now,
      }
    } else {
      const googleFields = user.data.signIn.platforms.google
      googleFields.id = fields.id
      googleFields.email = fields.email
      googleFields.name = fields.name
      googleFields.picture = fields.picture
      googleFields.updatedAt = now
    }
  }

  findUserWithSamePlatform(userService: UserService, data: any): Promise<UserModel | undefined> {
    const fields = data as GoogleUserFields
    return userService.findOneByGoogleId(fields.id)
  }

  isDataValid(data: any): boolean {
    return this.validateFunction(data)
  }
}
