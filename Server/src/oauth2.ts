import { FastifyReply, FastifyRequest } from "fastify"
import { AccessToken } from "simple-oauth2"
import { OAuth2Handler } from "./auth/OAuth2Handler"
import { UserModel } from "./db/UserModel"
import { JwtTokenPair } from "./types"

const ExternalPrefix = "EXTERNAL_"
const EmptyState = "none"

export type ParamPlatform = {
  Params: {
    platform: string
  }
}

export type QuerySession = {
  Querystring: {
    session: string | undefined
  }
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

function makeExternalSession(session: string): string {
  return ExternalPrefix + session
}

function getSignData(request: FastifyRequest<QuerySession>): string {
  const session: string | undefined = request.query.session

  if (request.currentUser !== undefined) {
    return request.currentUser.id
  }

  if (session !== undefined && session.length > 0) {
    return makeExternalSession(session)
  }

  return EmptyState
}

export function platformLoginHandler(
  request: FastifyRequest<ParamPlatform & QuerySession>,
  reply: FastifyReply
) {
  const platform = request.params.platform

  const oauth2Service = request.server.app.oauth2Service
  const oauth2Handler: OAuth2Handler | undefined = oauth2Service.find(platform)

  if (oauth2Handler === undefined) {
    return {
      ok: false,
      message: "no platform",
    }
  }

  const toSign = getSignData(request)
  const state = oauth2Service.signer.signState(toSign)
  return oauth2Handler.getPublicData(state)
}

export function allPlatformsHandler(request: FastifyRequest<QuerySession>, reply: FastifyReply) {
  const oauth2Service = request.server.app.oauth2Service
  const toSign = getSignData(request)
  const state = oauth2Service.signer.signState(toSign)
  const data = oauth2Service.getAllPlatformsData(state)
  return data
}

export async function loginCallbackHandler(
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

  const emptyStateSigned = oauth2Service.signer.signState(EmptyState)

  if (state !== emptyStateSigned) {
    if (!oauth2Service.signer.verifyState(state)) {
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
      message: error.message,
    }
  }

  const token = accessToken.token
  const data = await oauth2Handler.fetchProfile(token)

  if (!oauth2Handler.isDataValid(data)) {
    return {
      ok: false,
      message: "failed to validate data (probably structure was changed)",
      data,
    }
  }

  const userService = request.server.app.userService
  const jwtService = request.server.app.jwtService
  const cookieService = request.server.app.cookieService

  let userId: string

  let useExternalLogin = false
  let externalLoginSession = ""

  if (state === emptyStateSigned) {
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
  } else {
    const payload = oauth2Service.signer.decodeState(state)
    if (payload.startsWith(ExternalPrefix)) {
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

      useExternalLogin = true
      externalLoginSession = payload
    } else {
      const user: UserModel | undefined = await userService.findOneById(payload)
      if (user !== undefined) {
        oauth2Handler.assignOrUpdateFields(user, data)
        await userService.save(user)
        userId = user.id
      } else {
        return {
          message: "this should never happen",
        }
      }
    }
  }

  const tokenPair = jwtService.generatePair({ id: userId })
  cookieService.setTokens(reply, tokenPair)
  reply.redirect("/")

  if (useExternalLogin) {
    const externalLogin = request.server.app.externalLogin
    externalLogin.addEntry(externalLoginSession, tokenPair)
  }
}

export async function externalLoginHandler(
  request: FastifyRequest<QuerySession>,
  reply: FastifyReply
) {
  const session: string | undefined = request.query.session

  const validParameter = session !== undefined && session.length > 0

  if (!validParameter) {
    return {
      ok: false,
      message: "param",
    }
  }

  const externalLogin = request.server.app.externalLogin

  const tokenPair: JwtTokenPair | undefined = externalLogin.popEntry<JwtTokenPair>(session)

  if (tokenPair === undefined) {
    return {
      ok: false,
      message: "not found",
    }
  }

  return tokenPair
}
