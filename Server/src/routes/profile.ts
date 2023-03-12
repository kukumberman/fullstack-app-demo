import { FastifyReply, FastifyRequest } from "fastify"

export async function clickHandler(request: FastifyRequest, reply: FastifyReply) {
  const userService = request.server.app.userService
  const user = request.currentUser!
  user.data.app.clickCounter += 1
  await userService.save(user)
  return {
    clickCounter: user.data.app.clickCounter,
  }
}

export async function profileInfoHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.currentUser!
  return user.data
}
