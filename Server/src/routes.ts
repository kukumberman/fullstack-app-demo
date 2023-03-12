import { FastifyInstance } from "fastify"
import {
  silentFetchUserPayloadFromHeaderOrCookie,
  silentFetchUserModelFromPayload,
  throwErrorIfUserPayloadNotFound,
  throwErrorIfUserModelNotFound,
} from "@src/middleware"
import {
  userLoginHandler,
  userRegisterHandler,
  getAllUsersHandler,
  userLogoutHandler,
  refreshTokenHandler,
  leaderboardHandler,
} from "@src/routes/userController"
import {
  externalLoginHandler,
  platformLoginHandler,
  allPlatformsHandler,
  loginCallbackHandler,
  QuerySession,
  ParamPlatform,
  disconnectHandler,
} from "@src/routes/oauth2"
import { clickHandler, profileInfoHandler } from "@src/routes/profile"

export function useRoutes(fastifyInstance: FastifyInstance) {
  fastifyInstance.post("/api/login", userLoginHandler)
  fastifyInstance.post("/api/register", userRegisterHandler)
  fastifyInstance.get(
    "/api/users",
    { preHandler: [silentFetchUserPayloadFromHeaderOrCookie, throwErrorIfUserPayloadNotFound] },
    getAllUsersHandler
  )
  fastifyInstance.get("/api/logout", userLogoutHandler)
  fastifyInstance.get("/api/refresh", refreshTokenHandler)
  fastifyInstance.get(
    "/api/leaderboard",
    { preHandler: [silentFetchUserPayloadFromHeaderOrCookie, throwErrorIfUserPayloadNotFound] },
    leaderboardHandler
  )
  fastifyInstance.get<ParamPlatform>(
    "/api/disconnect/:platform",
    {
      preHandler: [
        silentFetchUserPayloadFromHeaderOrCookie,
        throwErrorIfUserPayloadNotFound,
        silentFetchUserModelFromPayload,
        throwErrorIfUserModelNotFound,
      ],
    },
    disconnectHandler
  )

  fastifyInstance.get("/login/external", externalLoginHandler)
  fastifyInstance.get<QuerySession>(
    "/login/all",
    { preHandler: [silentFetchUserPayloadFromHeaderOrCookie, silentFetchUserModelFromPayload] },
    allPlatformsHandler
  )
  fastifyInstance.get<ParamPlatform & QuerySession>(
    "/login/:platform",
    { preHandler: [silentFetchUserPayloadFromHeaderOrCookie, silentFetchUserModelFromPayload] },
    platformLoginHandler
  )
  fastifyInstance.get("/login/:platform/callback", loginCallbackHandler)

  fastifyInstance.get(
    "/api/profile/click",
    {
      preHandler: [
        silentFetchUserPayloadFromHeaderOrCookie,
        throwErrorIfUserPayloadNotFound,
        silentFetchUserModelFromPayload,
        throwErrorIfUserModelNotFound,
      ],
    },
    clickHandler
  )

  fastifyInstance.get(
    "/api/profile/me",
    {
      preHandler: [
        silentFetchUserPayloadFromHeaderOrCookie,
        throwErrorIfUserPayloadNotFound,
        silentFetchUserModelFromPayload,
        throwErrorIfUserModelNotFound,
      ],
    },
    profileInfoHandler
  )
}
