import { FastifyRequest, FastifyReply } from "fastify"
import { CookieAccessTokenName } from "./constants"
import { AccessTokenExpiredError, UnauthorizedError } from "./errors"
import { TokenExpiredError } from "./JwtService"
import { UserTokenPayload } from "./types"

declare module "fastify" {
  interface FastifyRequest {
    user: any
  }
}

export async function verifyAccessTokenFromHeader(request: FastifyRequest, reply: FastifyReply) {
  const jwtService = request.server.app.jwtService
  const authorizationHeader: string | undefined = request.headers.authorization

  if (authorizationHeader === undefined) {
    throw new UnauthorizedError()
  }

  const accessToken: string | undefined = authorizationHeader.split(" ")[1]
  if (accessToken === undefined) {
    throw new UnauthorizedError()
  }

  try {
    const payload = jwtService.verify(accessToken) as UserTokenPayload
    request.user = payload
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      throw new AccessTokenExpiredError()
    }

    throw error
  }
}

export async function verifyAccessTokenFromCookie(request: FastifyRequest, reply: FastifyReply) {
  const jwtService = request.server.app.jwtService
  const accessToken: string | undefined = request.cookies[CookieAccessTokenName]

  if (accessToken === undefined) {
    throw new UnauthorizedError()
  }

  try {
    const payload = jwtService.verify(accessToken) as UserTokenPayload
    request.user = payload
  } catch (error: any) {
    if (error instanceof TokenExpiredError) {
      throw new AccessTokenExpiredError()
    }

    throw error
  }
}
