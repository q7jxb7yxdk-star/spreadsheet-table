import type { Editor } from "obsidian";
import type SpreadsheetTablePlugin from "./main";
import {
  addActiveColumn,
  addActiveRow,
  alignActiveColumn,
  deleteActiveColumn,
  deleteActiveRow,
  exportActiveTableToCsv,
  formatActiveTable,
  insertActiveColumnLeft,
  insertActiveColumnRight,
  insertActiveRowAbove,
  insertActiveRowBelow,
  moveActiveColumn,
  moveActiveRow,
  sortActiveColumn
} from "./table/editor";

export function registerSpreadsheetCommands(plugin: SpreadsheetTablePlugin): void {
  const editorCommand = (id: string, name: string, callback: (editor: Editor) => void | Promise<void>) => {
    plugin.addCommand({
      id,
      name,
      editorCallback: callback
    });
  };

  editorCommand("format-table", "Format current table", (editor) => void formatActiveTable(editor));
  editorCommand("insert-row-above", "Insert 1 row above", (editor) => void insertActiveRowAbove(editor));
  editorCommand("insert-row-below", "Insert 1 row below", (editor) => void insertActiveRowBelow(editor));
  editorCommand("add-row", "Add row", (editor) => void addActiveRow(editor));
  editorCommand("delete-row", "Delete row", (editor) => void deleteActiveRow(editor));
  editorCommand("insert-column-left", "Insert 1 column to the left", (editor) => void insertActiveColumnLeft(editor));
  editorCommand("insert-column-right", "Insert 1 column to the right", (editor) => void insertActiveColumnRight(editor));
  editorCommand("add-column", "Add column", (editor) => void addActiveColumn(editor));
  editorCommand("delete-column", "Delete column", (editor) => void deleteActiveColumn(editor));
  editorCommand("move-row-up", "Move row up", (editor) => void moveActiveRow(editor, -1));
  editorCommand("move-row-down", "Move row down", (editor) => void moveActiveRow(editor, 1));
  editorCommand("move-column-left", "Move column left", (editor) => void moveActiveColumn(editor, -1));
  editorCommand("move-column-right", "Move column right", (editor) => void moveActiveColumn(editor, 1));
  editorCommand("align-column-left", "Align column left", (editor) => void alignActiveColumn(editor, "left"));
  editorCommand("align-column-center", "Align column center", (editor) => void alignActiveColumn(editor, "center"));
  editorCommand("align-column-right", "Align column right", (editor) => void alignActiveColumn(editor, "right"));
  editorCommand("sort-column-ascending", "Sort column ascending", (editor) => void sortActiveColumn(editor, "asc"));
  editorCommand("sort-column-descending", "Sort column descending", (editor) => void sortActiveColumn(editor, "desc"));
  editorCommand("export-table-to-csv", "Export table to CSV", async (editor) => void (await exportActiveTableToCsv(editor)));

  plugin.addCommand({
    id: "open-help",
    name: "Open help",
    callback: () => {
      activeWindow.open("https://github.com/q7jxb7yxdk-star/spreadsheet-table/blob/main/README.md");
    }
  });
}
