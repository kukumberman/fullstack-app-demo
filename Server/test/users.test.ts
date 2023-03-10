import { createServer } from "../src/server"
import dotenv from "dotenv"
import { FastifyInstance } from "fastify"
import { CustomError, ErrorType } from "../src/errors"
import { Application } from "../src/Application"
import { ApplicationEnvironment } from "../src/enums"
import { JwtService } from "../src/services/JwtService"
import { sleep } from "../src/utils"

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

//todo: temporary token contains wrong payload, should it validate presense of user in database?
const tempPayload = { id: "0" }

describe("/api/users", () => {
  it("fails to fetch array of users without accessToken", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/api/users",
    })

    expect(response.statusCode).toEqual(401)
  })

  it("successfully fetches array of users using accessToken", async () => {
    const jwtService = new JwtService("1s", "5s")
    const accessToken = jwtService.generateAccessToken(tempPayload)

    const response = await fastify.inject({
      method: "GET",
      url: "/api/users",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    expect(response.statusCode).toEqual(200)
    const data = response.json()
    expect(Array.isArray(data)).toBe(true)
  })

  it("fails to fetch array of users with expired token", async () => {
    const jwtService = new JwtService("1ms", "5s")
    const accessToken = jwtService.generateAccessToken(tempPayload)

    await sleep(5)

    const response = await fastify.inject({
      method: "GET",
      url: "/api/users",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    expect(response.statusCode).toEqual(401)
  })
})
