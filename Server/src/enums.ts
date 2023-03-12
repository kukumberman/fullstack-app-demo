export enum ApplicationEnvironment {
  Production,
  Development,
  Test,
}

export enum PlatformDisconnectResult {
  Disconnected,
  InvalidPlatform,
  NotConnected,
  AtLeastOneRequired,
}

export function stringifyPlatformDisconnectResult(value: PlatformDisconnectResult) {
  return PlatformDisconnectResult[value]
}
