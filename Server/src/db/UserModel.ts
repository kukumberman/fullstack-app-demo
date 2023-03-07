import { SignInMethods, UserSchema } from "../types"
import { generateId, generateTimestampString } from "../utils"

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
      login: {
        email: "",
        password: "",
      },
      signIn: {
        discord: null,
        google: null,
      },
    })
  }

  discordNickname(): string {
    const discord = this.data.signIn.discord
    if (discord === null) {
      return ""
    }
    return discord.username + "#" + discord.discriminator
  }

  hasConnectedMethod(method: string): boolean {
    return this.data.signIn[method as keyof SignInMethods] != null
  }
}
