import { RangeSetBuilder, StateField, type Text } from "@codemirror/state";
import { Decoration, EditorView, WidgetType, type DecorationSet } from "@codemirror/view";
import { editorLivePreviewField, type Plugin } from "obsidian";
import type { MarkdownTable, SpreadsheetTableSettings } from "../types";
import { evaluateTable } from "../formula/evaluator";
import { cellKey, columnIndexToName } from "../formula/references";
import { findTableAtLine, splitMarkdownRow } from "../table/parser";

export interface LivePreviewCellSelection {
  tableStartLine: number;
  tableEndLine: number;
  row: number;
  col: number;
}

let livePreviewCellSelection: LivePreviewCellSelection | null = null;

export function getLivePreviewCellSelection(): LivePreviewCellSelection | null {
  return livePreviewCellSelection;
}

export function createLivePreviewExtension(getSettings: () => SpreadsheetTableSettings) {
  return StateField.define<DecorationSet>({
    create(state) {
      return state.field(editorLivePreviewField, false) ? buildDecorations(state.doc, getSettings()) : Decoration.none;
    },
    update(_value, transaction) {
      if (!transaction.docChanged && !transaction.selection) return _value;
      return transaction.state.field(editorLivePreviewField, false) ? buildDecorations(transaction.state.doc, getSettings()) : Decoration.none;
    },
    provide(field) {
      return EditorView.decorations.from(field);
    }
  });
}

class FormulaWidget extends WidgetType {
  constructor(
    private readonly display: string,
    private readonly isError: boolean
  ) {
    super();
  }

  toDOM(): HTMLElement {
    const span = activeDocument.createElement("span");
    span.className = this.isError ? "spreadsheet-table-error" : "spreadsheet-table-result";
    span.appendText(this.display);
    return span;
  }
}

function buildDecorations(doc: Text, settings: SpreadsheetTableSettings): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  if (!settings.enableFormulaRenderingInLivePreview) return builder.finish();

  const text = docToString(doc);
  const visited = new Set<number>();

  for (let lineNumber = 1; lineNumber <= doc.lines; lineNumber++) {
    if (visited.has(lineNumber)) continue;
    const table = findTableAtLine(text, lineNumber - 1);
    if (!table) continue;

    for (let line = table.startLine + 1; line <= table.endLine + 1; line++) visited.add(line);
    try {
      addTableDecorations(builder, doc, table, settings);
    } catch {
      continue;
    }
  }

  return builder.finish();
}

function addTableDecorations(builder: RangeSetBuilder<Decoration>, doc: Text, table: MarkdownTable, settings: SpreadsheetTableSettings): void {
  const evaluation = evaluateTable(table, settings);
  const lines = [table.headers, ...table.rows];

  lines.forEach((row, rowIndex) => {
    const actualLineNumber = rowIndex === 0 ? table.startLine + 1 : table.startLine + rowIndex + 2;
    const line = getLine(doc, actualLineNumber);
    if (!line) return;
    const ranges = cellRanges(line.text);

    row.forEach((cell, col) => {
      if (!cell.trim().startsWith("=")) return;
      const range = ranges[col];
      const result = evaluation.results.get(cellKey({ row: rowIndex, col }));
      if (!range || !result) return;
      builder.add(
        line.from + range.from,
        line.from + range.to,
        Decoration.replace({
          widget: new FormulaWidget(result.display, result.value.type === "error")
        })
      );
    });
  });
}

function getLine(doc: Text, oneBasedLineNumber: number): { from: number; text: string } | null {
  if (oneBasedLineNumber < 1 || oneBasedLineNumber > doc.lines) return null;
  return doc.line(oneBasedLineNumber);
}

function cellRanges(line: string): Array<{ from: number; to: number }> {
  const ranges: Array<{ from: number; to: number }> = [];
  let start = line.startsWith("|") ? 1 : 0;
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
      ranges.push(trimRange(line, start, index));
      start = index + 1;
    }
  }

  if (start < line.length) ranges.push(trimRange(line, start, line.length));
  return ranges;
}

function trimRange(line: string, from: number, to: number): { from: number; to: number } {
  while (from < to && /\s/.test(line[from])) from++;
  while (to > from && /\s/.test(line[to - 1])) to--;
  return { from, to };
}

function docToString(doc: { lines: number; line: (number: number) => { text: string } }): string {
  const lines: string[] = [];
  for (let line = 1; line <= doc.lines; line++) lines.push(doc.line(line).text);
  return lines.join("\n");
}

export function renderedRowsFromMarkdownLine(line: string): string[] {
  return splitMarkdownRow(line);
}

export function registerLivePreviewTableHeaders(plugin: Plugin, getSettings: () => SpreadsheetTableSettings): void {
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      syncLivePreviewTableHeaders(getSettings());
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(activeDocument.body, {
    childList: true,
    subtree: true
  });

  plugin.registerDomEvent(activeDocument, "click", (event) => {
    selectLivePreviewTableCell(event);
  });

  plugin.register(() => observer.disconnect());
  plugin.registerInterval(window.setInterval(schedule, 1500));
  schedule();
}

function syncLivePreviewTableHeaders(settings: SpreadsheetTableSettings): void {
  activeDocument.querySelectorAll<HTMLTableElement>(".spreadsheet-table-live-headers").forEach((table) => {
    if (!settings.showHeadersInLivePreview || !isLivePreviewTable(table)) removeTableHeaders(table);
  });

  if (!settings.showHeadersInLivePreview) return;

  activeDocument.querySelectorAll<HTMLTableElement>(".markdown-source-view.mod-cm6.is-live-preview table, .markdown-source-view.is-live-preview table").forEach((table) => {
    if (!isLivePreviewTable(table)) return;
    applyTableHeaders(table);
  });
}

function isLivePreviewTable(table: HTMLTableElement): boolean {
  const sourceView = table.closest(".markdown-source-view");
  return !!sourceView && sourceView.classList.contains("is-live-preview") && !table.closest(".markdown-preview-view");
}

function applyTableHeaders(table: HTMLTableElement): void {
  const rows = getOriginalRows(table);
  const columnCount = getColumnCount(rows);
  if (columnCount === 0) return;

  table.addClass("spreadsheet-table-live-headers");
  ensureColumnHeaderRow(table, columnCount);
  rows.forEach((row, index) => ensureRowNumber(row, index + 1));
}

function removeTableHeaders(table: HTMLTableElement): void {
  table.removeClass("spreadsheet-table-live-headers");
  table.querySelectorAll(".spreadsheet-table-column-header-row").forEach((row) => row.remove());
  table.querySelectorAll(".spreadsheet-table-row-number").forEach((cell) => cell.remove());
}

function ensureColumnHeaderRow(table: HTMLTableElement, columnCount: number): void {
  const thead = table.tHead ?? table.createTHead();
  let row = thead.querySelector<HTMLTableRowElement>("tr.spreadsheet-table-column-header-row");
  if (!row) {
    row = table.doc.createElement("tr");
    row.addClass("spreadsheet-table-column-header-row");
    thead.insertBefore(row, thead.firstChild);
  }

  row.empty();
  row.appendChild(createHeaderCell(""));
  for (let col = 0; col < columnCount; col++) {
    row.appendChild(createHeaderCell(columnIndexToName(col)));
  }
}

function ensureRowNumber(row: HTMLTableRowElement, rowNumber: number): void {
  let cell = row.querySelector<HTMLTableCellElement>(":scope > .spreadsheet-table-row-number");
  if (!cell) {
    cell = row.doc.createElement("th");
    cell.addClass("spreadsheet-table-row-number");
    row.insertBefore(cell, row.firstChild);
  }
  cell.textContent = String(rowNumber);
}

function selectLivePreviewTableCell(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  const cell = target?.closest<HTMLTableCellElement>("td, th");
  const table = cell?.closest<HTMLTableElement>("table");
  if (!cell || !table || !isLivePreviewTable(table)) return;
  if (cell.hasClass("spreadsheet-table-row-number") || cell.hasClass("spreadsheet-table-column-header-cell")) return;

  const row = cell.parentElement instanceof HTMLTableRowElement ? cell.parentElement : null;
  if (!row || row.hasClass("spreadsheet-table-column-header-row")) return;

  const sourceTable = findSourceTableForLivePreviewTable(table);
  if (!sourceTable) return;

  const rows = getOriginalRows(table);
  const rowIndex = rows.indexOf(row);
  const colIndex = Array.from(row.children).filter((child) => !child.hasClass("spreadsheet-table-row-number")).indexOf(cell);

  if (rowIndex < 0 || colIndex < 0) return;

  clearSelectedLivePreviewCells();
  cell.addClass("spreadsheet-table-selected-cell");
  livePreviewCellSelection = {
    tableStartLine: sourceTable.startLine,
    tableEndLine: sourceTable.endLine,
    row: rowIndex,
    col: colIndex
  };
}

function findSourceTableForLivePreviewTable(table: HTMLTableElement): MarkdownTable | null {
  const sourceView = table.closest(".markdown-source-view");
  if (!(sourceView instanceof HTMLElement)) return null;

  const view = EditorView.findFromDOM(sourceView);
  if (!view) return null;

  const tables = Array.from(sourceView.querySelectorAll<HTMLTableElement>("table")).filter(isLivePreviewTable);
  const tableIndex = tables.indexOf(table);
  if (tableIndex < 0) return null;

  return findMarkdownTablesInText(docToString(view.state.doc))[tableIndex] ?? null;
}

function findMarkdownTablesInText(text: string): MarkdownTable[] {
  const lines = text.split("\n");
  const tables: MarkdownTable[] = [];
  let line = 0;

  while (line < lines.length) {
    const table = findTableAtLine(text, line);
    if (!table) {
      line++;
      continue;
    }

    tables.push(table);
    line = table.endLine + 1;
  }

  return tables;
}

function clearSelectedLivePreviewCells(): void {
  activeDocument.querySelectorAll(".spreadsheet-table-selected-cell").forEach((cell) => cell.removeClass("spreadsheet-table-selected-cell"));
}

function createHeaderCell(text: string): HTMLTableCellElement {
  const cell = activeDocument.createElement("th");
  cell.addClass("spreadsheet-table-column-header-cell");
  cell.textContent = text;
  return cell;
}

function getOriginalRows(table: HTMLTableElement): HTMLTableRowElement[] {
  return Array.from(table.querySelectorAll<HTMLTableRowElement>("tr")).filter((row) => !row.hasClass("spreadsheet-table-column-header-row"));
}

function getColumnCount(rows: HTMLTableRowElement[]): number {
  const firstRow = rows[0];
  if (!firstRow) return 0;
  return Array.from(firstRow.children).filter((cell) => !cell.hasClass("spreadsheet-table-row-number")).length;
}
