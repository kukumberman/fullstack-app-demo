import dotenv from "dotenv"
import { FastifyInstance } from "fastify"
import { createServer } from "@src/server"
import { Application } from "@src/Application"
import {
  ApplicationEnvironment,
  PlatformDisconnectResult,
  stringifyPlatformDisconnectResult,
} from "@src/enums"
import { JwtService, TokenType } from "@src/services/JwtService"
import { UserService } from "@src/services/UserService"
import { UserModel } from "@src/db/UserModel"
import { placeholderDiscordSignInFields, placeholderGoogleSignInFields } from "./constants"

dotenv.config()

let fastify: FastifyInstance
let userService: UserService
const jwtService = new JwtService("1m", "5m")
let user: UserModel
let authorizationHeader: string

beforeAll(async () => {
  fastify = await createServer(new Application(ApplicationEnvironment.Test))
  userService = fastify.app.userService
})

afterAll(async () => {
  await fastify.close()
})

beforeEach(async () => {
  user = UserModel.New()
  await userService.save(user)
  const accessToken = jwtService.generateAccessToken({ id: user.id })
  authorizationHeader = `${TokenType} ${accessToken}`
})

afterEach(async () => {
  await userService.deleteAll()
})

type Response = Awaited<ReturnType<typeof makeDisconnectRequest>>

function makeDisconnectRequest(platformName: string) {
  return fastify.inject({
    method: "GET",
    url: `/api/disconnect/${platformName}`,
    headers: {
      authorization: authorizationHeader,
    },
  })
}

function expectResponseMessage(response: Response, result: PlatformDisconnectResult) {
  const data = response.json()
  const message = data.message
  expect(message).toBe(stringifyPlatformDisconnectResult(result))
}

describe("/api/disconnect/*", () => {
  it("fails to disconnect invalid platform", async () => {
    const response = await makeDisconnectRequest("invalid_platform")
    expectResponseMessage(response, PlatformDisconnectResult.InvalidPlatform)
  })

  it("fails to disconnect when have only one platform and has no standard login", async () => {
    user.data.signIn.platforms.google = placeholderGoogleSignInFields
    await userService.save(user)

    const response = await makeDisconnectRequest("google")
    expectResponseMessage(response, PlatformDisconnectResult.AtLeastOneRequired)
  })

  it("fails to disconnect not connected profile", async () => {
    const response = await makeDisconnectRequest("google")
    expectResponseMessage(response, PlatformDisconnectResult.NotConnected)
  })

  it("successfully disconnects platform when user has 2 or more connected platforms", async () => {
    user.data.signIn.platforms.google = placeholderGoogleSignInFields
    user.data.signIn.platforms.discord = placeholderDiscordSignInFields
    await userService.save(user)

    const response1 = await makeDisconnectRequest("google")
    expectResponseMessage(response1, PlatformDisconnectResult.Disconnected)

    const response2 = await makeDisconnectRequest("discord")
    expectResponseMessage(response2, PlatformDisconnectResult.AtLeastOneRequired)

    const response3 = await makeDisconnectRequest("google")
    expectResponseMessage(response3, PlatformDisconnectResult.NotConnected)
  })

  it("successfully disconnects all platform when user standard login method", async () => {
    user.data.signIn.platforms.google = placeholderGoogleSignInFields
    user.data.signIn.platforms.discord = placeholderDiscordSignInFields
    user.data.signIn.standard = {
      email: "",
      password: "",
    }
    await userService.save(user)

    const response1 = await makeDisconnectRequest("google")
    expectResponseMessage(response1, PlatformDisconnectResult.Disconnected)

    const response2 = await makeDisconnectRequest("discord")
    expectResponseMessage(response2, PlatformDisconnectResult.Disconnected)
  })
})
