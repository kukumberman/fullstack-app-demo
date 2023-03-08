import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"
import { CustomError, ErrorType } from "./errors"

type BodyParams = {
  email: string | undefined
  password: string | undefined
}

function loginHandler(request: FastifyRequest<{ Body: BodyParams }>, reply: FastifyReply) {
  return { message: "Login" }
}

async function registerHandler(request: FastifyRequest<{ Body: BodyParams }>, reply: FastifyReply) {
  const email = request.body.email
  const password = request.body.password

  if (email === undefined || password === undefined) {
    const error = new CustomError(400, ErrorType.EmptyFields)
    reply.code(error.statusCode)
    return error
  }

  try {
    const user = await request.server.app.userService.signUp(email, password)
    return {
      id: user.data.id,
    }
  } catch (error: any) {
    if (error instanceof CustomError) {
      reply.code(error.statusCode)
      return error
    }
  }
}

export function routes(fastify: FastifyInstance) {
  fastify.post("/api/login", loginHandler)
  fastify.post("/api/register", registerHandler)
}
