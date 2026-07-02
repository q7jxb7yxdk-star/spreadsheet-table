import { addIcon } from "obsidian";

export const SPREADSHEET_ICON = "spreadsheet-table";
export const LIST_SORT_ASCENDING_ICON = "list-sort-ascending";
export const LIST_SORT_DESCENDING_ICON = "list-sort-descending";

export function registerIcons(): void {
  addIcon(
    SPREADSHEET_ICON,
    `<path d="M16 16h68v68H16z" fill="none" stroke="currentColor" stroke-width="8" stroke-linejoin="round"/>
<path d="M16 37h68M16 58h68M37 16v68M58 16v68" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`
  );

  addIcon(
    LIST_SORT_ASCENDING_ICON,
    `<path d="M12.5 79.17h75" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M62.5 50h-50" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M37.5 20.83h-25" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`
  );

  addIcon(
    LIST_SORT_DESCENDING_ICON,
    `<path d="M62.5 50h-50" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.5 20.83h75" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M37.5 79.17h-25" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`
  );
}
