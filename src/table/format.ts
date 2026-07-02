import type { Alignment, MarkdownTable } from "../types";
import { cloneTable, formatMarkdownTable, markerFromAlignment, normalizeRow } from "./parser";

export function formatTable(table: MarkdownTable): string {
  return formatMarkdownTable(table);
}

export function addRow(table: MarkdownTable, afterBodyRow = table.rows.length - 1): MarkdownTable {
  return insertRowAt(table, Math.max(afterBodyRow + 1, 0));
}

export function insertRowAt(table: MarkdownTable, bodyRowIndex: number): MarkdownTable {
  const next = cloneTable(table);
  const row = Array.from({ length: next.headers.length }, () => "");
  next.rows.splice(clamp(bodyRowIndex, 0, next.rows.length), 0, row);
  return next;
}

export function deleteRow(table: MarkdownTable, bodyRow: number): MarkdownTable {
  const next = cloneTable(table);
  if (next.rows.length > 0) next.rows.splice(clamp(bodyRow, 0, next.rows.length - 1), 1);
  return next;
}

export function addColumn(table: MarkdownTable, afterCol = table.headers.length - 1): MarkdownTable {
  const next = cloneTable(table);
  const index = clamp(afterCol + 1, 0, next.headers.length);
  next.headers.splice(index, 0, "");
  next.alignments.splice(index, 0, "left");
  next.rows.forEach((row) => row.splice(index, 0, ""));
  return next;
}

export function deleteColumn(table: MarkdownTable, col: number): MarkdownTable {
  const next = cloneTable(table);
  if (next.headers.length <= 1) return next;
  const index = clamp(col, 0, next.headers.length - 1);
  next.headers.splice(index, 1);
  next.alignments.splice(index, 1);
  next.rows.forEach((row) => row.splice(index, 1));
  return next;
}

export function moveRow(table: MarkdownTable, from: number, direction: -1 | 1): MarkdownTable {
  const next = cloneTable(table);
  const to = from + direction;
  if (from < 0 || from >= next.rows.length || to < 0 || to >= next.rows.length) return next;
  const [row] = next.rows.splice(from, 1);
  next.rows.splice(to, 0, row);
  return next;
}

export function moveColumn(table: MarkdownTable, from: number, direction: -1 | 1): MarkdownTable {
  const next = cloneTable(table);
  const to = from + direction;
  if (from < 0 || from >= next.headers.length || to < 0 || to >= next.headers.length) return next;
  moveItem(next.headers, from, to);
  moveItem(next.alignments, from, to);
  next.rows.forEach((row) => moveItem(row, from, to));
  return next;
}

export function setAlignment(table: MarkdownTable, col: number, alignment: Alignment): MarkdownTable {
  const next = cloneTable(table);
  next.alignments[clamp(col, 0, next.alignments.length - 1)] = alignment;
  return next;
}

export function sortByColumn(table: MarkdownTable, col: number, direction: "asc" | "desc"): MarkdownTable {
  const next = cloneTable(table);
  const multiplier = direction === "asc" ? 1 : -1;
  next.rows.sort((a, b) => compareCells(a[col] ?? "", b[col] ?? "") * multiplier);
  return next;
}

export function ensureTableShape(table: MarkdownTable): MarkdownTable {
  const width = Math.max(table.headers.length, table.alignments.length, ...table.rows.map((row) => row.length));
  const next = cloneTable(table);
  next.headers = normalizeRow(next.headers, width);
  next.alignments = Array.from({ length: width }, (_, index) => next.alignments[index] ?? "left");
  next.rows = next.rows.map((row) => normalizeRow(row, width));
  return next;
}

export function alignmentMarker(alignment: Alignment): string {
  return markerFromAlignment(alignment);
}

function compareCells(a: string, b: string): number {
  const aNumber = Number(a.replace(/,/g, ""));
  const bNumber = Number(b.replace(/,/g, ""));
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function moveItem<T>(array: T[], from: number, to: number): void {
  const [item] = array.splice(from, 1);
  array.splice(to, 0, item);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
