# Spreadsheet Table Help

Spreadsheet Table adds spreadsheet-style editing and formulas to Obsidian Markdown tables.

## Table Editing

Place the cursor inside a Markdown table, then use the Command Palette or Spreadsheet Table toolbar to:

- Format table.
- Insert rows above or below.
- Insert columns to the left or right.
- Delete rows or columns.
- Move rows up or down.
- Move columns left or right.
- Align columns left, center, or right.
- Sort the current column ascending or descending.
- Export the table to CSV.

Tab, Shift+Tab, and Enter move between cells when the cursor is inside a table.

## Formulas

Use `=` at the start of a cell:

```text
| Item | Qty | Price | Total |
| --- | ---: | ---: | ---: |
| A | 2 | $1,000.00 | =B2*C2 |
| B | 3 | $5.50 | =B3*C3 |
| Sum | | | =SUM(D2:D3) |
```

Supported functions:

- `SUM(range)`
- `AVERAGE(range)`
- `CONVERT(value, rate, currency)`
- `DATE(year, month, day)`
- `TODAY()`
- `DAYS(end_date, start_date)`

Function names are case-insensitive.

Table formatting standardizes formula references and function names to uppercase:

```text
=a2*b2 -> =A2*B2
=Average(B2:B10) -> =AVERAGE(B2:B10)
```

Range arithmetic is supported:

```text
=B2:B99+C2:C99
=B:B+C:C
```

Ranges used with operators are treated as summed ranges. Full-column ranges are limited to rows in the current Markdown table.

## Dates

Supported date cells:

- `2026-07-01`
- `2026/07/01`
- `01/07/2026`

Date formulas:

```text
=A2+7
=A2-7
=B2-A2
=DATE(2026,7,1)
=TODAY()
=DAYS(B2,A2)
```

Date results are displayed as `YYYY-MM-DD`.

## Rendering

Live Preview and Reading Mode can show formula results while the Markdown source remains unchanged. Live Preview can also show Excel-style column letters and row numbers. These behaviors can be changed in plugin settings.
