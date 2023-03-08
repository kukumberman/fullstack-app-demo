import path from "path"
import { Application } from "./Application"
import { UserDatabase } from "./db/UserDatabase"
import { UserModel } from "./db/UserModel"
import { ApplicationEnvironment } from "./enums"
import { CustomError, ErrorType } from "./errors"
import { UserSchema } from "./types"
import { UserService } from "./UserService"

export class UserServiceImpl extends UserService {
  private readonly db: UserDatabase

  constructor(private readonly app: Application) {
    super()
    const dbName = "users." + ApplicationEnvironment[app.environmentType].toLowerCase() + ".json"
    this.db = new UserDatabase(path.resolve("db", dbName))
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

    const user: UserSchema | undefined = this.db.data.find(
      (entry) => entry.signIn.standard?.email === email
    )
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

  signIn(email: string, password: string): Promise<UserModel> {
    throw new Error("Method not implemented.")
  }

  async save(user: UserModel): Promise<void> {
    await this.db.read()
    const index = this.db.data.findIndex((entry) => entry.id === user.data.id)
    if (index == -1) {
      this.db.data.push(user.data)
    } else {
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
