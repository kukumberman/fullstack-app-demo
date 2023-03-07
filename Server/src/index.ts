import dotenv from "dotenv"
import { FastifyListenOptions } from "fastify"
import { createServer } from "./server"

dotenv.config()

const server = createServer()

const PORT = +process.env.PORT!

const opts: FastifyListenOptions = {
  port: PORT,
}

async function main() {
  try {
    const address = await server.listen(opts)
    server.log.info(`Server listening at ${address}`)
    server.db.connect()
  } catch (e) {
    console.log(e)
  }
}

main()
