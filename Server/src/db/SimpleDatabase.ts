import path from "path"
import { ApplicationEnvironment } from "../enums"
import { AsyncAdapter, MemoryAsyncAdapter, JsonFileFakeAsyncAdapter } from "./Adapter"

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
        : new JsonFileFakeAsyncAdapter<T[]>(this.pathToFile, this.data)
  }

  async initialize(): Promise<void> {
    await this.adapter.initialize()
  }

  async read(): Promise<void> {
    this.data = await this.adapter.read()
  }

  write(): Promise<void> {
    return this.adapter.write(this.data)
  }
}
