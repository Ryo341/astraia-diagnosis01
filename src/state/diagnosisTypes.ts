export type Lang = "ja-JP" | "en-US";

export type StatKey = "emp" | "soc" | "int" | "ord" | "adv" | "exp" | "res" | "shd";
export type Scores = Record<StatKey, number>;

export type Answer = { questionId: string; choiceId: string };

export type Result = {
  classId: string;
  topStats: StatKey[];
  scores: Scores;
};

export type DiagnosisState = {
  lang: Lang;
  name: string;
  seed: number;
  answers: Answer[];
  questionIndex: number;
  scores: Scores;
  result: Result | null;
};

export type DiagnosisAction =
  | { type: "SET_LANG"; lang: Lang }
  | { type: "SET_NAME"; name: string }
  | { type: "SET_SEED"; seed: number }
  | { type: "RESET_RUN" }
  | { type: "ANSWER"; answer: Answer; scores: Scores; nextIndex: number }
  | { type: "FINISH"; result: Result };
