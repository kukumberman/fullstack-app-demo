export enum ErrorType {
  EmptyFields,
  SignUpInvalidEmail,
  SignUpInvalidPassword,
  SignUpUserAlreadyExists,
  SignInNoUserWithGivenEmail,
  SignInWrongPassword,
}

export class CustomError {
  public readonly error: string

  constructor(public readonly statusCode: number, type: ErrorType) {
    this.error = ErrorType[type]
  }
}
