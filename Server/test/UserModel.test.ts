import { UserModel } from "../src/db/UserModel"
import { PlatformDisconnectResult } from "@src/enums"
import { placeholderDiscordSignInFields, placeholderGoogleSignInFields } from "./constants"

let user: UserModel

beforeEach(() => {
  user = UserModel.New()
})

describe("nickname", () => {
  it("has no history by default", () => {
    expect(user.data.app.nickname.timesUpdated).toEqual(0)
    expect(user.data.app.nickname.history.length).toEqual(0)
  })

  it("fails to set same nickname", () => {
    const currentValue = user.nickname
    const operationResult = user.updateNickname(currentValue)
    expect(operationResult).toBe(false)
    expect(user.data.app.nickname.timesUpdated).toEqual(0)
    expect(user.data.app.nickname.history.length).toEqual(0)
  })

  it("successfully updates nickname to new value", () => {
    const currentNickname = user.nickname
    const nickname1st = "test-user-1"
    const nickname2nd = "test-user-2"

    const result1 = user.updateNickname(nickname1st)
    expect(result1).toBe(true)
    expect(user.nickname).toEqual(nickname1st)
    expect(user.data.app.nickname.timesUpdated).toEqual(1)
    expect(user.data.app.nickname.history.length).toEqual(1)
    expect(user.data.app.nickname.history[0]).toEqual(currentNickname)

    const result2 = user.updateNickname(nickname2nd)
    expect(result2).toBe(true)
    expect(user.nickname).toEqual(nickname2nd)
    expect(user.data.app.nickname.timesUpdated).toEqual(2)
    expect(user.data.app.nickname.history.length).toEqual(2)
    expect(user.data.app.nickname.history[1]).toEqual(nickname1st)
  })
})

describe("disconnect", () => {
  it("fails to disconnect when have only one platform and has no standard login", () => {
    user.data.signIn.platforms.google = placeholderGoogleSignInFields
    const result = user.tryDisconnect("google")
    expect(result).toBe(PlatformDisconnectResult.AtLeastOneRequired)
  })

  it("fails to disconnect not connected profile", () => {
    const result = user.tryDisconnect("google")
    expect(result).toBe(PlatformDisconnectResult.NotConnected)
  })

  it("successfully disconnects platform when user has 2 or more connected platforms", () => {
    user.data.signIn.platforms.google = placeholderGoogleSignInFields
    user.data.signIn.platforms.discord = placeholderDiscordSignInFields

    const result1 = user.tryDisconnect("google")
    expect(result1).toBe(PlatformDisconnectResult.Disconnected)

    const result2 = user.tryDisconnect("discord")
    expect(result2).toBe(PlatformDisconnectResult.AtLeastOneRequired)

    const result3 = user.tryDisconnect("google")
    expect(result3).toBe(PlatformDisconnectResult.NotConnected)
  })

  it("successfully disconnects all platform when user standard login method", () => {
    user.data.signIn.platforms.google = placeholderGoogleSignInFields
    user.data.signIn.platforms.discord = placeholderDiscordSignInFields
    user.data.signIn.standard = {
      email: "",
      password: "",
    }

    const result1 = user.tryDisconnect("google")
    expect(result1).toBe(PlatformDisconnectResult.Disconnected)

    const result2 = user.tryDisconnect("discord")
    expect(result2).toBe(PlatformDisconnectResult.Disconnected)
  })
})
