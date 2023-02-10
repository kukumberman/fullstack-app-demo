import dotenv from "dotenv"
import fastify, { FastifyInstance, FastifyListenOptions } from "fastify"
import fastifyCookie from "@fastify/cookie"
import fastifyJwt from "@fastify/jwt"

import { registerOAuth2 } from "./oauth.js"

import { UserDatabase } from "./db/lowdb.js"
import { UserIdentifier } from "./utils.js"
import { UserModel } from "./db/UserModel.js"

dotenv.config()

const app: FastifyInstance = fastify({ logger: true })

const db = new UserDatabase("users")
app.decorate("db", db)

const PORT = +process.env.PORT!

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
  return { message: "hello, world" }
})

// app.get<{ Querystring: { email: string; password: string } }>(
//   "/test/login",
//   async (request, reply) => {
//     const email = request.query.email
//     const user = await request.server.db.findUserByEmail(email)
//     if (user != null) {
//       const token = request.server.jwt.sign({ id: user.data.id })
//       reply.setCookie(UserIdentifier.COOKIE_NAME, token)
//       return user.data
//     }

//     return { message: "user not found" }
//   }
// )
registerOAuth2(app)

const opts: FastifyListenOptions = {
  port: PORT,
}

app.listen(opts, async (error, address) => {
  if (error) {
    console.log(error)
    process.exit(1)
  }

  await db.connect()

  app.log.info(`Server listening at ${address}`)
})
