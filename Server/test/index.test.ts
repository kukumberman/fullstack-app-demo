import { createServer } from "../src/server"
import dotenv from "dotenv"
import { Application } from "../src/Application"
import { ApplicationEnvironment } from "../src/enums"

dotenv.config()

describe("example", () => {
  it("successfully makes request to ping endpoint", async () => {
    const fastify = await createServer(new Application(ApplicationEnvironment.Test))
    const response = await fastify.inject({
      method: "GET",
      url: "/ping",
    })

    const data = response.json()
    expect(response.statusCode).toEqual(200)
    expect(data.message).toEqual("pong")
  })
})
