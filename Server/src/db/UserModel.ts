import { IAuthenticationFields, UserSchema } from "../types.js"
import { generateId, generateTimestampString } from "../utils.js"

export abstract class BaseModel<T> {
  constructor(public data: T) {}
}

export class UserModel extends BaseModel<UserSchema> {
  static Empty(): UserModel {
    const now = generateTimestampString()

    return new UserModel({
      id: generateId(),
      nickname: "",
      createdAt: now,
      updatedAt: now,
      authentication: {
        basic: null,
        discord: null,
      },
    })
  }

  discordNickname(): string {
    const discord = this.data.authentication.discord
    if (discord === null) {
      return ""
    }
    return discord.username + "#" + discord.discriminator
  }

  hasConnectedAuth(method: string): boolean {
    return this.data.authentication[method as keyof IAuthenticationFields] != null
  }
}
