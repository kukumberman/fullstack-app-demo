import fastifyCookie from "@fastify/cookie"
import fastifyJwt from "@fastify/jwt"

import { routes } from "./userController"
import { registerOAuth2 } from "./oauth"
import { UserDatabase } from "./db/lowdb"
import { UserIdentifier } from "./utils"
import { UserModel } from "./db/UserModel"
import Fastify, { FastifyInstance } from "fastify"

export function createServer(): FastifyInstance {
  const app: FastifyInstance = Fastify({ logger: true })

  const db = new UserDatabase("users")
  app.decorate("db", db)

  app.register(fastifyCookie, {
    secret: process.env.COOKIE_SECRET!,
  })

  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
  })

  app.get("/", async (request, reply) => {
    try {
      const user: UserModel | null = await UserIdentifier.getUserFromCookie(request)
      if (user != null) {
        return user
      }
    } catch (error) {
      console.log(error)
      return error
    }
    return { message: "Hello, World!" }
  })

  app.get("/api", (request, reply) => {
    return { message: "api" }
  })

  app.register(routes, { prefix: "/api/user" })

  registerOAuth2(app)

  return app
}
