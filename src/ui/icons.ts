import { addIcon } from "obsidian";

export const SPREADSHEET_ICON = "spreadsheet-table";

export function registerIcons(): void {
  addIcon(
    SPREADSHEET_ICON,
    `<path d="M16 16h68v68H16z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>
<path d="M16 37h68M16 58h68M37 16v68M58 16v68" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`
  );
}
