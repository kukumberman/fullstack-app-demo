export function generateTimestampString() {
  return new Date().toJSON()
}

export function sleep(ms: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

export function generateTemporaryNickname(dateStr: string): string {
  const date = new Date(dateStr)
  const prefix = "User"
  const suffix = date.getMilliseconds().toString(16).padStart(4, "0")
  return `${prefix}-${suffix}`
}
