export type ObjectId = string

export type DiscordId = string

export type GoogleId = string

export type SignInMethods = {
  discord: DiscordSignInFields | null
  google: GoogleSignInFields | null
}

export type DiscordSignInFields = {
  id: DiscordId
  username: string
  avatar: string
  discriminator: string
  createdAt: string
  updatedAt: string
}

export type GoogleSignInFields = {
  id: GoogleId
  email: string
  name: string
  picture: string
  createdAt: string
  updatedAt: string
}

export type LoginFields = {
  email: string
  password: string
}

export interface UserSchema {
  id: ObjectId
  nickname: string
  createdAt: string
  updatedAt: string
  login: LoginFields
  signIn: SignInMethods
}

export type UserTokenPayload = {
  id: string
}
