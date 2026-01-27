import { DiagnosisState, Scores } from "./diagnosisTypes";

export const initScores = (): Scores => ({
  emp: 0,
  soc: 0,
  int: 0,
  ord: 0,
  adv: 0,
  exp: 0,
  res: 0,
  shd: 0
});

export const initialState: DiagnosisState = {
  lang: "en-US",
  name: "",
  seed: Date.now() >>> 0,
  answers: [],
  questionIndex: 0,
  scores: initScores(),
  result: null
};
