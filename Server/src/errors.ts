export class JsonError {
  constructor(public code: number, public name: string, public message: string) {}
}

export class UnauthorizedError extends JsonError {
  constructor() {
    super(401, "Unauthorized", "Unauthorized")
  }
}
