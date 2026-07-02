# Spreadsheet Table

Spreadsheet Table is an Obsidian plugin for spreadsheet-style Markdown tables. It adds table editing commands, formula calculation, Live Preview rendering, Reading Mode rendering, and a right sidebar toolbar for working with Markdown tables.

The plugin keeps your Markdown source as plain Markdown tables. Formula cells remain in the note as formulas, while Live Preview and Reading Mode can display calculated results.

## Features

- Detect and edit Markdown tables from the current table cell.
- Format Markdown tables without changing formula meaning.
- Navigate table cells with Tab, Shift+Tab, and Enter.
- Insert rows above or below the selected cell.
- Insert columns to the left or right of the selected cell.
- Delete, move, align, and sort rows or columns.
- Export the selected table to CSV.
- Command Palette commands for table actions.
- Right sidebar toolbar and Ribbon icon.
- Mobile-friendly toolbar layout.
- Live Preview formula result rendering while preserving Markdown source.
- Reading Mode formula result rendering.
- Optional Excel-style column letters and row numbers in Live Preview.

## Usage

Open a note with a Markdown table and select a table cell.

You can run Spreadsheet Table actions from:

- The Command Palette.
- The Spreadsheet Table right sidebar toolbar.
- Configured Obsidian hotkeys.

In Live Preview, click a rendered table cell before using toolbar actions. In Source Mode, place the cursor inside a Markdown table cell before using toolbar actions.

## Table Editing

Spreadsheet Table supports common table operations:

- Format table.
- Insert 1 row above.
- Insert 1 row below.
- Delete row.
- Insert 1 column to the left.
- Insert 1 column to the right.
- Delete column.
- Move row up or down.
- Move column left or right.
- Align column left, center, or right.
- Sort column ascending or descending.
- Export table to CSV.

Formatting preserves formula meaning and standardizes formula references and function names to uppercase.

## Formulas

Formulas start with `=`.

```text
=A2+B2
=a2*b2
=SUM(A2:A10)
=Average(B2:B10)
=B2:B99+C2:C99
=B:B+C:C
=CONVERT(A2, 0.5, "$")
=DATE(2026,7,1)
=TODAY()
=DAYS(B2,A2)
```

Table formatting standardizes formula references and function names:

```text
=a2*b2 -> =A2*B2
=Average(B2:B10) -> =AVERAGE(B2:B10)
```

Supported formula behavior:

- A1 references, including multi-letter columns such as `AA1`.
- Ranges such as `A2:A10` and `A2:C10`.
- Range arithmetic such as `=B2:B99+C2:C99`, treated as summed ranges.
- Full-column ranges such as `=B:B+C:C`, limited to the current Markdown table.
- Case-insensitive function names.
- `SUM()` and `AVERAGE()` skip blank cells, `-`, and dates.
- Formula cells can depend on other formula cells.
- Circular references display `#CIRC!`.
- Mixed currency references display `#CURRENCY!`.
- Date arithmetic supports adding or subtracting days and subtracting dates.

## Numbers And Currency

The evaluator accepts numbers such as:

```text
1,000
3,000.50
```

Supported currency prefixes:

```text
$ US$ HK$ CA$ C$ AU$ A$ NZ$ SG$ NT$ MX$ ¥ ￥ JPY CNY RMB
```

If a formula references a single currency, the result keeps that prefix. If it mixes currencies, the result is `#CURRENCY!`.

## Dates

Supported date cells:

```text
2026-07-01
2026/07/01
01/07/2026
```

Examples:

```text
=A2+7
=A2-7
=B2-A2
=DATE(2026,7,1)
=TODAY()
=DAYS(B2,A2)
```

Date results are displayed as `YYYY-MM-DD`.

## Live Preview And Reading Mode

Live Preview can display formula results while preserving the Markdown formula in the source note.

Reading Mode can also display formula results. Reading Mode does not show cell labels.

Live Preview can optionally show Excel-style column letters and row numbers for rendered tables.

## Settings

- Show column letters and row numbers in Live Preview.
- Decimal places from 0 to 15. Default: 2.
- Grouping separator. Default: `,`.
- Decimal separator. Default: `.`.
- Enable dependency highlight.
- Enable formula rendering in Live Preview.
- Enable formula rendering in Reading Mode.

## Installation

After the plugin is available in Obsidian Community Plugins, install it from:

```text
Settings -> Community plugins -> Browse
```

Search for:

```text
Spreadsheet Table
```

## Manual Installation

Copy the built plugin files to:

```text
<vault>/.obsidian/plugins/spreadsheet-table/
```

Required runtime files:

- `manifest.json`
- `main.js`
- `styles.css`

Then enable Spreadsheet Table from Obsidian Community Plugins.

## Development

```bash
npm install
npm run build
npm run lint
```

For development builds:

```bash
npm run dev
```

## Limitations

Spreadsheet Table does not support:

- Advanced Tables `TBLFM` syntax.
- Formula toolbar `fx`.
- Excel file import/export.
- Automatic live exchange rates.
- Full Excel function compatibility.

## License

MIT
