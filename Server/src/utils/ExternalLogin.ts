interface IPingData {
  data: any
  expires: number
  expired(): boolean
}

export class ExternalLogin {
  private readonly map: Map<string, IPingData>

  constructor(private readonly expirationTimeInSeconds: number) {
    this.map = new Map<string, IPingData>()
  }

  get entriesCount() {
    return this.map.size
  }

  clear() {
    this.map.clear()
  }

  addEntry(key: string, data: any) {
    this.map.set(key, {
      data,
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

  popEntry<T>(key: string): T | undefined {
    if (this.map.has(key)) {
      const entry = this.map.get(key)!
      this.map.delete(key)
      return entry.data as T
    }

    return undefined
  }
}
