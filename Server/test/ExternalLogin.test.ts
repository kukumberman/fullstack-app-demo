import { ExternalLogin } from "../src/utils/ExternalLogin"
import { sleep } from "../src/utils"

let externalLogin: ExternalLogin

const expirationTimeInMs = 100
const expirationTimeInSeconds = expirationTimeInMs / 1000
const sleepShortDelayMs = 50
const sleepLongDelayMs = 200

beforeEach(() => {
  externalLogin = new ExternalLogin(expirationTimeInSeconds)
})

describe("ExternalLogin", () => {
  it("has no entries by default", () => {
    expect(externalLogin.entriesCount).toEqual(0)
  })

  it("grows in size as entries are added", () => {
    externalLogin.addEntry("123", "token")
    expect(externalLogin.entriesCount).toEqual(1)

    externalLogin.addEntry("456", "token")
    expect(externalLogin.entriesCount).toEqual(2)
  })

  it("immediately clears all entries", () => {
    externalLogin.addEntry("123", "token")
    externalLogin.addEntry("456", "token")
    externalLogin.clear()
    expect(externalLogin.entriesCount).toEqual(0)
  })

  it("can not store two or more entries by the same key", () => {
    const key = "123"
    externalLogin.addEntry(key, "token1st")
    externalLogin.addEntry(key, "token2nd")
    expect(externalLogin.entriesCount).toEqual(1)
  })

  it("fails to pop if no entry are present by given key", () => {
    const entry: string | undefined = externalLogin.popEntry("123")
    expect(entry).toEqual(undefined)
    expect(externalLogin.entriesCount).toEqual(0)
  })

  it("successfully pops entry", () => {
    const key = "123"
    const tokenToSave = "token"
    externalLogin.addEntry(key, tokenToSave)
    const token: string | undefined = externalLogin.popEntry(key)
    expect(externalLogin.entriesCount).toEqual(0)
    expect(token).toEqual(tokenToSave)
  })

  it("successfully removes expired entries", async () => {
    externalLogin.addEntry("1", "token")
    externalLogin.addEntry("2", "token")

    await sleep(sleepShortDelayMs)
    externalLogin.tryRemoveExpiredEntries()
    expect(externalLogin.entriesCount).toEqual(2)

    await sleep(sleepLongDelayMs)
    externalLogin.tryRemoveExpiredEntries()
    expect(externalLogin.entriesCount).toEqual(0)
  })
})
