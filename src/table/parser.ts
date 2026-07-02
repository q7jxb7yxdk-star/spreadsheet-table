import type { Alignment, CellPosition, MarkdownTable } from "../types";

const ALIGNMENT_RE = /^:?-{3,}:?$/;

export function isFormulaText(value: string): boolean {
  return value.trim().startsWith("=");
}

export function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim();
  const withoutEdges = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  const cells: string[] = [];
  let current = "";
  let escaped = false;

  for (const char of withoutEdges) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (char === "|") {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function alignmentFromMarker(marker: string): Alignment {
  const value = marker.trim();
  const starts = value.startsWith(":");
  const ends = value.endsWith(":");

  if (starts && ends) return "center";
  if (ends) return "right";
  return "left";
}

export function markerFromAlignment(alignment: Alignment): string {
  if (alignment === "center") return ":---:";
  if (alignment === "right") return "---:";
  return "---";
}

export function isAlignmentLine(line: string): boolean {
  const cells = splitMarkdownRow(line);
  return cells.length > 0 && cells.every((cell) => ALIGNMENT_RE.test(cell.trim()));
}

export function isTableRow(line: string): boolean {
  return line.trim().startsWith("|") && line.includes("|");
}

export function findTableAtLine(docText: string, cursorLine: number): MarkdownTable | null {
  const lines = docText.split("\n");
  if (cursorLine < 0 || cursorLine >= lines.length || !isTableRow(lines[cursorLine])) {
    return null;
  }

  let startLine = cursorLine;
  while (startLine > 0 && isTableRow(lines[startLine - 1])) {
    startLine--;
  }

  let endLine = cursorLine;
  while (endLine < lines.length - 1 && isTableRow(lines[endLine + 1])) {
    endLine++;
  }

  if (endLine - startLine < 1 || !isAlignmentLine(lines[startLine + 1])) {
    return null;
  }

  const rawLines = lines.slice(startLine, endLine + 1);
  const headers = splitMarkdownRow(rawLines[0]);
  const alignments = splitMarkdownRow(rawLines[1]).map(alignmentFromMarker);
  const rows = rawLines.slice(2).map(splitMarkdownRow);
  const width = Math.max(headers.length, alignments.length, ...rows.map((row) => row.length));

  return {
    startLine,
    endLine,
    headers: normalizeRow(headers, width),
    alignments: normalizeAlignments(alignments, width),
    rows: rows.map((row) => normalizeRow(row, width)),
    rawLines
  };
}

export function normalizeRow(row: string[], width: number): string[] {
  return Array.from({ length: width }, (_, index) => row[index] ?? "");
}

function normalizeAlignments(alignments: Alignment[], width: number): Alignment[] {
  return Array.from({ length: width }, (_, index) => alignments[index] ?? "left");
}

export function formatMarkdownTable(table: MarkdownTable): string {
  const allRows = [table.headers, ...table.rows];
  const widths = table.headers.map((_, col) => {
    const contentWidth = Math.max(...allRows.map((row) => (row[col] ?? "").length), 3);
    return contentWidth;
  });

  const formatRow = (row: string[]) => {
    const cells = row.map((cell, col) => ` ${padCell(cell, widths[col], table.alignments[col])} `);
    return `|${cells.join("|")}|`;
  };

  const separator = table.alignments.map((alignment, col) => {
    const width = widths[col];
    if (alignment === "center") return ` ${":" + "-".repeat(Math.max(width - 2, 1)) + ":"} `;
    if (alignment === "right") return ` ${"-".repeat(Math.max(width - 1, 2)) + ":"} `;
    return ` ${"-".repeat(width)} `;
  });

  return [formatRow(table.headers), `|${separator.join("|")}|`, ...table.rows.map(formatRow)].join("\n");
}

function padCell(value: string, width: number, alignment: Alignment): string {
  if (alignment === "right") return value.padStart(width, " ");
  if (alignment === "center") {
    const total = Math.max(width - value.length, 0);
    const left = Math.floor(total / 2);
    const right = total - left;
    return `${" ".repeat(left)}${value}${" ".repeat(right)}`;
  }
  return value.padEnd(width, " ");
}

export function getCellPositionFromLine(table: MarkdownTable, line: number, ch: number): CellPosition | null {
  const localLine = line - table.startLine;
  if (localLine < 0 || localLine > table.rawLines.length - 1 || localLine === 1) return null;

  const row = localLine === 0 ? 0 : localLine;
  const raw = table.rawLines[localLine] ?? "";
  const segments = raw.split("|");
  let offset = 0;

  for (let index = 0; index < segments.length; index++) {
    const segmentLength = segments[index].length + 1;
    if (ch <= offset + segmentLength) {
      const col = Math.max(index - 1, 0);
      return { row, col };
    }
    offset += segmentLength;
  }

  return { row, col: Math.max(table.headers.length - 1, 0) };
}

export function cloneTable(table: MarkdownTable): MarkdownTable {
  return {
    ...table,
    headers: [...table.headers],
    alignments: [...table.alignments],
    rows: table.rows.map((row) => [...row]),
    rawLines: [...table.rawLines]
  };
}
