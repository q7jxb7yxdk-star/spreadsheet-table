import type { App } from "obsidian";

export interface SpreadsheetTableSettings {
  showHeadersInLivePreview: boolean;
  decimalPlaces: number;
  groupingSeparator: string;
  decimalSeparator: string;
  enableDependencyHighlight: boolean;
  enableFormulaRenderingInLivePreview: boolean;
  enableFormulaRenderingInReadingMode: boolean;
}

export const DEFAULT_SETTINGS: SpreadsheetTableSettings = {
  showHeadersInLivePreview: false,
  decimalPlaces: 2,
  groupingSeparator: ",",
  decimalSeparator: ".",
  enableDependencyHighlight: true,
  enableFormulaRenderingInLivePreview: true,
  enableFormulaRenderingInReadingMode: true
};

export type Alignment = "left" | "center" | "right";

export interface MarkdownTable {
  startLine: number;
  endLine: number;
  headers: string[];
  alignments: Alignment[];
  rows: string[][];
  rawLines: string[];
}

export interface CellPosition {
  row: number;
  col: number;
}

export interface TableOperationContext {
  app: App;
  settings: SpreadsheetTableSettings;
}

export type FormulaScalarType = "number" | "date" | "text" | "blank" | "error";

export interface FormulaValue {
  type: FormulaScalarType;
  value: number | string | Date | null;
  currency?: string;
  error?: string;
}

export interface EvaluationResult {
  display: string;
  value: FormulaValue;
  dependencies: CellPosition[];
}

export interface TableEvaluation {
  results: Map<string, EvaluationResult>;
  dependencies: Map<string, CellPosition[]>;
}
