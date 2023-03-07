import { createServer } from "../src/server"
import dotenv from "dotenv"

dotenv.config()

describe("example", () => {
  it("successfully makes request to api root endpoint", async () => {
    const fastify = createServer()
    await fastify.db.connect()

    const response = await fastify.inject({
      method: "GET",
      url: "/api",
    })

    const data = response.json()
    expect(response.statusCode).toEqual(200)
    expect(data.message).toEqual("api")
  })
})
