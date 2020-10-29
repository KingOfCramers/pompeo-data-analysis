import { phraseResults } from "./business";

interface totalType {
  interviewer: string;
  numberOfInterviews: number;
  total: number;
}

export const getTotalByInterviewer = (data: phraseResults[]) => {
  const total: totalType[] = [];

  for (const interview of data) {
    let exists = total.find((x) => {
      // Strip out front text, get only interviewer at start. Get first few words
      // and check to see if interviwer in total starts with the same words
      let titleNormalized = interview.title.replace(
        /Secretary Michael R. Pompeo With |Interview With |Secretary of State Michael R. Pompeo With /g,
        ""
      );
      let nameOfNewInterviewer = titleNormalized
        .split(" ")
        .filter((x, i) => i < 3)
        .join(" ");
      let exists = x.interviewer.startsWith(nameOfNewInterviewer);
      return exists;
    });
    if (!exists) {
      total.push({
        interviewer: interview.title.replace(
          /Secretary Michael R. Pompeo With |Interview With |Secretary of State Michael R. Pompeo With /g,
          ""
        ),
        total: interview.lineCount,
        numberOfInterviews: 1,
      });
    } else {
      // If it does exist, find the interviwer and add the lineCount
      total.map((x) => {
        let titleNormalized = interview.title.replace(
          /Secretary Michael R. Pompeo With |Interview With |Secretary of State Michael R. Pompeo With /g,
          ""
        );
        let nameOfNewInterviewer = titleNormalized
          .split(" ")
          .filter((x, i) => i < 3)
          .join(" ");
        if (x.interviewer.startsWith(nameOfNewInterviewer)) {
          x.total += interview.lineCount;
          x.numberOfInterviews++;
        }
        return x;
      });
    }
  }

  return total;
};
