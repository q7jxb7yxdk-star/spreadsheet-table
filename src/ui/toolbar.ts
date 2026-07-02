import { MarkdownView, Notice, ItemView, setIcon, setTooltip, type Editor, type WorkspaceLeaf } from "obsidian";
import type SpreadsheetTablePlugin from "../main";
import { getLivePreviewCellSelection } from "../render/live-preview";
import {
  alignActiveColumn,
  deleteActiveColumn,
  deleteActiveRow,
  exportActiveTableToCsv,
  findTableByRange,
  formatActiveTable,
  getActiveTable,
  insertActiveColumnLeft,
  insertActiveColumnRight,
  insertActiveRowAbove,
  insertActiveRowBelow,
  moveActiveColumn,
  moveActiveRow,
  setCursorToTableCell,
  sortActiveColumn
} from "../table/editor";
import { SPREADSHEET_ICON } from "./icons";

export const SPREADSHEET_TOOLBAR_VIEW = "spreadsheet-table-toolbar-view";

interface ToolbarAction {
  icon: string;
  label: string;
  scope: "cell" | "row" | "column" | "none";
  run: (plugin: SpreadsheetTablePlugin) => void | Promise<void>;
}

const ACTIONS: ToolbarAction[] = [
  { icon: "table", label: "Format table", scope: "cell", run: (plugin) => runWithEditor(plugin, "cell", formatActiveTable) },
  { icon: "panel-top-open", label: "Insert 1 row above", scope: "row", run: (plugin) => runWithEditor(plugin, "row", insertActiveRowAbove) },
  { icon: "panel-bottom-open", label: "Insert 1 row below", scope: "row", run: (plugin) => runWithEditor(plugin, "row", insertActiveRowBelow) },
  { icon: "list-minus", label: "Delete row", scope: "row", run: (plugin) => runWithEditor(plugin, "row", deleteActiveRow) },
  { icon: "panel-left-open", label: "Insert 1 column to the left", scope: "column", run: (plugin) => runWithEditor(plugin, "column", insertActiveColumnLeft) },
  { icon: "panel-right-open", label: "Insert 1 column to the right", scope: "column", run: (plugin) => runWithEditor(plugin, "column", insertActiveColumnRight) },
  { icon: "columns-3", label: "Delete column", scope: "column", run: (plugin) => runWithEditor(plugin, "column", deleteActiveColumn) },
  { icon: "arrow-up", label: "Move row up", scope: "row", run: (plugin) => runWithEditor(plugin, "row", (editor) => moveActiveRow(editor, -1)) },
  { icon: "arrow-down", label: "Move row down", scope: "row", run: (plugin) => runWithEditor(plugin, "row", (editor) => moveActiveRow(editor, 1)) },
  { icon: "arrow-left", label: "Move column left", scope: "column", run: (plugin) => runWithEditor(plugin, "column", (editor) => moveActiveColumn(editor, -1)) },
  { icon: "arrow-right", label: "Move column right", scope: "column", run: (plugin) => runWithEditor(plugin, "column", (editor) => moveActiveColumn(editor, 1)) },
  { icon: "align-left", label: "Align left", scope: "column", run: (plugin) => runWithEditor(plugin, "column", (editor) => alignActiveColumn(editor, "left")) },
  { icon: "align-center", label: "Align center", scope: "column", run: (plugin) => runWithEditor(plugin, "column", (editor) => alignActiveColumn(editor, "center")) },
  { icon: "align-right", label: "Align right", scope: "column", run: (plugin) => runWithEditor(plugin, "column", (editor) => alignActiveColumn(editor, "right")) },
  { icon: "arrow-up-a-z", label: "Sort ascending", scope: "column", run: (plugin) => runWithEditor(plugin, "column", (editor) => sortActiveColumn(editor, "asc")) },
  { icon: "arrow-down-z-a", label: "Sort descending", scope: "column", run: (plugin) => runWithEditor(plugin, "column", (editor) => sortActiveColumn(editor, "desc")) },
  { icon: "download", label: "Export CSV", scope: "cell", run: (plugin) => runWithEditor(plugin, "cell", exportActiveTableToCsv) },
  {
    icon: "circle-help",
    label: "Help",
    scope: "none",
    run: () => {
      window.open("https://github.com/sunnyyu/spreadsheet-table/blob/main/README.md");
    }
  }
];

export class SpreadsheetToolbarView extends ItemView {
  constructor(
    leaf: WorkspaceLeaf,
    private readonly plugin: SpreadsheetTablePlugin
  ) {
    super(leaf);
  }

  getViewType(): string {
    return SPREADSHEET_TOOLBAR_VIEW;
  }

  getDisplayText(): string {
    return "Spreadsheet Table";
  }

  getIcon(): string {
    return SPREADSHEET_ICON;
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("spreadsheet-table-sidebar");
    container.createEl("h3", { text: "Spreadsheet Table" });
    createToolbar(container, this.plugin);
  }
}

export function createToolbar(container: Element, plugin: SpreadsheetTablePlugin): void {
  const toolbar = container.createDiv({ cls: "spreadsheet-table-toolbar" });
  ACTIONS.forEach((action) => {
    const button = toolbar.createEl("button", {
      attr: {
        "aria-label": action.label,
        type: "button"
      }
    });
    setIcon(button, action.icon);
    setTooltip(button, action.label, { placement: "top" });
    button.addEventListener("click", () => {
      void action.run(plugin);
    });
  });
}

type ToolbarScope = ToolbarAction["scope"];

async function runWithEditor(plugin: SpreadsheetTablePlugin, scope: Exclude<ToolbarScope, "none">, callback: (editor: Editor) => void | boolean | Promise<void | boolean>): Promise<void> {
  const markdownView = plugin.app.workspace.getMostRecentLeaf()?.view instanceof MarkdownView ? plugin.app.workspace.getMostRecentLeaf()?.view : plugin.app.workspace.getActiveViewOfType(MarkdownView);

  if (!(markdownView instanceof MarkdownView)) {
    new Notice("Open a Markdown note first.");
    return;
  }

  if (!getActiveTable(markdownView.editor) && !restoreLivePreviewCellSelection(markdownView.editor, scope)) {
    new Notice("Select a table cell first.");
    return;
  }

  await callback(markdownView.editor);
}

function restoreLivePreviewCellSelection(editor: Editor, scope: Exclude<ToolbarScope, "none">): boolean {
  const selection = getLivePreviewCellSelection();
  if (!selection) return false;

  const table = findTableByRange(editor, selection.tableStartLine, selection.tableEndLine);
  if (!table) return false;

  const row = scope === "column" ? 0 : selection.row;
  setCursorToTableCell(editor, table, row, selection.col);
  return true;
}
