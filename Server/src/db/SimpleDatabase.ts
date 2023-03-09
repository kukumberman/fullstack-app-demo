import fs from "fs"
import path from "path"
import { ApplicationEnvironment } from "../enums"
import { AsyncAdapter, MemoryAsyncAdapter, JsonFileAsyncAdapter } from "./Adapter"

export class SimpleDatabase<T> {
  private readonly pathToFile: string
  private readonly adapter: AsyncAdapter<T[]>
  public data: T[]

  constructor(name: string, environmentType: ApplicationEnvironment) {
    const suffix = ApplicationEnvironment[environmentType].toLowerCase()
    this.pathToFile = path.resolve("db", `${name}.${suffix}.json`)
    this.data = []
    this.adapter =
      environmentType == ApplicationEnvironment.Test
        ? new MemoryAsyncAdapter<T[]>(this.data)
        : new JsonFileAsyncAdapter<T[]>(this.pathToFile)
  }

  async initialize(): Promise<void> {
    const directory = path.dirname(this.pathToFile)
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }

    if (!fs.existsSync(this.pathToFile)) {
      await this.write()
    }
  }

  async read(): Promise<void> {
    this.data = await this.adapter.read()
  }

  write(): Promise<void> {
    return this.adapter.write(this.data)
  }
}
