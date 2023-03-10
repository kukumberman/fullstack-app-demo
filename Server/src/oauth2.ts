import { createHash } from "crypto"
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify"
import { AccessToken } from "simple-oauth2"
import { OAuth2Handler } from "./auth/OAuth2Handler"
import { UserModel } from "./db/UserModel"

const EmptyState = "none"

//todo: move crypto functions separate file
function encode(data: string): string {
  return createHash("sha256").update(data).digest("hex")
}

function signState(id: string): string {
  const secret = "key123"
  const hash = encode(`${id}-${secret}`)
  return id + "." + hash
}

function verifyState(hash: string): boolean {
  return hash === signState(getIdFromHash(hash))
}

function getIdFromHash(hash: string): string {
  return hash.split(".")[0]
}

export function registerOAuth2(fastifyInstance: FastifyInstance) {
  fastifyInstance.get("/login/all", allPlatformsHandler)
  fastifyInstance.get("/login/:platform", loginHandler)
  fastifyInstance.get("/login/:platform/callback", loginCallbackHandler)
}

type LoginRequest = {
  Params: {
    platform: string
  }
  //! Querystring: {
  //   session: string | undefined
  // }
}

type LoginCallbackRequest = {
  Querystring: {
    code: string | undefined
    state: string | undefined
  }
  Params: {
    platform: string
  }
}

function loginHandler(request: FastifyRequest<LoginRequest>, reply: FastifyReply) {
  const platform = request.params.platform
  //! const session: string | undefined = request.query.session

  const oauth2Service = request.server.app.oauth2Service
  const oauth2Handler: OAuth2Handler | undefined = oauth2Service.find(platform)

  if (oauth2Handler === undefined) {
    return {
      ok: false,
      message: "no platform",
    }
  }

  //todo - generate state based on user.id if it present in cookie/header
  const state = EmptyState
  return oauth2Handler.getPublicData(state)
}

function allPlatformsHandler(request: FastifyRequest, reply: FastifyReply) {
  //todo - same as above
  const state = EmptyState
  const oauth2Service = request.server.app.oauth2Service
  const data = oauth2Service.getAllPlatformsData(state)
  return data
}

async function loginCallbackHandler(
  request: FastifyRequest<LoginCallbackRequest>,
  reply: FastifyReply
) {
  const platform: string = request.params.platform

  const oauth2Service = request.server.app.oauth2Service
  const oauth2Handler: OAuth2Handler | undefined = oauth2Service.find(platform)

  if (oauth2Handler === undefined) {
    return {
      ok: false,
      message: "no platform",
    }
  }

  const code: string | undefined = request.query.code
  const state: string | undefined = request.query.state

  if (code === undefined) {
    return {
      ok: false,
      message: "no code",
    }
  }

  if (state === undefined) {
    return {
      ok: false,
      message: "no state",
    }
  }

  if (state !== EmptyState) {
    if (!verifyState(state)) {
      return {
        ok: false,
        message: "state compromised",
      }
    }
  }

  let accessToken: AccessToken

  try {
    accessToken = await oauth2Handler.getToken(code)
  } catch (e: any) {
    const error = e as Error
    console.log(error.name)
    console.log(error.message)
    console.log(error.stack)
    return {
      ok: false,
    }
  }

  const token = accessToken.token
  const data = await oauth2Handler.fetchProfile(token)

  const userService = request.server.app.userService
  const jwtService = request.server.app.jwtService
  const cookieService = request.server.app.cookieService

  let userId: string

  //todo
  //add entry to external login
  //handle case when 1st part of state is user.id

  if (state === EmptyState) {
    const userWithConnectedPlatform: UserModel | undefined =
      await oauth2Handler.findUserWithSamePlatform(userService, data)

    if (userWithConnectedPlatform !== undefined) {
      oauth2Handler.assignOrUpdateFields(userWithConnectedPlatform, data)
      await userService.save(userWithConnectedPlatform)
      userId = userWithConnectedPlatform.id
    } else {
      const newUser = UserModel.New()
      oauth2Handler.assignOrUpdateFields(newUser, data)
      await userService.save(newUser)
      userId = newUser.id
    }

    const tokenPair = jwtService.generatePair({ id: userId })
    cookieService.setTokens(reply, tokenPair)
    reply.redirect("/")
  } else {
    return {
      message: "todo",
    }
  }
}
