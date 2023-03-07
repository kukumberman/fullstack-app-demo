import fs from "fs"

export class SimpleDatabase<T> {
  public data: T[]

  constructor(public readonly pathToFile: string) {
    this.data = []
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
