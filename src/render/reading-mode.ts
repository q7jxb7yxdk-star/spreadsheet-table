import type { MarkdownPostProcessorContext } from "obsidian";
import type { MarkdownTable, SpreadsheetTableSettings } from "../types";
import { evaluateTable } from "../formula/evaluator";
import { cellKey } from "../formula/references";
import { findTableAtLine, isFormulaText } from "../table/parser";

export function renderReadingMode(el: HTMLElement, ctx: MarkdownPostProcessorContext, settings: SpreadsheetTableSettings): void {
  if (!settings.enableFormulaRenderingInReadingMode) return;

  const sectionOffsets = new Map<string, number>();
  el.querySelectorAll("table").forEach((tableEl) => {
    const table = tableFromElement(tableEl);
    if (!table) return;

    // Rendered text has already lost Markdown emphasis markers, including '*'
    // operators. Only evaluate formulas recovered from the original source.
    const section = ctx.getSectionInfo(tableEl);
    if (!section) return;
    const sectionKey = `${section.lineStart}:${section.lineEnd}`;
    const offset = sectionOffsets.get(sectionKey) ?? 0;
    sectionOffsets.set(sectionKey, offset + 1);
    const sourceTables: MarkdownTable[] = [];
    for (let line = section.lineStart; line <= section.lineEnd; line++) {
      const sourceTable = findTableAtLine(section.text, line);
      if (!sourceTable) continue;
      sourceTables.push(sourceTable);
      line = sourceTable.endLine;
    }
    const sourceTable = sourceTables[offset];
    if (!sourceTable) return;
    const sourceRows = [sourceTable.headers, ...sourceTable.rows];
    const renderedRows = [table.headers, ...table.rows];
    if (sourceRows.length !== renderedRows.length || sourceRows.some((row, index) => row.length !== renderedRows[index].length)) return;
    renderedRows.forEach((row, rowIndex) => {
      row.forEach((_cell, col) => {
        const source = sourceRows[rowIndex][col];
        // Preserve rendered text for ordinary cells (links, formatting, etc.).
        // Replace every formula so references also use the intact expression.
        row[col] = isFormulaText(source) ? source : isFormulaText(row[col]) ? "" : row[col];
      });
    });
    const evaluation = evaluateTable(table, settings);

    const rows = Array.from(tableEl.querySelectorAll("tr"));
    rows.forEach((rowEl, row) => {
      Array.from(rowEl.children).forEach((cellEl, col) => {
        const result = evaluation.results.get(cellKey({ row, col }));
        if (!result) return;
        cellEl.empty();
        const span = cellEl.createSpan({ text: result.display, cls: result.value.type === "error" ? "spreadsheet-table-error" : "spreadsheet-table-result" });
        span.setAttr("data-spreadsheet-table-formula", "true");
      });
    });
  });
}

function tableFromElement(tableEl: Element): MarkdownTable | null {
  const rowEls = Array.from(tableEl.querySelectorAll("tr"));
  if (rowEls.length === 0) return null;

  const rows = rowEls.map((row) => Array.from(row.children).map((cell) => cell.textContent?.trim() ?? ""));
  const headers = rows[0] ?? [];
  const body = rows.slice(1);

  return {
    startLine: 0,
    endLine: rows.length + 1,
    headers,
    alignments: headers.map(() => "left"),
    rows: body,
    rawLines: []
  };
}
