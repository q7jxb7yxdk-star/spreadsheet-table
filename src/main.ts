import { MarkdownView, Plugin } from "obsidian";
import { createLivePreviewExtension, registerLivePreviewTableHeaders } from "./render/live-preview";
import { renderReadingMode } from "./render/reading-mode";
import { SpreadsheetTableSettingTab } from "./settings";
import { registerSpreadsheetCommands } from "./commands";
import { getActiveTable, navigateTableCell } from "./table/editor";
import { DEFAULT_SETTINGS, type SpreadsheetTableSettings } from "./types";
import { registerIcons, SPREADSHEET_ICON } from "./ui/icons";
import { SPREADSHEET_TOOLBAR_VIEW, SpreadsheetToolbarView } from "./ui/toolbar";

export default class SpreadsheetTablePlugin extends Plugin {
  settings: SpreadsheetTableSettings = { ...DEFAULT_SETTINGS };

  async onload(): Promise<void> {
    await this.loadSettings();
    registerIcons();
    registerSpreadsheetCommands(this);
    this.addSettingTab(new SpreadsheetTableSettingTab(this));

    this.registerView(SPREADSHEET_TOOLBAR_VIEW, (leaf) => new SpreadsheetToolbarView(leaf, this));
    this.addRibbonIcon(SPREADSHEET_ICON, "Open Spreadsheet Table toolbar", () => {
      void this.activateToolbar();
    });

    this.registerEditorExtension(createLivePreviewExtension(() => this.settings));
    registerLivePreviewTableHeaders(this, () => this.settings);
    this.registerMarkdownPostProcessor((el, ctx) => renderReadingMode(el, ctx, this.settings));
    this.registerDomEvent(activeDocument, "keydown", (event) => this.handleTableNavigation(event));
  }

  async loadSettings(): Promise<void> {
    const loaded = ((await this.loadData()) ?? {}) as Partial<SpreadsheetTableSettings> & { showCellLabelsInLivePreview?: boolean };
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
    if (loaded.showHeadersInLivePreview === undefined && loaded.showCellLabelsInLivePreview !== undefined) {
      this.settings.showHeadersInLivePreview = loaded.showCellLabelsInLivePreview;
    }
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  async activateToolbar(): Promise<void> {
    const existing = this.app.workspace.getLeavesOfType(SPREADSHEET_TOOLBAR_VIEW)[0];
    if (existing) {
      this.app.workspace.setActiveLeaf(existing, { focus: true });
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: SPREADSHEET_TOOLBAR_VIEW, active: true });
    this.app.workspace.setActiveLeaf(leaf, { focus: true });
  }

  private handleTableNavigation(event: KeyboardEvent): void {
    if (event.defaultPrevented || event.isComposing) return;
    if (event.key !== "Tab" && event.key !== "Enter") return;

    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!markdownView || !getActiveTable(markdownView.editor)) return;

    const direction = event.key === "Enter" ? "down" : event.shiftKey ? -1 : 1;
    if (navigateTableCell(markdownView.editor, direction)) {
      event.preventDefault();
    }
  }
}
