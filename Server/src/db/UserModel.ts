import { SignInMethods, UserSchema } from "../types"
import { generateId, generateTimestampString } from "../utils"

export abstract class BaseModel<T> {
  constructor(public data: T) {}
}

export class UserModel extends BaseModel<UserSchema> {
  static New(): UserModel {
    const now = generateTimestampString()

    return new UserModel({
      id: generateId(),
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
      app: {
        clickCounter: 0,
        experienceAmount: 0,
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
