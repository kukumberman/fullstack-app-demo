import path from "path"
import fs from "fs"
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"

import { IAuthenticationFields, IDatabase, UserSchema } from "../types.js"
import { generateId, generateTimestampString } from "../utils.js"

export class UserModel implements UserSchema {
  id: string
  nickname: string
  createdAt: string
  updatedAt: string
  friends: Array<string>
  authentication: IAuthenticationFields

  constructor(nickname: string = "") {
    this.id = generateId()
    this.nickname = nickname
    const now = generateTimestampString()
    this.createdAt = now
    this.updatedAt = now
    this.friends = []
    this.authentication = {
      discord: null,
      basic: null,
    }
  }

  discordNickname() {
    const discord = this.authentication.discord
    if (discord === null) {
      return ""
    }
    return discord.username + "#" + discord.discriminator
  }
}

type Data = UserSchema[]

export default class UserDatabase implements IDatabase {
  private db!: Low<Data>

  constructor(private name: string) {}

  async connect() {
    const pathToFile = path.resolve(`./db/${this.name}.json`)
    if (!fs.existsSync(pathToFile)) {
      fs.writeFileSync(pathToFile, JSON.stringify([]))
    }
    this.db = new Low(new JSONFile<Data>(pathToFile))
    await this.db.read()
  }

  async addUser(user: UserSchema): Promise<void> {
    this.db.data!.push(user)
    await this.db.write()
  }

  async findUserById(id: string): Promise<UserSchema | null> {
    const index = this.db.data!.findIndex((entry) => entry.id === id)
    if (index != -1) {
      return this.db.data![index]
    }

    return null
  }

  async findUserByDiscordId(id: string): Promise<UserSchema | null> {
    const index = this.db.data!.findIndex((entry) => entry.authentication.discord?.id === id)
    if (index != -1) {
      return this.db.data![index]
    }

    return null
  }

  async findUserByEmail(email: string): Promise<UserSchema | null> {
    const index = this.db.data!.findIndex((entry) => entry.authentication.basic?.email === email)
    if (index != -1) {
      return this.db.data![index]
    }

    return null
  }

  async save() {
    await this.db.write()
  }
}
