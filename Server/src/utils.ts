import { nanoid } from "nanoid"

export function generateId() {
  return nanoid()
}

export function generateTimestampString() {
  return new Date().toJSON()
}

interface IGuidValidator {
  validate(): boolean
}

export class RegexGuidValidator implements IGuidValidator {
  constructor(private guid: string) {}

  validate(): boolean {
    return /[a-fA-F\d]{8}-[a-fA-F\d]{4}-[a-fA-F\d]{4}-[a-fA-F\d]{4}-[a-fA-F\d]{12}/.test(this.guid)
  }
}

interface IPingData {
  token: string
  expires: number
  expired(): boolean
}

export class ExternalLogin {
  private map: Map<string, IPingData>

  constructor(private expirationTimeInSeconds: number) {
    this.map = new Map<string, IPingData>()
  }

  saveTokenInMemory(guid: string, token: string) {
    this.map.set(guid, {
      token,
      expires: Date.now() + this.expirationTimeInSeconds * 1000,
      expired() {
        return Date.now() > this.expires
      },
    })
  }

  tryRemoveExpiredEntries() {
    Array.from(this.map.keys()).forEach((guid) => {
      const entry = this.map.get(guid)!
      if (entry.expired()) {
        this.map.delete(guid)
      }
    })
  }

  popToken(guid: string): string | null {
    if (this.map.has(guid)) {
      const entry = this.map.get(guid)!
      this.map.delete(guid)
      return entry.token
    }

    return null
  }
}

//todo
import { FastifyRequest, FastifyReply } from "fastify"
import { UserTokenPayload } from "./types"

export class UserIdentifier {
  static readonly COOKIE_NAME = "token"

  static async getUserFromCookie(request: FastifyRequest) {
    const cookieToken: string | undefined = request.cookies[UserIdentifier.COOKIE_NAME]

    if (cookieToken == undefined) {
      return null
    }

    const instance = request.server
    const payload = instance.jwt.verify(cookieToken) as UserTokenPayload
    const id = payload.id
    const user = await instance.db.findUserById(id)
    return user
  }
}
