import Fastify, { FastifyInstance } from "fastify"
import fastifyCookie from "@fastify/cookie"

import { Application } from "./Application"
import {
  silentFetchUserPayloadFromHeaderOrCookie,
  silentFetchUserModelFromPayload,
} from "./middleware"
import { useRoutes } from "./routes"

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

  await fastify.register(import("@fastify/swagger"), {
    swagger: {
      info: {
        title: "Test swagger",
        description: "Testing the Fastify swagger API",
        version: "0.1.0",
      },
    },
  })

  await fastify.register(import("@fastify/swagger-ui"), {
    routePrefix: "/swagger",
  })

  fastify.get("/ping", (request, reply) => {
    return { message: "pong" }
  })

  useRoutes(fastify)

  return fastify
}
