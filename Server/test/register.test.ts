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

describe("register", () => {
  it("fails to register user without both fields", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {},
    })

    const data = response.json() as CustomError
    expect(response.statusCode).toEqual(400)
    expect(data.statusCode).toEqual(400)
    expect(data.error).toEqual(ErrorType[ErrorType.EmptyFields])
  })

  it("fails to register user without password", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {
        email: "test@email.com",
      },
    })

    const data = response.json() as CustomError
    expect(response.statusCode).toEqual(400)
    expect(data.statusCode).toEqual(400)
    expect(data.error).toEqual(ErrorType[ErrorType.EmptyFields])
  })

  it("fails to register user with empty email", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {
        email: "",
        password: "",
      },
    })

    const data = response.json() as CustomError
    expect(response.statusCode).toEqual(400)
    expect(data.statusCode).toEqual(400)
    expect(data.error).toEqual(ErrorType[ErrorType.SignUpInvalidEmail])
  })

  it("fails to register user with empty password", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {
        email: "test@email.com",
        password: "",
      },
    })

    const data = response.json() as CustomError
    expect(response.statusCode).toEqual(400)
    expect(data.statusCode).toEqual(400)
    expect(data.error).toEqual(ErrorType[ErrorType.SignUpInvalidPassword])
  })

  it("successfully creates user with unique email", async () => {
    const response = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {
        email: "test@email.com",
        password: "123",
      },
    })

    const data = response.json()
    expect(response.statusCode).toEqual(200)
    expect(typeof data.id).toEqual("string")
  })

  it("fails to create user with existing email", async () => {
    const responseSuccess = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {
        email: "test@email.com",
        password: "123",
      },
    })

    const responseFailed = await fastify.inject({
      method: "POST",
      url: "/api/register",
      payload: {
        email: "test@email.com",
        password: "456",
      },
    })

    const dataSuccess = responseSuccess.json()
    expect(responseSuccess.statusCode).toEqual(200)
    expect(typeof dataSuccess.id).toEqual("string")

    expect(responseFailed.statusCode).toEqual(400)
    const dataFailed = responseFailed.json() as CustomError
    expect(dataFailed.statusCode).toEqual(400)
    expect(dataFailed.error).toEqual(ErrorType[ErrorType.SignUpUserAlreadyExists])
  })
})
