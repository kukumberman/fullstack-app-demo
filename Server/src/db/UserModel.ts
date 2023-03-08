import { SignInPlatforms, UserSchema } from "../types"
import { generateTemporaryNickname, generateTimestampString } from "../utils"
import { generateId } from "../utils/id"

export abstract class BaseModel<T> {
  constructor(public data: T) {}
}

export class UserModel extends BaseModel<UserSchema> {
  static New(): UserModel {
    const now = generateTimestampString()
    const initialNickname = generateTemporaryNickname(now)

    return new UserModel({
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      signIn: {
        refreshToken: "",
        standard: null,
        platforms: {
          google: null,
          discord: null,
        },
      },
      app: {
        nickname: initialNickname,
        clickCounter: 0,
        experienceAmount: 0,
      },
    })
  }

  discordNickname(): string {
    const discord = this.data.signIn.platforms.discord
    if (discord === null) {
      return ""
    }
    return discord.username + "#" + discord.discriminator
  }

  hasConnectedPlatform(platform: string): boolean {
    return this.data.signIn.platforms[platform as keyof SignInPlatforms] != null
  }

  get refreshToken(): string {
    return this.data.signIn.refreshToken
  }

  set refreshToken(value: string) {
    this.data.signIn.refreshToken = value
  }
}
