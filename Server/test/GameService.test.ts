import { UserModel } from "../src/db/UserModel"
import { ApplicationEnvironment } from "../src/enums"
import { GameService } from "../src/services/GameService"
import { UserServiceImpl } from "../src/services/UserServiceImpl"

const userService = new UserServiceImpl(ApplicationEnvironment.Test)
const gameService = new GameService(userService)

beforeAll(async () => {
  await userService.initialize()
})

beforeEach(async () => {
  await userService.deleteAll()
})

describe("GameService", () => {
  it("returns empty array if no users found", async () => {
    const entries = await gameService.getLeaderboardEntries()
    expect(entries.length).toEqual(0)
  })

  it("return ordered array of entries in descending order by score", async () => {
    const a = UserModel.New()
    const b = UserModel.New()
    const c = UserModel.New()

    a.score = 100
    b.score = 200
    c.score = 300

    await userService.save(a)
    await userService.save(b)
    await userService.save(c)

    const entries = await gameService.getLeaderboardEntries()

    expect(entries.length).toEqual(3)

    expect(entries[0].name).toEqual(c.nickname)
    expect(entries[1].name).toEqual(b.nickname)
    expect(entries[2].name).toEqual(a.nickname)

    expect(entries[0].score).toEqual(c.score)
    expect(entries[1].score).toEqual(b.score)
    expect(entries[2].score).toEqual(a.score)
  })
})
