import path from "path"
import fs from "fs"

import { UserSchema } from "../types"
import { UserModel } from "./UserModel"
import { SimpleDatabase } from "./SimpleDatabase"

type Predicate<T> = (value: T) => boolean

export class UserDatabase {
  private db!: SimpleDatabase<UserSchema>

  constructor(private name: string) {}

  at(index: number): UserModel {
    return new UserModel(this.db.data![index])
  }

  findIndex(predicate: Predicate<UserSchema>): number {
    return this.db.data!.findIndex(predicate)
  }

  async connect() {
    const pathToFile = path.resolve(`./db/${this.name}.json`)
    if (!fs.existsSync(pathToFile)) {
      fs.writeFileSync(pathToFile, JSON.stringify([]))
    }
    this.db = new SimpleDatabase<UserSchema>(pathToFile)
    await this.db.read()
  }

  async addUser(user: UserModel): Promise<void> {
    this.db.data!.push(user.data)
    await this.db.write()
  }

  async findUserById(id: string): Promise<UserModel | null> {
    const index = this.findIndex((entry) => entry.id === id)
    if (index != -1) {
      return this.at(index)
    }

    return null
  }

  async findUserByDiscordId(id: string): Promise<UserModel | null> {
    const index = this.findIndex((entry) => entry.signIn.discord?.id === id)
    if (index != -1) {
      return this.at(index)
    }

    return null
  }

  async findUserByEmail(email: string): Promise<UserModel | null> {
    const index = this.findIndex((entry) => entry.login.email === email)
    if (index != -1) {
      return this.at(index)
    }

    return null
  }

  async findUserByGoogleId(id: string): Promise<UserModel | null> {
    const index = this.findIndex((entry) => entry.signIn.google?.id === id)
    if (index != -1) {
      return this.at(index)
    }

    return null
  }

  async save() {
    await this.db.write()
  }
}
