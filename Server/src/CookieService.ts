import { FastifyReply } from "fastify"
import { CookieAccessTokenName, CookieRefreshTokenName } from "./constants"
import { JwtTokenPair } from "./types"

export class CookieService {
  constructor() {
    //todo: expiration date at least for refreshToken
  }

  setTokens(reply: FastifyReply, tokenPair: JwtTokenPair) {
    this.setAccessToken(reply, tokenPair.accessToken)
    this.setRefreshToken(reply, tokenPair.refreshToken)
  }

  setAccessToken(reply: FastifyReply, value: string) {
    reply.setCookie(CookieAccessTokenName, value, { path: "/", httpOnly: false })
  }

  setRefreshToken(reply: FastifyReply, value: string) {
    reply.setCookie(CookieRefreshTokenName, value, { path: "/", httpOnly: true })
  }
}
