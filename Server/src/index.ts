import "module-alias/register"
import dotenv from "dotenv"
import { FastifyListenOptions } from "fastify"
import { Application } from "./Application"
import { ApplicationEnvironment } from "./enums"
import { createServer } from "@src/server"

dotenv.config()

const PORT = +process.env.PORT!

const opts: FastifyListenOptions = {
  port: PORT,
}

async function main() {
  try {
    const server = await createServer(new Application(ApplicationEnvironment.Development))
    const address = await server.listen(opts)
    console.log(`Server listening at ${address}`)
  } catch (e) {
    console.log(e)
  }
}

main()
