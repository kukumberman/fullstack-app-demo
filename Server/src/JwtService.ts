import { JwtTokenPair, JwtToken } from "./types"
import { sign, verify } from "jsonwebtoken"

export class JwtService {
  private readonly secret: string

  constructor(
    public readonly accessTokenMaxAgeMs: number,
    public readonly refreshTokeMaxAgeMs: number
  ) {
    this.secret = process.env.JWT_SECRET!
  }

  generatePair(payload: object): JwtTokenPair {
    return {
      accessToken: sign(payload, this.secret, { expiresIn: this.accessTokenMaxAgeMs / 1000 }),
      refreshToken: sign(payload, this.secret, { expiresIn: this.refreshTokeMaxAgeMs / 1000 }),
    }
  }

  verify(token: JwtToken) {
    const result = verify(token, this.secret)
    return result as Object
  }
}
