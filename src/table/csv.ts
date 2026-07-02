import type { MarkdownTable } from "../types";

export function tableToCsv(table: MarkdownTable): string {
  return [table.headers, ...table.rows].map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}
