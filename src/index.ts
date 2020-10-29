import path from "path";
import converter from "json-2-csv";
import fs from "fs";
import { logResults, logEveryResult } from "./business";
import { CsvFileReader } from "./fileReaders";
import phraseSearch from "./phraseSearch";

// Iran
const Iran = logEveryResult("Iran");
fs.writeFileSync(path.resolve(__dirname, "Iran.json"), JSON.stringify(Iran));
converter.json2csv(Iran, (err, total) => {
  if (err) {
    throw err;
  }
  total && fs.writeFileSync(path.resolve(__dirname, "Iran.csv"), total);
});

// Obama
const Obama = logEveryResult("Obama");
fs.writeFileSync(path.resolve(__dirname, "Obama.json"), JSON.stringify(Obama));
converter.json2csv(Obama, (err, total) => {
  if (err) {
    throw err;
  }
  total && fs.writeFileSync(path.resolve(__dirname, "Obama.csv"), total);
});

// Countries
const reader = new CsvFileReader(path.resolve(__dirname, "countries.csv"));
reader.read();

reader.data.flat().forEach((country) => {
  const res = logResults(country);
});
