import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { CustomError, ErrorType } from "./errors"
import { verifyAccessTokenFromHeader, verifyAccessTokenFromCookie } from "./middleware"

type BodyParams = {
  email: any | undefined
  password: any | undefined
}

async function loginHandler(request: FastifyRequest<{ Body: BodyParams }>, reply: FastifyReply) {
  const email = request.body.email
  const password = request.body.password

  if (
    email === undefined ||
    typeof email !== "string" ||
    password === undefined ||
    typeof password !== "string"
  ) {
    const error = new CustomError(400, ErrorType.EmptyFields)
    reply.code(error.statusCode)
    return error
  }

  const userService = request.server.app.userService
  const jwtService = request.server.app.jwtService
  const cookieService = request.server.app.cookieService

  try {
    const user = await userService.signIn(email, password)
    const tokenPayload = { id: user.data.id }
    const tokenPair = jwtService.generatePair(tokenPayload)
    user.refreshToken = tokenPair.refreshToken
    cookieService.setTokens(reply, tokenPair)
    await userService.save(user)
    return tokenPair
  } catch (error: any) {
    if (error instanceof CustomError) {
      reply.code(error.statusCode)
      return error
    }
    return error
  }
}

async function registerHandler(request: FastifyRequest<{ Body: BodyParams }>, reply: FastifyReply) {
  const email = request.body.email
  const password = request.body.password

  if (
    email === undefined ||
    typeof email !== "string" ||
    password === undefined ||
    typeof password !== "string"
  ) {
    const error = new CustomError(400, ErrorType.EmptyFields)
    reply.code(error.statusCode)
    return error
  }

  const userService = request.server.app.userService
  const jwtService = request.server.app.jwtService
  const cookieService = request.server.app.cookieService

  try {
    const user = await userService.signUp(email, password)
    const tokenPayload = { id: user.data.id }
    const tokenPair = jwtService.generatePair(tokenPayload)
    user.refreshToken = tokenPair.refreshToken
    cookieService.setTokens(reply, tokenPair)
    await userService.save(user)
    return tokenPair
  } catch (error: any) {
    if (error instanceof CustomError) {
      reply.code(error.statusCode)
      return error
    }
    return error
  }
}

async function getAllUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  //todo: only public (non sensitive) data per each user
  const userService = request.server.app.userService
  const users = await userService.getAll()
  return users
}

export function routes(fastify: FastifyInstance) {
  fastify.post("/api/login", loginHandler)
  fastify.post("/api/register", registerHandler)
  fastify.get("/api/users", { preHandler: [verifyAccessTokenFromHeader] }, getAllUsersHandler)
}
