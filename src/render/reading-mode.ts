import type { MarkdownPostProcessorContext } from "obsidian";
import type { MarkdownTable, SpreadsheetTableSettings } from "../types";
import { evaluateTable } from "../formula/evaluator";
import { cellKey } from "../formula/references";

export function renderReadingMode(el: HTMLElement, _ctx: MarkdownPostProcessorContext, settings: SpreadsheetTableSettings): void {
  if (!settings.enableFormulaRenderingInReadingMode) return;

  el.querySelectorAll("table").forEach((tableEl) => {
    const table = tableFromElement(tableEl);
    if (!table) return;
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
