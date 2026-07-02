# Spreadsheet Table

Spreadsheet Table is a clean-room Obsidian Community Plugin for spreadsheet-style Markdown tables.

This project does not use, copy, rewrite, or depend on source code from Table Calc, Advanced Tables, CalcCraft, or older Table Calc implementations. The implementation is written from scratch for this repository.

## Features

- Detect the active Markdown table from the editor cursor.
- Format Markdown tables without changing formula text.
- Navigate table cells with Tab, Shift+Tab, and Enter.
- Insert rows above or below, insert columns left or right, delete, move, align, and sort rows or columns.
- Export the current table as CSV to the clipboard.
- Command Palette commands for table operations.
- Right sidebar toolbar and Ribbon icon.
- Mobile-friendly toolbar layout.
- Live Preview formula result rendering while preserving Markdown source.
- Reading Mode formula result rendering.
- Optional Excel-style column letters and row numbers in Live Preview.

## Formula MVP

Formulas start with `=`.

Examples:

```text
=A2+B2
=a2*b2
=SUM(A2:A10)
=Average(B2:B10)
=CONVERT(A2, 0.5, "$")
=DATE(2026,7,1)
=TODAY()
=DAYS(B2,A2)
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
- Date arithmetic supports adding/subtracting days and date subtraction.

## Numbers And Currency

The evaluator accepts numbers such as `1,000` and `3,000.50`.

Supported currency prefixes:

```text
$ US$ HK$ CA$ C$ AU$ A$ NZ$ SG$ NT$ MX$ ¥ ￥ JPY CNY RMB
```

If a formula references a single currency, the result keeps that prefix. If it mixes currencies, the result is `#CURRENCY!`.

## Settings

- Show column letters and row numbers in Live Preview.
- Decimal places from 0 to 15. Default: 2.
- Grouping separator. Default: `,`.
- Decimal separator. Default: `.`.
- Enable dependency highlight.
- Enable formula rendering in Live Preview.
- Enable formula rendering in Reading Mode.

## Install For Development

```bash
npm install
npm run build
```

Copy the built plugin folder to:

```text
<vault>/.obsidian/plugins/spreadsheet-table/
```

Required runtime files:

- `manifest.json`
- `main.js`
- `styles.css`

## Current Scope

The first version intentionally does not support:

- Advanced Tables `TBLFM` syntax.
- Formula toolbar `fx`.
- Excel file import/export.
- Automatic live exchange rates.
- Full Excel function compatibility.

## License

MIT
