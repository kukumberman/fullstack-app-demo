import { SignInPlatforms, UserSchema } from "../types"
import { generateId, generateTimestampString } from "../utils"

export abstract class BaseModel<T> {
  constructor(public data: T) {}
}

function generateTemporaryNickname(dateStr: string): string {
  const date = new Date(dateStr)
  const prefix = "User"
  const suffix = date.getMilliseconds().toString(16).padStart(4, "0")
  return `${prefix}-${suffix}`
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
}
