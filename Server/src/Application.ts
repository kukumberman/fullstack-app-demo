import { UserService } from "./UserService"
import { UserServiceImpl } from "./UserServiceImpl"
import { ExternalLogin } from "./utils"

export class Application {
  public readonly userService: UserService
  public readonly externalLogin: ExternalLogin

  constructor() {
    this.userService = new UserServiceImpl(this)
    this.externalLogin = new ExternalLogin(10)
  }

  async initialize(): Promise<void> {
    await this.userService.initialize()
  }
}
