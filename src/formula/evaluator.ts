import type { CellPosition, EvaluationResult, FormulaValue, MarkdownTable, SpreadsheetTableSettings, TableEvaluation } from "../types";
import { parseFormulaExpression, type AstNode } from "./parser";
import { cellKey, expandRange, parseCellReference, parseColumnReference } from "./references";
import { applyBinary, FUNCTION_HANDLERS } from "./functions";
import { errorValue, formatFormulaValue, numberValue, parseCellValue, textValue, unifyCurrency } from "./values";

interface EvalContext {
  table: MarkdownTable;
  settings: SpreadsheetTableSettings;
  visiting: Set<string>;
  results: Map<string, EvaluationResult>;
  dependencies: CellPosition[];
}

export function evaluateTable(table: MarkdownTable, settings: SpreadsheetTableSettings): TableEvaluation {
  const results = new Map<string, EvaluationResult>();
  const dependencies = new Map<string, CellPosition[]>();
  const body = getBody(table);

  for (let row = 0; row < body.length; row++) {
    for (let col = 0; col < body[row].length; col++) {
      const raw = body[row][col] ?? "";
      if (raw.trim().startsWith("=")) {
        const position = { row, col };
        const context: EvalContext = {
          table,
          settings,
          visiting: new Set(),
          results,
          dependencies: []
        };
        const value = evaluateFormulaCell(context, position);
        const key = cellKey(position);
        results.set(key, {
          display: formatFormulaValue(value, settings),
          value,
          dependencies: uniquePositions(context.dependencies)
        });
        dependencies.set(key, uniquePositions(context.dependencies));
      }
    }
  }

  return { results, dependencies };
}

export function evaluateFormulaCell(context: EvalContext, position: CellPosition): FormulaValue {
  const key = cellKey(position);
  const existing = context.results.get(key);
  if (existing) return existing.value;

  if (context.visiting.has(key)) return errorValue("#CIRC!");
  context.visiting.add(key);

  const raw = getCell(context.table, position);
  if (!raw.trim().startsWith("=")) {
    context.visiting.delete(key);
    return parseCellValue(raw);
  }

  try {
    const ast = parseFormulaExpression(raw);
    const value = evaluateAst(ast, context);
    context.visiting.delete(key);
    return value;
  } catch {
    context.visiting.delete(key);
    return errorValue("#ERROR!");
  }
}

function evaluateAst(node: AstNode, context: EvalContext): FormulaValue {
  switch (node.type) {
    case "number":
      return numberValue(node.value);
    case "string":
      return textValue(node.value);
    case "reference":
      return evaluateReference(node.value, context);
    case "range":
      return aggregateValues(evaluateRange(node.from.value, node.to.value, context));
    case "columnRange":
      return aggregateValues(evaluateColumnRange(node.from, node.to, context));
    case "binary":
      return applyBinary(node.operator, evaluateAst(node.left, context), evaluateAst(node.right, context));
    case "function":
      return evaluateFunction(node.name, node.args, context);
  }
}

function evaluateFunction(name: string, args: AstNode[], context: EvalContext): FormulaValue {
  const handler = FUNCTION_HANDLERS[name.toUpperCase()];
  if (!handler) return errorValue("#NAME?");

  const values = args.flatMap((arg) => {
    if (arg.type === "range") return evaluateRange(arg.from.value, arg.to.value, context);
    if (arg.type === "columnRange") return evaluateColumnRange(arg.from, arg.to, context);
    return [evaluateAst(arg, context)];
  });

  if (name.toUpperCase() === "CONVERT" && args.length >= 3 && args[2].type === "reference") {
    const ref = parseCellReference(args[2].value);
    if (ref) values[2] = textValue(getCell(context.table, ref));
  }

  return handler(values, context.settings);
}

function evaluateReference(reference: string, context: EvalContext): FormulaValue {
  const position = parseCellReference(reference);
  if (!position) return errorValue("#REF!");
  context.dependencies.push(position);
  const raw = getCell(context.table, position);
  if (raw.trim().startsWith("=")) return evaluateFormulaCell(context, position);
  return parseCellValue(raw);
}

function evaluateRange(fromReference: string, toReference: string, context: EvalContext): FormulaValue[] {
  const from = parseCellReference(fromReference);
  const to = parseCellReference(toReference);
  if (!from || !to) return [errorValue("#REF!")];
  return expandRange(from, to).map((position) => {
    context.dependencies.push(position);
    const raw = getCell(context.table, position);
    if (raw.trim().startsWith("=")) return evaluateFormulaCell(context, position);
    return parseCellValue(raw);
  });
}

function evaluateColumnRange(fromReference: string, toReference: string, context: EvalContext): FormulaValue[] {
  const fromCol = parseColumnReference(fromReference);
  const toCol = parseColumnReference(toReference);
  if (fromCol === null || toCol === null) return [errorValue("#REF!")];

  const body = getBody(context.table);
  const startCol = Math.min(fromCol, toCol);
  const endCol = Math.max(fromCol, toCol);
  const values: FormulaValue[] = [];

  for (let row = 0; row < body.length; row++) {
    for (let col = startCol; col <= endCol; col++) {
      const position = { row, col };
      context.dependencies.push(position);
      const raw = getCell(context.table, position);
      values.push(raw.trim().startsWith("=") ? evaluateFormulaCell(context, position) : parseCellValue(raw));
    }
  }

  return values;
}

function aggregateValues(values: FormulaValue[]): FormulaValue {
  if (values.some((value) => value.type === "error")) return values.find((value) => value.type === "error") ?? errorValue("#ERROR!");
  const numbers = values.filter((value) => value.type === "number" && typeof value.value === "number");
  const currency = unifyCurrency(numbers);
  if (currency.status === "mixed") return errorValue("#CURRENCY!");
  return numberValue(numbers.reduce((sum, value) => sum + Number(value.value), 0), currency.currency);
}

function getBody(table: MarkdownTable): string[][] {
  return [table.headers, ...table.rows];
}

function getCell(table: MarkdownTable, position: CellPosition): string {
  const body = getBody(table);
  return body[position.row]?.[position.col] ?? "";
}

function uniquePositions(positions: CellPosition[]): CellPosition[] {
  const seen = new Set<string>();
  const result: CellPosition[] = [];
  for (const position of positions) {
    const key = cellKey(position);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(position);
  }
  return result;
}
