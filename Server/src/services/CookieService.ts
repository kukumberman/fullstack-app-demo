import { FastifyReply } from "fastify"
import { JwtTokenPair } from "../types"
import { TokenType } from "./JwtService"

export const CookieAccessTokenName = "accessToken"

export const CookieRefreshTokenName = "refreshToken"

export class CookieService {
  constructor() {
    //todo: expiration date at least for refreshToken
  }

  setTokens(reply: FastifyReply, tokenPair: JwtTokenPair) {
    this.setAccessToken(reply, tokenPair.accessToken)
    this.setRefreshToken(reply, tokenPair.refreshToken)
  }

  setAccessToken(reply: FastifyReply, value: string) {
    reply.setCookie(CookieAccessTokenName, TokenType + " " + value, { path: "/", httpOnly: false })
  }

  setRefreshToken(reply: FastifyReply, value: string) {
    reply.setCookie(CookieRefreshTokenName, TokenType + " " + value, { path: "/", httpOnly: true })
  }
}
