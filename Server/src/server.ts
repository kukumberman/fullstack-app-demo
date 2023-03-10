import Fastify, { FastifyInstance } from "fastify"
import fastifyCookie from "@fastify/cookie"

import { routes } from "./userController"
import { registerOAuth2 } from "./oauth2"
import { UserModel } from "./db/UserModel"
import { Application } from "./Application"
import { CookieAccessTokenName, CookieRefreshTokenName } from "./constants"
import { UserTokenPayload } from "./types"
import {
  silentFetchUserPayloadFromHeaderOrCookie,
  silentFetchUserModelFromPayload,
} from "./middleware"

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

  // temporary solution (as frontend does not exist) to get info about current logged user at root page
  fastify.get(
    "/",
    { preHandler: [silentFetchUserPayloadFromHeaderOrCookie, silentFetchUserModelFromPayload] },
    async (request, reply) => {
      if (request.currentUser !== undefined) {
        return request.currentUser
      } else {
        return { message: "Hello, World!" }
      }
    }
  )

  fastify.get("/api", (request, reply) => {
    return { message: "api" }
  })

  routes(fastify)

  registerOAuth2(fastify)

  return fastify
}
