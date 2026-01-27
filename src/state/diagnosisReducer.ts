import { DiagnosisAction, DiagnosisState } from "./diagnosisTypes";
import { initialState, initScores } from "./initialState";

export function diagnosisReducer(state: DiagnosisState, action: DiagnosisAction): DiagnosisState {
  switch (action.type) {
    case "SET_LANG":
      return { ...state, lang: action.lang };
    case "SET_NAME":
      return { ...state, name: action.name };
    case "SET_SEED":
      return { ...state, seed: action.seed >>> 0 };
    case "RESET_RUN":
      return {
        ...state,
        answers: [],
        questionIndex: 0,
        scores: initScores(),
        result: null
      };
    case "ANSWER":
      return {
        ...state,
        answers: [...state.answers, action.answer],
        scores: action.scores,
        questionIndex: action.nextIndex
      };
    case "FINISH":
      return { ...state, result: action.result };
    default:
      return state;
  }
}

export const getInitialState = (): DiagnosisState => initialState;
