import { CookieService } from "./services/CookieService"
import { ApplicationEnvironment } from "./enums"
import { JwtService } from "./services/JwtService"
import { UserService } from "./services/UserService"
import { UserServiceImpl } from "./services/UserServiceImpl"
import { ExternalLogin } from "./utils/ExternalLogin"
import { GameService } from "./services/GameService"
import { OAuth2Service } from "./auth/OAuth2Service"
import { DiscordOAuth2Handler, GoogleOAuth2Handler } from "./auth/OAuth2Handler"

export class Application {
  public readonly userService: UserService
  public readonly jwtService: JwtService
  public readonly cookieService: CookieService
  public readonly externalLogin: ExternalLogin
  public readonly gameService: GameService
  public readonly oauth2Service: OAuth2Service

  constructor(public readonly environmentType: ApplicationEnvironment) {
    this.userService = new UserServiceImpl(environmentType)
    this.jwtService = new JwtService("15s", "60s")
    this.externalLogin = new ExternalLogin(10)
    this.cookieService = new CookieService()
    this.gameService = new GameService(this.userService)
    this.oauth2Service = new OAuth2Service([new DiscordOAuth2Handler(), new GoogleOAuth2Handler()])
  }

  async initialize(): Promise<void> {
    await this.userService.initialize()
  }
}
