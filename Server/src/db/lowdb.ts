import path from "path"
import fs from "fs"
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"

import { UserSchema } from "../types.js"
import { UserModel } from "./UserModel.js"

type Predicate<T> = (value: T) => boolean

export class UserDatabase {
  private db!: Low<UserSchema[]>

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
    this.db = new Low(new JSONFile<UserSchema[]>(pathToFile))
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
    const index = this.findIndex((entry) => entry.authentication.discord?.id === id)
    if (index != -1) {
      return this.at(index)
    }

    return null
  }

  async findUserByEmail(email: string): Promise<UserModel | null> {
    const index = this.findIndex((entry) => entry.authentication.basic?.email === email)
    if (index != -1) {
      return this.at(index)
    }

    return null
  }

  async save() {
    await this.db.write()
  }
}
