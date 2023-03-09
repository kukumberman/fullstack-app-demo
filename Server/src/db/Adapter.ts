import fs from "fs"

export abstract class AsyncAdapter<T> {
  abstract read(): Promise<T>

  abstract write(data: T): Promise<void>
}

export class MemoryAsyncAdapter<T> extends AsyncAdapter<T> {
  constructor(public data: T) {
    super()
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
  constructor(private readonly pathToFile: string, private readonly prettyPrint: boolean = true) {
    super()
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
