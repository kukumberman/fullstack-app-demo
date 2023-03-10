import { FastifyRequest, FastifyReply } from "fastify"
import { CookieAccessTokenName } from "./services/CookieService"
import { UserModel } from "./db/UserModel"
import { TokenType } from "./services/JwtService"
import { UserTokenPayload } from "./types"

declare module "fastify" {
  interface FastifyRequest {
    userPayload: UserTokenPayload | undefined
    currentUser: UserModel | undefined
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
    if (typeof id === "string") {
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

export function throwErrorIfUserPayloadNotFound(
  request: FastifyRequest,
  reply: FastifyReply,
  next: CallableFunction
) {
  if (request.userPayload === undefined) {
    reply.code(401)
    throw new Error("Payload not found")
  }
  next()
}

export function throwErrorIfUserModelNotFound(
  request: FastifyRequest,
  reply: FastifyReply,
  next: CallableFunction
) {
  if (request.currentUser === undefined) {
    reply.code(404)
    throw new Error("User not found")
  }
  next()
}
