import { UserService } from "./UserService.js"

export class Application {
  constructor(public userService: UserService) {}
}
