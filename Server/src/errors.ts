export enum ErrorType {
  EmptyFields,
  SignUpInvalidEmail,
  SignUpInvalidPassword,
  SignUpUserAlreadyExists,
  SignInNoUserWithGivenEmail,
  SignInWrongPassword,
  Unauthorized,
  AccessTokenExpired,
}

export class CustomError {
  public readonly error: string

  constructor(public readonly statusCode: number, type: ErrorType) {
    this.error = ErrorType[type]
  }
}

export class UnauthorizedError extends CustomError {
  constructor() {
    super(401, ErrorType.Unauthorized)
  }
}

export class AccessTokenExpiredError extends CustomError {
  constructor() {
    super(401, ErrorType.AccessTokenExpired)
  }
}
