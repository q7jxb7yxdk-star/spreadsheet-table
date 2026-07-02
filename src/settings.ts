import { PluginSettingTab, Setting } from "obsidian";
import type SpreadsheetTablePlugin from "./main";
import { DEFAULT_SETTINGS } from "./types";

export class SpreadsheetTableSettingTab extends PluginSettingTab {
  constructor(private readonly plugin: SpreadsheetTablePlugin) {
    super(plugin.app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Spreadsheet Table" });

    new Setting(containerEl)
      .setName("Show column letters and row numbers in Live Preview")
      .setDesc("Display Excel-style table headers while editing.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showHeadersInLivePreview).onChange(async (value) => {
          this.plugin.settings.showHeadersInLivePreview = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Decimal places")
      .setDesc("Number of decimal places for formula results.")
      .addDropdown((dropdown) => {
        for (let index = 0; index <= 15; index++) dropdown.addOption(String(index), String(index));
        dropdown.setValue(String(this.plugin.settings.decimalPlaces)).onChange(async (value) => {
          this.plugin.settings.decimalPlaces = Number(value);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Grouping separator")
      .setDesc("Separator used for thousands.")
      .addText((text) =>
        text.setPlaceholder(DEFAULT_SETTINGS.groupingSeparator).setValue(this.plugin.settings.groupingSeparator).onChange(async (value) => {
          this.plugin.settings.groupingSeparator = value || DEFAULT_SETTINGS.groupingSeparator;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Decimal separator")
      .setDesc("Separator used between integer and decimal parts.")
      .addText((text) =>
        text.setPlaceholder(DEFAULT_SETTINGS.decimalSeparator).setValue(this.plugin.settings.decimalSeparator).onChange(async (value) => {
          this.plugin.settings.decimalSeparator = value || DEFAULT_SETTINGS.decimalSeparator;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable dependency highlight")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableDependencyHighlight).onChange(async (value) => {
          this.plugin.settings.enableDependencyHighlight = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable formula rendering in Live Preview")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableFormulaRenderingInLivePreview).onChange(async (value) => {
          this.plugin.settings.enableFormulaRenderingInLivePreview = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Enable formula rendering in Reading Mode")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.enableFormulaRenderingInReadingMode).onChange(async (value) => {
          this.plugin.settings.enableFormulaRenderingInReadingMode = value;
          await this.plugin.saveSettings();
        })
      );
  }
}
