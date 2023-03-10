import { createServer } from "../src/server"
import dotenv from "dotenv"
import { FastifyInstance } from "fastify"
import { Application } from "../src/Application"
import { ApplicationEnvironment } from "../src/enums"
import { CookieRefreshTokenName } from "../src/services/CookieService"
import { JwtService } from "../src/services/JwtService"
import { UserModel } from "../src/db/UserModel"

dotenv.config()

let fastify: FastifyInstance

beforeAll(async () => {
  fastify = await createServer(new Application(ApplicationEnvironment.Test))
})

afterAll(async () => {
  await fastify.close()
})

afterEach(async () => {
  await fastify.app.userService.deleteAll()
})

describe("refresh token via cookie", () => {
  it("fails to refresh without refreshToken in cookie header", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/api/refresh",
    })

    expect(response.statusCode).toEqual(401)
  })

  it("fails to refresh with verified refreshToken of non existing user", async () => {
    const jwtService = new JwtService("1ms", "1m")
    const refreshToken = jwtService.generateRefreshToken({ id: "0" })

    const response = await fastify.inject({
      method: "GET",
      url: "/api/refresh",
      cookies: {
        [CookieRefreshTokenName]: refreshToken,
      },
    })

    expect(response.statusCode).toEqual(404)
  })

  it("successfully updates refreshToken and returns new token pair", async () => {
    const jwtService = new JwtService("1ms", "1m")
    const userService = fastify.app.userService
    const user = UserModel.New()
    const refreshToken = jwtService.generateRefreshToken({ id: user.id })
    user.refreshToken = refreshToken
    await userService.save(user)

    const response = await fastify.inject({
      method: "GET",
      url: "/api/refresh",
      cookies: {
        [CookieRefreshTokenName]: refreshToken,
      },
    })

    expect(response.statusCode).toEqual(200)
    const data = response.json()
    expect(typeof data.accessToken).toEqual("string")
    expect(typeof data.refreshToken).toEqual("string")
  })

  it("fails to generate new token pair if given refreshToken is expired", async () => {
    const jwtService = new JwtService("1ms", "1ms")
    const userService = fastify.app.userService
    const user = UserModel.New()
    const refreshToken = jwtService.generateRefreshToken({ id: user.id })
    user.refreshToken = refreshToken
    await userService.save(user)

    const response = await fastify.inject({
      method: "GET",
      url: "/api/refresh",
      cookies: {
        [CookieRefreshTokenName]: refreshToken,
      },
    })

    //todo: temporary solution - server error has been thrown
    expect(response.statusCode).toEqual(500)
    const data = response.json()
    expect(data.message).toEqual("jwt expired")
  })
})

describe("logout via cookie", () => {
  it("fails to logout without refreshToken in cookie header", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/api/logout",
    })

    expect(response.statusCode).toEqual(401)
  })

  it("fails to logout with verified refreshToken of non existing user", async () => {
    //todo
    //what if refreshToken is expired?
    //only authenticated user can logout? (required presence of accessToken in request)
    //what if token contains invalid payload data? (wrong type)

    const jwtService = new JwtService("1ms", "1m")
    const refreshToken = jwtService.generateRefreshToken({ id: "0" })

    const response = await fastify.inject({
      method: "GET",
      url: "/api/logout",
      cookies: {
        [CookieRefreshTokenName]: refreshToken,
      },
    })

    expect(response.statusCode).toEqual(404)
  })

  it("successfully allows user to logout using refreshToken", async () => {
    const jwtService = new JwtService("1ms", "1m")
    const userService = fastify.app.userService
    const user = UserModel.New()
    await userService.save(user)
    const refreshToken = jwtService.generateRefreshToken({ id: user.id })

    const response = await fastify.inject({
      method: "GET",
      url: "/api/logout",
      cookies: {
        [CookieRefreshTokenName]: refreshToken,
      },
    })

    expect(response.statusCode).toEqual(200)
  })

  it.todo("user can logout all sessions")
})
