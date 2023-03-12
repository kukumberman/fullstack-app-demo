import { SimpleDatabase } from "../db/SimpleDatabase"
import { UserModel } from "../db/UserModel"
import { ApplicationEnvironment } from "../enums"
import { CustomError, ErrorType } from "../errors"
import { UserSchema } from "../types"
import { UserService } from "./UserService"
import { generateTimestampString } from "@src/utils"

export class UserServiceImpl extends UserService {
  private readonly db: SimpleDatabase<UserSchema>

  constructor(environmentType: ApplicationEnvironment) {
    super()
    this.db = new SimpleDatabase("users", environmentType)
  }

  async initialize(): Promise<void> {
    await this.db.initialize()
  }

  async findOneById(id: string): Promise<UserModel | undefined> {
    await this.db.read()
    const result = this.db.data.find((entry) => entry.id === id)
    if (result === undefined) {
      return undefined
    }
    return new UserModel(result)
  }

  async findOneByEmail(email: string): Promise<UserModel | undefined> {
    await this.db.read()
    const result = this.db.data.find((entry) => entry.signIn.standard?.email === email)
    if (result === undefined) {
      return undefined
    }
    return new UserModel(result)
  }

  async findOneByDiscordId(id: string): Promise<UserModel | undefined> {
    await this.db.read()
    const result = this.db.data.find((entry) => entry.signIn.platforms.discord?.id === id)
    if (result === undefined) {
      return undefined
    }
    return new UserModel(result)
  }

  async findOneByGoogleId(id: string): Promise<UserModel | undefined> {
    await this.db.read()
    const result = this.db.data.find((entry) => entry.signIn.platforms.google?.id === id)
    if (result === undefined) {
      return undefined
    }
    return new UserModel(result)
  }

  async signUp(email: string, password: string): Promise<UserModel> {
    if (email.length === 0) {
      throw new CustomError(400, ErrorType.SignUpInvalidEmail)
    }

    if (password.length === 0) {
      throw new CustomError(400, ErrorType.SignUpInvalidPassword)
    }

    const user: UserModel | undefined = await this.findOneByEmail(email)
    if (user !== undefined) {
      throw new CustomError(400, ErrorType.SignUpUserAlreadyExists)
    }

    const newUser = UserModel.New()
    newUser.data.signIn.standard = {
      email,
      password,
    }

    //todo: hash password

    return newUser
  }

  async signIn(email: string, password: string): Promise<UserModel> {
    const user: UserModel | undefined = await this.findOneByEmail(email)
    if (user === undefined) {
      throw new CustomError(400, ErrorType.SignInNoUserWithGivenEmail)
    }
    //todo: compare hashed password
    if (user.data.signIn.standard?.password !== password) {
      throw new CustomError(400, ErrorType.SignInWrongPassword)
    }
    return user
  }

  async save(user: UserModel): Promise<void> {
    await this.db.read()
    const now = generateTimestampString()
    const index = this.db.data.findIndex((entry) => entry.id === user.data.id)
    if (index == -1) {
      user.data.createdAt = now
      user.data.updatedAt = now
      this.db.data.push(user.data)
    } else {
      user.data.updatedAt = now
      this.db.data[index] = user.data
    }
    await this.db.write()
  }

  async getAll(): Promise<UserModel[]> {
    await this.db.read()
    const items = this.db.data.map((entry) => new UserModel(entry))
    return items
  }

  async deleteAll(): Promise<void> {
    this.db.data = []
    await this.db.write()
  }
}
