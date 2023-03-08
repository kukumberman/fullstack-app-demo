import { createServer } from "../src/server"
import dotenv from "dotenv"
import { FastifyInstance } from "fastify"
import { CustomError, ErrorType } from "../src/errors"
import { Application } from "../src/Application"
import { ApplicationEnvironment } from "../src/enums"

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

describe("login", () => {
  it("fails to login user without both fields", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/login",
      payload: {},
    })

    const data = response.json() as CustomError
    expect(response.statusCode).toEqual(400)
    expect(data.statusCode).toEqual(400)
    expect(data.error).toEqual(ErrorType[ErrorType.EmptyFields])
  })

  it("fails to login user without email", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/login",
      payload: {
        password: "123",
      },
    })

    const data = response.json() as CustomError
    expect(response.statusCode).toEqual(400)
    expect(data.statusCode).toEqual(400)
    expect(data.error).toEqual(ErrorType[ErrorType.EmptyFields])
  })

  it("fails to login user without password", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/login",
      payload: {
        email: "test@email.com",
      },
    })

    const data = response.json() as CustomError
    expect(response.statusCode).toEqual(400)
    expect(data.statusCode).toEqual(400)
    expect(data.error).toEqual(ErrorType[ErrorType.EmptyFields])
  })

  it("fails to login with not existing email", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/login",
      payload: {
        email: "test@email.com",
        password: "",
      },
    })

    const data = response.json() as CustomError
    expect(response.statusCode).toEqual(400)
    expect(data.statusCode).toEqual(400)
    expect(data.error).toEqual(ErrorType[ErrorType.SignInNoUserWithGivenEmail])
  })

  it("successfull register and login", async () => {
    const email = "test@email.com"
    const password = "123"

    const responseRegister = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {
        email,
        password,
      },
    })

    expect(responseRegister.statusCode).toEqual(200)

    const responseLogin = await fastify.inject({
      method: "POST",
      url: "/api/login",
      payload: {
        email,
        password,
      },
    })

    expect(responseLogin.statusCode).toEqual(200)
  })

  it("fails to login with wrong password", async () => {
    const email = "test@email.com"
    const password = "123"
    const wrongPassword = "456"

    const responseRegister = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {
        email,
        password,
      },
    })

    expect(responseRegister.statusCode).toEqual(200)

    const responseLogin = await fastify.inject({
      method: "POST",
      url: "/api/login",
      payload: {
        email,
        password: wrongPassword,
      },
    })

    const dataLogin = responseLogin.json() as CustomError
    expect(responseLogin.statusCode).toEqual(400)
    expect(dataLogin.statusCode).toEqual(400)
    expect(dataLogin.error).toEqual(ErrorType[ErrorType.SignInWrongPassword])
  })
})
