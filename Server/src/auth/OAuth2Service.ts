import { createHash } from "crypto"
import { OAuth2Handler } from "./OAuth2Handler"

export class StateSigner {
  public readonly separator: string

  constructor(private readonly secret: string) {
    this.separator = "."
  }

  signState(payload: string): string {
    const hash = this.encode(`${payload}-${this.secret}`)
    return payload + this.separator + hash
  }

  verifyState(hash: string): boolean {
    return hash === this.signState(this.decodeState(hash))
  }

  decodeState(hash: string): string {
    return hash.split(this.separator)[0]
  }

  private encode(data: string): string {
    return createHash("sha256").update(data).digest("hex")
  }
}

export class OAuth2Service {
  public readonly signer: StateSigner

  constructor(public readonly handlers: OAuth2Handler[]) {
    this.signer = new StateSigner("key123") //todo - store secret in config
  }

  find(platformName: string): OAuth2Handler | undefined {
    return this.handlers.find((entry) => entry.name === platformName)
  }

  getAllPlatformsData(state: string) {
    return this.handlers.map((entry) => entry.getPublicData(state))
  }
}
