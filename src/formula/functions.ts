import type { FormulaValue, SpreadsheetTableSettings } from "../types";
import { addDays, blankValue, dateValue, diffDays, errorValue, numberValue, parseDate, unifyCurrency } from "./values";

export type FunctionHandler = (args: FormulaValue[], settings: SpreadsheetTableSettings) => FormulaValue;

export const FUNCTION_HANDLERS: Record<string, FunctionHandler> = {
  SUM: sumFunction,
  AVERAGE: averageFunction,
  CONVERT: convertFunction,
  DATE: dateFunction,
  TODAY: todayFunction,
  DAYS: daysFunction
};

export function applyBinary(operator: string, left: FormulaValue, right: FormulaValue): FormulaValue {
  if (left.type === "error") return left;
  if (right.type === "error") return right;

  if (left.type === "date" && left.value instanceof Date && right.type === "number" && typeof right.value === "number") {
    if (operator === "+") return dateValue(addDays(left.value, right.value));
    if (operator === "-") return dateValue(addDays(left.value, -right.value));
  }

  if (left.type === "date" && right.type === "date" && left.value instanceof Date && right.value instanceof Date && operator === "-") {
    return numberValue(diffDays(left.value, right.value));
  }

  if (left.type !== "number" || right.type !== "number" || typeof left.value !== "number" || typeof right.value !== "number") {
    return errorValue("#VALUE!");
  }

  const currency = unifyCurrency([left, right]);
  if (currency === "mixed") return errorValue("#CURRENCY!");

  switch (operator) {
    case "+":
      return numberValue(left.value + right.value, currency);
    case "-":
      return numberValue(left.value - right.value, currency);
    case "*":
      return numberValue(left.value * right.value, currency);
    case "/":
      return right.value === 0 ? errorValue("#DIV/0!") : numberValue(left.value / right.value, currency);
    default:
      return errorValue("#VALUE!");
  }
}

function sumFunction(args: FormulaValue[]): FormulaValue {
  const numbers = args.filter((arg) => arg.type === "number" && typeof arg.value === "number");
  const currency = unifyCurrency(numbers);
  if (currency === "mixed") return errorValue("#CURRENCY!");
  return numberValue(numbers.reduce((sum, value) => sum + Number(value.value), 0), currency);
}

function averageFunction(args: FormulaValue[]): FormulaValue {
  const numbers = args.filter((arg) => arg.type === "number" && typeof arg.value === "number");
  const currency = unifyCurrency(numbers);
  if (currency === "mixed") return errorValue("#CURRENCY!");
  if (numbers.length === 0) return blankValue();
  return numberValue(numbers.reduce((sum, value) => sum + Number(value.value), 0) / numbers.length, currency);
}

function convertFunction(args: FormulaValue[]): FormulaValue {
  const [value, rate, currency] = args;
  if (value?.type !== "number" || typeof value.value !== "number") return errorValue("#VALUE!");
  if (rate?.type !== "number" || typeof rate.value !== "number") return errorValue("#VALUE!");
  const currencyText = currency?.type === "text" && typeof currency.value === "string" ? currency.value : undefined;
  return numberValue(value.value * rate.value, currencyText);
}

function dateFunction(args: FormulaValue[]): FormulaValue {
  const [year, month, day] = args;
  if (!isNumeric(year) || !isNumeric(month) || !isNumeric(day)) return errorValue("#VALUE!");
  const date = parseDate(`${year.value}-${month.value}-${day.value}`);
  return date ? dateValue(date) : errorValue("#VALUE!");
}

function todayFunction(): FormulaValue {
  return dateValue(new Date());
}

function daysFunction(args: FormulaValue[]): FormulaValue {
  const [end, start] = args;
  if (end?.type !== "date" || start?.type !== "date" || !(end.value instanceof Date) || !(start.value instanceof Date)) {
    return errorValue("#VALUE!");
  }
  return numberValue(diffDays(end.value, start.value));
}

function isNumeric(value: FormulaValue | undefined): value is FormulaValue & { value: number } {
  return value?.type === "number" && typeof value.value === "number";
}
