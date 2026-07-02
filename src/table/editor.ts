import { MarkdownView, Notice, type App, type Editor } from "obsidian";
import type { Alignment, MarkdownTable } from "../types";
import { normalizeFormulaText } from "../formula/parser";
import { tableToCsv } from "./csv";
import { addColumn, deleteColumn, deleteRow, formatTable, insertRowAt, moveColumn, moveRow, setAlignment, sortByColumn } from "./format";
import { findTableAtLine, getCellPositionFromLine } from "./parser";

export function getActiveMarkdownView(app: App): MarkdownView | null {
  return app.workspace.getActiveViewOfType(MarkdownView);
}

export function getActiveTable(editor: Editor): MarkdownTable | null {
  const cursor = editor.getCursor();
  return findTableAtLine(editor.getValue(), cursor.line);
}

export function findTables(editor: Editor): MarkdownTable[] {
  const docText = editor.getValue();
  const lines = docText.split("\n");
  const tables: MarkdownTable[] = [];
  let line = 0;

  while (line < lines.length) {
    const table = findTableAtLine(docText, line);
    if (!table) {
      line++;
      continue;
    }

    tables.push(table);
    line = table.endLine + 1;
  }

  return tables;
}

export function findTableByRange(editor: Editor, startLine: number, endLine: number): MarkdownTable | null {
  return findTables(editor).find((table) => table.startLine === startLine && table.endLine === endLine) ?? null;
}

export function setCursorToTableCell(editor: Editor, table: MarkdownTable, row: number, col: number): void {
  const sourceLine = row === 0 ? table.startLine : table.startLine + row + 1;
  const lineText = editor.getLine(sourceLine);
  editor.setCursor({ line: sourceLine, ch: findCellStart(lineText, col) });
}

export function replaceTable(editor: Editor, table: MarkdownTable, next: MarkdownTable): void {
  editor.replaceRange(formatTable(next), { line: table.startLine, ch: 0 }, { line: table.endLine, ch: editor.getLine(table.endLine).length });
}

export function withActiveTable(editor: Editor, operation: (table: MarkdownTable) => MarkdownTable | string | void): boolean {
  const table = getActiveTable(editor);
  if (!table) {
    new Notice("Place the cursor inside a Markdown table first.");
    return false;
  }

  const result = operation(table);
  if (typeof result === "string") {
    editor.replaceRange(result, { line: table.startLine, ch: 0 }, { line: table.endLine, ch: editor.getLine(table.endLine).length });
  } else if (result) {
    replaceTable(editor, table, result);
  }

  return true;
}

export function formatActiveTable(editor: Editor): boolean {
  return withActiveTable(editor, (table) => table);
}

export function addActiveRow(editor: Editor): boolean {
  return insertActiveRowBelow(editor);
}

export function insertActiveRowAbove(editor: Editor): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    const bodyRow = position ? bodyRowIndexFromTablePosition(position.row) : 0;
    return insertRowAt(table, bodyRow);
  });
}

export function insertActiveRowBelow(editor: Editor): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    const bodyRow = position ? bodyRowIndexFromTablePosition(position.row) : table.rows.length - 1;
    return insertRowAt(table, bodyRow + 1);
  });
}

export function deleteActiveRow(editor: Editor): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    if (!position || position.row < 2) return table;
    return deleteRow(table, bodyRowIndexFromTablePosition(position.row));
  });
}

export function addActiveColumn(editor: Editor): boolean {
  return insertActiveColumnRight(editor);
}

export function insertActiveColumnLeft(editor: Editor): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    return addColumn(table, (position?.col ?? 0) - 1);
  });
}

export function insertActiveColumnRight(editor: Editor): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    return addColumn(table, position?.col ?? table.headers.length - 1);
  });
}

export function deleteActiveColumn(editor: Editor): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    return deleteColumn(table, position?.col ?? table.headers.length - 1);
  });
}

export function moveActiveRow(editor: Editor, direction: -1 | 1): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    if (!position || position.row < 2) return table;
    return moveRow(table, bodyRowIndexFromTablePosition(position.row), direction);
  });
}

export function moveActiveColumn(editor: Editor, direction: -1 | 1): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    return moveColumn(table, position?.col ?? 0, direction);
  });
}

export function alignActiveColumn(editor: Editor, alignment: Alignment): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    return setAlignment(table, position?.col ?? 0, alignment);
  });
}

export function sortActiveColumn(editor: Editor, direction: "asc" | "desc"): boolean {
  return withActiveTable(editor, (table) => {
    const position = getCellPositionFromLine(table, editor.getCursor().line, editor.getCursor().ch);
    return sortByColumn(table, position?.col ?? 0, direction);
  });
}

export async function exportActiveTableToCsv(editor: Editor): Promise<boolean> {
  const table = getActiveTable(editor);
  if (!table) {
    new Notice("Place the cursor inside a Markdown table first.");
    return false;
  }

  downloadTextFile("spreadsheet-table.csv", tableToCsv(table), "text/csv;charset=utf-8");
  new Notice("Table CSV downloaded.");
  return true;
}

export function navigateTableCell(editor: Editor, direction: 1 | -1 | "down"): boolean {
  const table = getActiveTable(editor);
  if (!table) return false;
  const cursor = editor.getCursor();
  const position = getCellPositionFromLine(table, cursor.line, cursor.ch);
  if (!position) return false;

  let nextLine = cursor.line;
  let nextCol = position.col;
  if (direction === "down") {
    nextLine = Math.min(table.endLine, cursor.line + 1);
  } else {
    nextCol = position.col + direction;
    if (nextCol < 0) {
      nextLine = Math.max(table.startLine, cursor.line - 1);
      nextCol = table.headers.length - 1;
    } else if (nextCol >= table.headers.length) {
      nextLine = Math.min(table.endLine, cursor.line + 1);
      nextCol = 0;
    }
    if (nextLine === table.startLine + 1) nextLine += direction === 1 ? 1 : -1;
  }

  const line = editor.getLine(nextLine);
  const ch = findCellStart(line, nextCol);
  editor.setCursor({ line: nextLine, ch });
  return true;
}

export function normalizeActiveFormulaCell(editor: Editor): boolean {
  const table = getActiveTable(editor);
  if (!table) return false;

  const cursor = editor.getCursor();
  const position = getCellPositionFromLine(table, cursor.line, cursor.ch);
  if (!position) return false;

  const line = editor.getLine(cursor.line);
  const range = findCellContentRange(line, position.col);
  if (!range) return false;

  const cellText = line.slice(range.from, range.to);
  const normalized = normalizeFormulaText(cellText);
  if (normalized === cellText) return false;

  editor.replaceRange(normalized, { line: cursor.line, ch: range.from }, { line: cursor.line, ch: range.to });
  editor.setCursor({ line: cursor.line, ch: Math.min(cursor.ch, line.length - cellText.length + normalized.length) });
  return true;
}

function findCellStart(line: string, col: number): number {
  let seen = -1;
  for (let index = 0; index < line.length; index++) {
    if (line[index] === "|") {
      seen++;
      if (seen === col) return Math.min(index + 2, line.length);
    }
  }
  return line.length;
}

function findCellContentRange(line: string, col: number): { from: number; to: number } | null {
  let start = line.startsWith("|") ? 1 : 0;
  let currentCol = 0;
  let escaped = false;

  for (let index = start; index < line.length; index++) {
    const char = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "|") {
      if (currentCol === col) return trimCellRange(line, start, index);
      currentCol++;
      start = index + 1;
    }
  }

  if (currentCol === col) return trimCellRange(line, start, line.length);
  return null;
}

function trimCellRange(line: string, from: number, to: number): { from: number; to: number } {
  while (from < to && /\s/.test(line[from])) from++;
  while (to > from && /\s/.test(line[to - 1])) to--;
  return { from, to };
}

function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = activeDocument.createElement("a");
  link.href = url;
  link.download = filename;
  link.addClass("spreadsheet-table-hidden-download");
  activeDocument.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bodyRowIndexFromTablePosition(tableLocalRow: number): number {
  return Math.max(tableLocalRow - 2, 0);
}
