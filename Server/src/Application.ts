import { CookieService } from "./services/CookieService"
import { ApplicationEnvironment } from "./enums"
import { JwtService } from "./services/JwtService"
import { UserService } from "./services/UserService"
import { UserServiceImpl } from "./services/UserServiceImpl"
import { ExternalLogin } from "./utils/ExternalLogin"

export class Application {
  public readonly userService: UserService
  public readonly jwtService: JwtService
  public readonly cookieService: CookieService
  public readonly externalLogin: ExternalLogin

  constructor(public readonly environmentType: ApplicationEnvironment) {
    this.userService = new UserServiceImpl(this)
    this.jwtService = new JwtService("15s", "60s")
    this.externalLogin = new ExternalLogin(10)
    this.cookieService = new CookieService()
  }

  async initialize(): Promise<void> {
    await this.userService.initialize()
  }
}
