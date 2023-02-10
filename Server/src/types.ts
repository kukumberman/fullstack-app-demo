export interface IAuthenticationFields {
  discord: IDiscordAuthFields | null
  google: IGoogleAuthFields | null
  basic: IBasicAuthFields | null
}

export interface IDiscordAuthFields {
  id: string
  username: string
  avatar: string
  discriminator: string
  createdAt: string
  updatedAt: string
}

export interface IGoogleAuthFields {
  id: string
  email: string
  name: string
  picture: string
  createdAt: string
  updatedAt: string
}

export interface IBasicAuthFields {
  email: string
  password: string
}

export interface UserSchema {
  id: string
  nickname: string
  createdAt: string
  updatedAt: string
  authentication: IAuthenticationFields
}

export type UserTokenPayload = {
  id: string
}
