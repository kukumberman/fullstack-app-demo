import { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginOptions } from "fastify"

function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  return { message: "Login" }
}

function registerHandler(request: FastifyRequest, reply: FastifyReply) {
  return { message: "Register" }
}

export function routes(fastify: FastifyInstance, opts: FastifyPluginOptions, done: Function) {
  fastify.get("/login", loginHandler)
  fastify.get("/register", registerHandler)
  done()
}
