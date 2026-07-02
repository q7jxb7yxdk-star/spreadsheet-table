import type { CellPosition } from "../types";

export function columnNameToIndex(name: string): number {
  let result = 0;
  for (const char of name.toUpperCase()) {
    const code = char.charCodeAt(0);
    if (code < 65 || code > 90) return -1;
    result = result * 26 + (code - 64);
  }
  return result - 1;
}

export function columnIndexToName(index: number): string {
  let value = index + 1;
  let name = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

export function parseCellReference(reference: string): CellPosition | null {
  const match = /^([A-Za-z]+)([1-9][0-9]*)$/.exec(reference.trim());
  if (!match) return null;
  return {
    col: columnNameToIndex(match[1]),
    row: Number(match[2]) - 1
  };
}

export function parseColumnReference(reference: string): number | null {
  if (!/^[A-Za-z]+$/.test(reference.trim())) return null;
  const col = columnNameToIndex(reference.trim());
  return col >= 0 ? col : null;
}

export function cellKey(position: CellPosition): string {
  return `${position.row}:${position.col}`;
}

export function expandRange(start: CellPosition, end: CellPosition): CellPosition[] {
  const rowStart = Math.min(start.row, end.row);
  const rowEnd = Math.max(start.row, end.row);
  const colStart = Math.min(start.col, end.col);
  const colEnd = Math.max(start.col, end.col);
  const cells: CellPosition[] = [];

  for (let row = rowStart; row <= rowEnd; row++) {
    for (let col = colStart; col <= colEnd; col++) {
      cells.push({ row, col });
    }
  }

  return cells;
}

export function positionToReference(position: CellPosition): string {
  return `${columnIndexToName(position.col)}${position.row + 1}`;
}
