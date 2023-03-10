import { createServer } from "../src/server"
import dotenv from "dotenv"
import { FastifyInstance } from "fastify"
import { Application } from "../src/Application"
import { ApplicationEnvironment } from "../src/enums"
import { JwtService } from "../src/services/JwtService"

dotenv.config()

let fastify: FastifyInstance

beforeAll(async () => {
  fastify = await createServer(new Application(ApplicationEnvironment.Test))
})

afterAll(async () => {
  await fastify.close()
})

//todo: same problem as before
const tempPayload = { id: "0" }

describe("leaderboard", () => {
  it("fails to fetch leaderboard entries without accessToken in header", async () => {
    const response = await fastify.inject({
      method: "GET",
      url: "/api/leaderboard",
    })

    expect(response.statusCode).toEqual(401)
  })

  it("successfully fetches leaderboard entries using accessToken in header", async () => {
    const jwtService = new JwtService("1m", "5m")
    const accessToken = jwtService.generateAccessToken(tempPayload)

    const response = await fastify.inject({
      method: "GET",
      url: "/api/leaderboard",
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    })

    const data = response.json()
    expect(response.statusCode).toEqual(200)
    expect(Array.isArray(data)).toEqual(true)
  })
})
