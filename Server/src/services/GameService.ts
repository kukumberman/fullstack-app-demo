import { UserService } from "./UserService"

export type LeaderboardEntry = {
  name: string
  score: number
}

export class GameService {
  constructor(private readonly userService: UserService) {}

  async getLeaderboardEntries(): Promise<LeaderboardEntry[]> {
    const users = await this.userService.getAll()
    return users
      .map((user) => {
        return {
          name: user.nickname,
          score: user.score,
        }
      })
      .sort((a, b) => b.score - a.score)
  }
}
