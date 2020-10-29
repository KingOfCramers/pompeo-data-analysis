import path from "path";
import fs from "fs";
import moment from "moment";

import { JsonFileReader, CsvFileReader } from "./fileReaders";
import phraseSearch from "./phraseSearch";

export interface PressRelease {
  link: string;
  title: string;
  date: { $date: Date };
  authorBureau: string;
  kind: string;
  text: string;
  tags: string[];
}

interface ParsedPressRelease extends PressRelease {
  interviewerLines: string[];
  pompeoLines: string[];
}

export interface phraseResults {
  lines: string[];
  lineCount: number;
  title: string;
  link: string;
  date: string;
}

export interface phraseResult {
  line: string;
  link: string;
  title: string;
}

const createParsedData = () => {
  const reader = new JsonFileReader<PressRelease>(
    path.resolve(__dirname, "stateDepartmentData.json")
  );

  reader.read();

  // Find all bureaus
  const bureaus = reader.data.reduce((agg: string[], x) => {
    if (!agg.includes(x.authorBureau)) {
      agg.push(x.authorBureau);
    }
    return agg;
  }, []);

  // Find any bureaus that have Pompeo's name
  const bureausWithPompeo = bureaus.filter((bureau) =>
    bureau.includes("Pompeo")
  );

  // Filter the results by the bureau list
  // These are the documents where Pompeo is actually speaking
  const Results = reader.data.filter((datum: PressRelease) =>
    bureausWithPompeo.includes(datum.authorBureau)
  );

  fs.writeFileSync(
    path.resolve(__dirname, "pompeo.json"),
    JSON.stringify(Results)
  );

  const pompeo = new JsonFileReader<PressRelease>(
    path.resolve(__dirname, "pompeo.json")
  );
  pompeo.read();

  enum StatementTypes {
    Satement = "Press Statement",
    Readout = "Readout",
    MediaNote = "Media Note",
    PressNotice = "Notice to the Press",
    Remarks = "Remarks",
    Interview = "Interview",
    Briefing = "Special Briefing",
    FactSheet = "Fact Sheet",
    PressRemarks = "Remarks to the Press",
    Speech = "Speech",
    OpEd = "Op-Ed",
    PressRelease = "Press Release",
    Gaggle = "On-The-Record Gaggle",
    JointStatement = "Joint Statement",
  }

  // Only get interviews...
  const interviews = pompeo.data.filter(
    (datum) =>
      datum.text.includes("QUESTION:") &&
      (datum.kind === StatementTypes.Interview ||
        datum.kind === StatementTypes.Gaggle)
  );

  const parsed: ParsedPressRelease[] = [];

  // Utility functions for parsing every line
  const isWhoSpeaking = (line: string, who: string) => line.includes(who);
  const isPompeoSpeaking = (line: string) => isWhoSpeaking(line, "POMPEO:");
  const isInterviewerSpeaking = (line: string) =>
    isWhoSpeaking(line, "QUESTION:");

  // For every interview in our set construct a parsedInterview
  // That separates Pompeo's speaking from the speech of the interviewer
  for (const interview of interviews) {
    const lines = interview.text.split("\n");
    const interviewParsed: ParsedPressRelease = lines.reduce(
      (agg, line, i) => {
        if (isPompeoSpeaking(line)) {
          agg.pompeoLines.push(line.replace("SECRETARY POMPEO: ", ""));
        } else if (isInterviewerSpeaking(line)) {
          agg.interviewerLines.push(line.replace("QUESTION: ", ""));
        } else {
          // If neither Pompeo nor interviewer, then check previous lines until finding one
          // And then push it and break the loop. If first line, discard it.
          for (let x = i; x >= 0; x--) {
            let prevLine = lines[x - 1] || "";
            if (isPompeoSpeaking(prevLine)) {
              agg.pompeoLines.push(line.replace("SECRETARY POMPEO: ", ""));
              break;
            } else if (isInterviewerSpeaking(prevLine)) {
              agg.interviewerLines.push(line.replace("QUESTION: ", ""));
              break;
            }
          }
        }
        return agg;
      },
      {
        ...interview,
        pompeoLines: [],
        interviewerLines: [],
      } as ParsedPressRelease
    );
    parsed.push(interviewParsed);
  }

  //Write ParsedInterviews to file
  fs.writeFileSync(
    path.resolve(__dirname, "parsedInterviews.json"),
    JSON.stringify(parsed)
  );
};

// If any of the Pompeo lines include the word...
const pompeoMentioning = (word: string) => {
  const parsed: ParsedPressRelease[] = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "parsedInterviews.json"), "utf-8")
  );
  return parsed.filter((interview) =>
    interview.pompeoLines.join("").match(new RegExp(word, "g"))
  );
};

const getInterviews = () => {
  const interviews = fs.readFileSync(
    path.resolve(__dirname, "parsedInterviews.json"),
    "utf-8"
  );
  let json = JSON.parse(interviews);
  return json;
};

export const logResults = (word: string): phraseResults[] => {
  const interviews: ParsedPressRelease[] = getInterviews();
  console.log(
    `Pompeo mentioned ${word} in ${(
      (pompeoMentioning(word).length / interviews.length) *
      100
    ).toFixed(2)}% of interviews.`
  );

  const thePhrase = new RegExp(word, "g");

  return interviews.map((interview) => {
    const lines = interview.pompeoLines.filter((line) => line.match(thePhrase));
    const interviewResult: phraseResults = {
      lines,
      lineCount: lines.length,
      title: interview.title,
      link: interview.link,
      date: moment(interview.date.$date).format("MM-DD-YYYY"),
    };
    return interviewResult;
  });
};

export const logEveryResult = (word: string): phraseResult[] => {
  const interviews: ParsedPressRelease[] = getInterviews();
  console.log(
    `Pompeo mentioned ${word} in ${(
      (pompeoMentioning(word).length / interviews.length) *
      100
    ).toFixed(2)}% of interviews.`
  );

  const thePhrase = new RegExp(word, "g");

  return interviews.reduce((agg: phraseResult[], interview) => {
    const results: RegExpMatchArray = interview.pompeoLines.filter((line) =>
      line.match(thePhrase)
    );
    for (let res of results) {
      agg.push({ line: res, link: interview.link, title: interview.title });
    }
    return agg;
  }, []);
};
