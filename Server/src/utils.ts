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

  constructor() {
    this.map = new Map<string, IPingData>()
  }

  saveTokenInMemory(guid: string, token: string) {
    this.map.set(guid, {
      token,
      expires: Date.now() + 10 * 1000,
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

export class UserIdentifier {
  readonly COOKIE_KEY = "token"

  constructor(private request: FastifyRequest, private reply: FastifyReply) {}

  hasCookie() {
    const cookieToken: string | undefined = this.request.cookies[this.COOKIE_KEY]
  }
}
