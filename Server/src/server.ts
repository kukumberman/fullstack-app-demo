import Fastify, { FastifyInstance } from "fastify"
import fastifyCookie from "@fastify/cookie"
import fastifyJwt from "@fastify/jwt"

import { routes } from "./userController"
import { registerOAuth2 } from "./oauth"
import { UserIdentifier } from "./utils"
import { UserModel } from "./db/UserModel"
import { Application } from "./Application"

declare module "fastify" {
  interface FastifyInstance {
    app: Application
  }
}

export async function createServer(app: Application): Promise<FastifyInstance> {
  const fastify: FastifyInstance = Fastify({ logger: { level: "error" } })

  await app.initialize()

  fastify.decorate("app", app)

  fastify.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET!,
  })

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  })

  fastify.get("/", async (request, reply) => {
    try {
      const user: UserModel | undefined = await UserIdentifier.getUserFromCookie(request)
      if (user !== undefined) {
        return user
      }
    } catch (error) {
      console.log(error)
      return error
    }
    return { message: "Hello, World!" }
  })

  fastify.get("/api", (request, reply) => {
    return { message: "api" }
  })

  routes(fastify)

  registerOAuth2(fastify)

  return fastify
}
