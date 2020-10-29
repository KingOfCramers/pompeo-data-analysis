import fs from "fs";

export class CsvFileReader {
  // "public" is === this.filename = filename
  constructor(public filename: string) {}
  data: string[][] = [];
  read(): void {
    this.data = fs
      .readFileSync(this.filename, {
        encoding: "utf-8",
      })
      .split("\n")
      .map((row) => row.split(",").filter((item) => item !== ""));
  }
}

export class JsonFileReader<T> {
  constructor(public filename: string) {}
  data: T[] = [];
  read(): void {
    this.data = JSON.parse(
      fs.readFileSync(this.filename, { encoding: "utf-8" })
    );
  }
}
