import { PressRelease } from "./business";

export default (phrase: string, documents: PressRelease[]) => {
  const expression = new RegExp(phrase, "gi");
  const occurances = documents.filter(
    (datum) => datum.text.match(expression)?.length
  );

  return occurances;
};
