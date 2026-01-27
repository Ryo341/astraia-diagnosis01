"use client";

import React, { createContext, useContext, useMemo, useReducer } from "react";
import { DiagnosisAction, DiagnosisState } from "./diagnosisTypes";
import { diagnosisReducer, getInitialState } from "./diagnosisReducer";

type Ctx = {
  state: DiagnosisState;
  dispatch: React.Dispatch<DiagnosisAction>;
};

const DiagnosisContext = createContext<Ctx | null>(null);

export function DiagnosisProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(diagnosisReducer, undefined, getInitialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <DiagnosisContext.Provider value={value}>{children}</DiagnosisContext.Provider>;
}

export function useDiagnosis() {
  const ctx = useContext(DiagnosisContext);
  if (!ctx) throw new Error("useDiagnosis must be used within DiagnosisProvider");
  return ctx;
}
