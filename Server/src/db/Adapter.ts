import fs from "fs"
import path from "path"

export abstract class AsyncAdapter<T> {
  abstract initialize(): Promise<void>

  abstract read(): Promise<T>

  abstract write(data: T): Promise<void>
}

export class MemoryAsyncAdapter<T> extends AsyncAdapter<T> {
  constructor(public data: T) {
    super()
  }

  initialize(): Promise<void> {
    return Promise.resolve()
  }

  read(): Promise<T> {
    return Promise.resolve(this.data)
  }

  write(data: T): Promise<void> {
    this.data = data
    return Promise.resolve()
  }
}

export class JsonFileAsyncAdapter<T> extends AsyncAdapter<T> {
  constructor(
    private readonly pathToFile: string,
    private readonly empty: T,
    private readonly prettyPrint: boolean = true
  ) {
    super()
  }

  async initialize(): Promise<void> {
    const directory = path.dirname(this.pathToFile)
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }
    if (!fs.existsSync(this.pathToFile)) {
      await this.write(this.empty)
    }
  }

  async read(): Promise<T> {
    const text = await fs.promises.readFile(this.pathToFile)
    return JSON.parse(text.toString()) as T
  }

  async write(data: T): Promise<void> {
    const text = JSON.stringify(data, null, this.prettyPrint ? 2 : 0)
    return fs.promises.writeFile(this.pathToFile, text)
  }
}

export class JsonFileFakeAsyncAdapter<T> extends AsyncAdapter<T> {
  constructor(
    private readonly pathToFile: string,
    private readonly empty: T,
    private readonly prettyPrint: boolean = true
  ) {
    super()
  }

  async initialize(): Promise<void> {
    const directory = path.dirname(this.pathToFile)
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }
    if (!fs.existsSync(this.pathToFile)) {
      await this.write(this.empty)
    }
  }

  read(): Promise<T> {
    const buffer = fs.readFileSync(this.pathToFile)
    const text = buffer.toString()
    const data = JSON.parse(text) as T
    return Promise.resolve(data)
  }

  write(data: T): Promise<void> {
    const text = JSON.stringify(data, null, this.prettyPrint ? 2 : 0)
    fs.writeFileSync(this.pathToFile, text)
    return Promise.resolve()
  }
}
