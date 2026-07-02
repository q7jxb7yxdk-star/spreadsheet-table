import type { FormulaValue, SpreadsheetTableSettings } from "../types";

const CURRENCIES = ["US$", "HK$", "CA$", "AU$", "NZ$", "SG$", "NT$", "MX$", "JPY", "CNY", "RMB", "C$", "A$", "$", "¥", "￥"];

export type CurrencyResolution = { status: "mixed" } | { status: "single"; currency?: string };

export function blankValue(): FormulaValue {
  return { type: "blank", value: null };
}

export function errorValue(error: string): FormulaValue {
  return { type: "error", value: error, error };
}

export function numberValue(value: number, currency?: string): FormulaValue {
  return { type: "number", value, currency };
}

export function dateValue(value: Date): FormulaValue {
  return { type: "date", value: stripTime(value) };
}

export function textValue(value: string): FormulaValue {
  return { type: "text", value };
}

export function parseCellValue(raw: string): FormulaValue {
  const text = raw.trim();
  if (text === "" || text === "-") return blankValue();

  const date = parseDate(text);
  if (date) return dateValue(date);

  const currency = extractCurrency(text);
  const withoutCurrency = currency ? text.slice(currency.length).trim() : text;
  const numeric = Number(withoutCurrency.replace(/,/g, ""));
  if (Number.isFinite(numeric) && /^[-+]?[0-9,]+(\.[0-9]+)?$/.test(withoutCurrency)) {
    return numberValue(numeric, currency);
  }

  return textValue(text);
}

export function parseDate(text: string): Date | null {
  let match = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(text);
  if (match) return validDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (match) return validDate(Number(match[3]), Number(match[2]), Number(match[1]));

  return null;
}

export function formatFormulaValue(value: FormulaValue, settings: SpreadsheetTableSettings): string {
  if (value.type === "error") return value.error ?? "#ERROR!";
  if (value.type === "blank") return "";
  if (value.type === "date" && value.value instanceof Date) return formatDate(value.value);
  if (value.type === "number" && typeof value.value === "number") {
    const formatted = formatNumber(value.value, settings);
    return `${value.currency ?? ""}${formatted}`;
  }
  return String(value.value ?? "");
}

export function formatNumber(value: number, settings: SpreadsheetTableSettings): string {
  const fixed = value.toFixed(settings.decimalPlaces);
  const [integer, decimal] = fixed.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, settings.groupingSeparator);
  if (settings.decimalPlaces === 0) return grouped;
  return `${grouped}${settings.decimalSeparator}${decimal}`;
}

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = stripTime(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function diffDays(left: Date, right: Date): number {
  return Math.round((stripTime(left).getTime() - stripTime(right).getTime()) / 86400000);
}

export function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function unifyCurrency(values: FormulaValue[]): CurrencyResolution {
  const currencies = new Set(values.filter((value) => value.type === "number" && value.currency).map((value) => value.currency));
  if (currencies.size > 1) return { status: "mixed" };
  return { status: "single", currency: currencies.values().next().value };
}

function extractCurrency(text: string): string | undefined {
  const upper = text.toUpperCase();
  return CURRENCIES.find((currency) => upper.startsWith(currency.toUpperCase()));
}

function validDate(year: number, month: number, day: number): Date | null {
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}
