import fs from "fs"
import path from "path"

export class SimpleDatabase<T> {
  public data: T[]

  constructor(private readonly pathToFile: string) {
    this.data = []
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
    const text = await fs.promises.readFile(this.pathToFile)
    this.data = JSON.parse(text.toString())
  }

  write(): Promise<void> {
    const text = JSON.stringify(this.data, null, 2)
    return fs.promises.writeFile(this.pathToFile, text)
  }
}
