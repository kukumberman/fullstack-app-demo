interface IPingData {
  token: string
  expires: number
  expired(): boolean
}

export class ExternalLogin {
  private readonly map: Map<string, IPingData>

  constructor(private readonly expirationTimeInSeconds: number) {
    this.map = new Map<string, IPingData>()
  }

  saveTokenInMemory(key: string, token: string) {
    this.map.set(key, {
      token,
      expires: Date.now() + this.expirationTimeInSeconds * 1000,
      expired() {
        return Date.now() > this.expires
      },
    })
  }

  tryRemoveExpiredEntries() {
    Array.from(this.map.keys()).forEach((key) => {
      const entry = this.map.get(key)!
      if (entry.expired()) {
        this.map.delete(key)
      }
    })
  }

  popToken(key: string): string | null {
    if (this.map.has(key)) {
      const entry = this.map.get(key)!
      this.map.delete(key)
      return entry.token
    }

    return null
  }
}
