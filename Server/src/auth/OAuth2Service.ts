import { OAuth2Handler } from "./OAuth2Handler"

export class OAuth2Service {
  constructor(public readonly handlers: OAuth2Handler[]) {}

  find(platformName: string): OAuth2Handler | undefined {
    return this.handlers.find((entry) => entry.name === platformName)
  }

  getAllPlatformsData(state: string) {
    return this.handlers.map((entry) => entry.getPublicData(state))
  }
}
