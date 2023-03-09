import { JwtTokenPair, JwtToken } from "../types"
import { sign, verify, TokenExpiredError } from "jsonwebtoken"

export { TokenExpiredError }

export class JwtService {
  private readonly secret: string

  constructor(
    public readonly accessTokenMaxAge: number | string,
    public readonly refreshTokeMaxAge: number | string
  ) {
    this.secret = process.env.JWT_SECRET!
  }

  generateAccessToken(payload: object): JwtToken {
    return sign(payload, this.secret, { expiresIn: this.accessTokenMaxAge })
  }

  generateRefreshToken(payload: object): JwtToken {
    return sign(payload, this.secret, { expiresIn: this.refreshTokeMaxAge })
  }

  generatePair(payload: object): JwtTokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    }
  }

  verify(token: JwtToken) {
    const result = verify(token, this.secret)
    return result as Object
  }
}
