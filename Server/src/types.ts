export type ObjectId = string

export type DiscordId = string

export type GoogleId = string

export type EntryDateTimeFields = {
  createdAt: string
  updatedAt: string
}

export type SignInPlatforms = {
  discord: DiscordSignInFields | null
  google: GoogleSignInFields | null
}

export type DiscordUserFields = {
  id: DiscordId
  username: string
  avatar: string
  discriminator: string
}

export type DiscordSignInFields = DiscordUserFields & EntryDateTimeFields

export type GoogleUserFields = {
  id: GoogleId
  email: string
  name: string
  picture: string
}

export type GoogleSignInFields = GoogleUserFields & EntryDateTimeFields

export type StandardSignInFields = {
  email: string
  password: string
}

export type SignIn = {
  refreshToken: JwtToken
  standard: StandardSignInFields | null
  platforms: SignInPlatforms
}

export type AppFields = {
  avatar: string
  nickname: NicknameFields
  clickCounter: number
  experienceAmount: number
}

export type NicknameFields = {
  value: string
  timesUpdated: number
  history: string[]
}

export interface UserSchema {
  id: ObjectId
  createdAt: string
  updatedAt: string
  signIn: SignIn
  app: AppFields
}

export type UserTokenPayload = {
  id: string
}

export type JwtToken = string

export type JwtTokenPair = {
  accessToken: JwtToken
  refreshToken: JwtToken
}
