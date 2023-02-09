import dotenv from "dotenv"
import fetch from "node-fetch"
import fastify, { FastifyInstance, FastifyListenOptions, FastifyRegisterOptions } from "fastify"
import oauthPlugin, { FastifyOAuth2Options, OAuth2Namespace, OAuth2Token } from "@fastify/oauth2"
import fastifyCookie from "@fastify/cookie"
import fastifyJwt from "@fastify/jwt"

import UserDatabase, { UserModel } from "./db/lowdb.js"
import { generateTimestampString, RegexGuidValidator, ExternalLogin } from "./utils.js"

dotenv.config()

const db = new UserDatabase("users")

declare module "fastify" {
  interface FastifyInstance {
    discordOAuth2: OAuth2Namespace
  }
}

const app: FastifyInstance = fastify({ logger: true })

const PORT = +process.env.PORT!

app.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET!,
})

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET!,
})

const KEY_COOKIE_TOKEN = "token"

app.get("/", async (request, reply) => {
  const cookieToken: string | undefined = request.cookies[KEY_COOKIE_TOKEN]

  if (cookieToken != undefined) {
    const payload = app.jwt.verify(cookieToken) as any
    const id = payload.id
    const user = await db.findUserById(id)
    return user
  } else {
    return {
      message: "hello, world",
    }
  }
})

app.get("/login/methods", (request, reply) => {
  return ["discord"]
})

const discordOAuth2: FastifyRegisterOptions<FastifyOAuth2Options> = {
  name: "discordOAuth2",
  credentials: {
    client: {
      id: process.env.DISCORD_CLIENT_ID!,
      secret: process.env.DISCORD_CLIENT_SECRET!,
    },
    auth: oauthPlugin.fastifyOauth2.DISCORD_CONFIGURATION,
  },
  // register a fastify url to start the redirect flow
  //! startRedirectPath: "/login/discord",
  // discord redirect here after the user login
  callbackUri: `http://localhost:${PORT}/login/discord/callback`,
  scope: ["identify"],
  generateStateFunction(request: any) {
    const guid = request.query.guid
    if (guid === undefined) {
      return "none"
    }
    return guid
  },
  checkStateFunction(returnedState: string, callback: Function) {
    callback()
  },
}
app.register(oauthPlugin, discordOAuth2)

const externaLogin = new ExternalLogin()

interface IExternalLoginQuery {
  guid: string
}

app.get<{ Querystring: IExternalLoginQuery }>("/login/external", (request, reply) => {
  const guid = request.query.guid

  const token = externaLogin.popToken(guid)

  externaLogin.tryRemoveExpiredEntries()

  if (token != null) {
    return { token }
  }

  return { message: "none" }
})

interface ILoginParams {
  method: string
}

app.get<{ Params: ILoginParams }>("/login/:method", async (request, reply) => {
  const method: string = request.params.method.toLocaleLowerCase()
  const key = method + "OAuth2"
  const oauth2 = app[key as keyof FastifyInstance] as OAuth2Namespace | undefined

  if (oauth2 == undefined) {
    return { message: "no method" }
  }

  const redirect = oauth2.generateAuthorizationUri(request)
  return { redirect }
})

interface ICallbackQuery {
  state: string | undefined
}

app.get<{ Querystring: ICallbackQuery }>("/login/discord/callback", async (request, reply) => {
  const token: OAuth2Token = await app.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(
    request
  )
  const { token_type, access_token } = token.token

  //todo: separate method for discord api
  const response = await fetch("https://discord.com/api/users/@me", {
    headers: {
      Authorization: `${token_type} ${access_token}`,
    },
  })

  const fullData = (await response.json()) as any
  const { id, username, avatar, discriminator } = fullData

  const handleResponse = (id: string) => {
    const token = app.jwt.sign({ id })
    //todo: set "expire_date" (cookie and token)
    reply.setCookie(KEY_COOKIE_TOKEN, token, { path: "/" })
    reply.redirect("/")

    const state = request.query.state
    if (state != undefined && state.length > 0 && state != "none") {
      externaLogin.saveTokenInMemory(state, token)
    }
  }

  const candidate = await db.findUserByDiscordId(id)
  if (candidate != null) {
    const d = candidate.authentication.discord!
    d.id = id
    d.username = username
    d.avatar = avatar
    d.discriminator = discriminator
    d.updatedAt = generateTimestampString()
    await db.save()
    handleResponse(candidate.id)
  } else {
    const now = generateTimestampString()
    const newUser = new UserModel()
    newUser.authentication.discord = {
      id,
      username,
      avatar,
      discriminator,
      createdAt: now,
      updatedAt: now,
    }
    await db.addUser(newUser)
    handleResponse(newUser.id)
  }
})

const opts: FastifyListenOptions = {
  port: PORT,
}

app.listen(opts, async (error, address) => {
  if (error) {
    console.log(error)
    process.exit(1)
  }

  await db.connect()

  app.log.info(`Server listening at ${address}`)
})
