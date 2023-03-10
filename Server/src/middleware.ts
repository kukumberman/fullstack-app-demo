import { FastifyRequest, FastifyReply } from "fastify"
import { CookieAccessTokenName } from "./constants"
import { UserModel } from "./db/UserModel"
import { AccessTokenExpiredError, UnauthorizedError } from "./errors"
import { TokenExpiredError, TokenType } from "./services/JwtService"
import { UserTokenPayload } from "./types"

declare module "fastify" {
  interface FastifyRequest {
    user: any
    userPayload: UserTokenPayload | undefined
    currentUser: UserModel | undefined
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

function verifyAndAssignUserPayloadToRequest(
  tokenWithType: string,
  request: FastifyRequest
): boolean {
  const jwtService = request.server.app.jwtService
  const entries = tokenWithType.split(" ")

  if (entries.length !== 2) {
    return false
  }

  if (entries[0] !== TokenType) {
    return false
  }

  try {
    const payload: any = jwtService.verify(entries[1])
    const id = payload.id
    if (id !== undefined) {
      request.userPayload = { id }
      return true
    }
  } catch (e) {}

  return false
}

export function silentFetchUserPayloadFromHeaderOrCookie(
  request: FastifyRequest,
  reply: FastifyReply,
  next: CallableFunction
) {
  const authorizationHeader: string | undefined = request.headers.authorization
  const resultFromHeader: boolean =
    authorizationHeader !== undefined &&
    verifyAndAssignUserPayloadToRequest(authorizationHeader, request)

  if (!resultFromHeader) {
    const cookieAccessToken: string | undefined = request.cookies[CookieAccessTokenName]
    const resultFromCookie =
      cookieAccessToken !== undefined &&
      verifyAndAssignUserPayloadToRequest(cookieAccessToken, request)
  }

  next()
}

export async function silentFetchUserModelFromPayload(
  request: FastifyRequest,
  reply: FastifyReply,
  next: CallableFunction
) {
  if (request.userPayload !== undefined) {
    const id = request.userPayload.id
    const userService = request.server.app.userService
    request.currentUser = await userService.findOneById(id)
  }

  next()
}

export function throwErrorIfUserNotFound(request: FastifyRequest, reply: FastifyReply) {
  if (request.currentUser === undefined) {
    throw new Error("User not found")
  }
}
