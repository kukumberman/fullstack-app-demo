import { AccessToken, AuthorizationCode, Token } from "simple-oauth2"
import axios from "axios"
import { UserModel } from "../db/UserModel"
import { DiscordSignInFields, GoogleSignInFields } from "../types"
import { generateTimestampString } from "../utils"
import { UserService } from "../services/UserService"

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

  abstract assignOrUpdateFields(user: UserModel, data: any): void

  abstract findUserWithSamePlatform(
    userService: UserService,
    data: any
  ): Promise<UserModel | undefined>

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
  constructor() {
    super(
      "discord",
      process.env.DISCORD_CLIENT_ID!,
      process.env.DISCORD_CLIENT_SECRET!,
      ["identify"],
      "https://discord.com/api/users/@me"
    )
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

  assignOrUpdateFields(user: UserModel, data: any) {
    const fields = data as DiscordSignInFields
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
    const fields = data as DiscordSignInFields
    return userService.findOneByDiscordId(fields.id)
  }
}

export class GoogleOAuth2Handler extends OAuth2Handler {
  constructor() {
    super(
      "google",
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      ["profile", "email"],
      "https://www.googleapis.com/oauth2/v2/userinfo"
    )
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

  assignOrUpdateFields(user: UserModel, data: any) {
    const fields = data as GoogleSignInFields
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
    const fields = data as GoogleSignInFields
    return userService.findOneByGoogleId(fields.id)
  }
}
