export interface IAuthenticationFields {
  discord: IDiscordAuthFields | null
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

export interface IBasicAuthFields {
  email: string
  password: string
}

export interface IDatabase {
  connect(): Promise<void>
  addUser(user: UserSchema): Promise<void>
  findUserById(id: string): Promise<UserSchema | null>
  findUserByDiscordId(id: string): Promise<UserSchema | null>
  findUserByEmail(email: string): Promise<UserSchema | null>
}

export interface UserSchema {
  id: string
  nickname: string
  createdAt: string
  updatedAt: string
  friends: Array<string>
  authentication: IAuthenticationFields
}
