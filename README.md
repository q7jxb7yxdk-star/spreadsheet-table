# Spreadsheet Table

Spreadsheet Table is an Obsidian plugin for editing Markdown tables and displaying spreadsheet-style formula results. Tables and formulas remain plain text in the note; the plugin provides editor commands, a sidebar toolbar, Live Preview decorations, and Reading Mode rendering.

For implementation details, see [Technical Documentation](TECHNICAL_DOCUMENTATION.md). A longer usage example is in [Help](docs/help.md).

## Implementation status

- **Implemented:** table formatting; row and column insertion, deletion, movement, alignment and sorting; cell navigation; CSV download; formula evaluation; Command Palette and sidebar actions.
- **Implemented, optional:** formula rendering in Live Preview and Reading Mode, and Excel-style Live Preview column letters and row numbers.
- **Experimental / Inactive:** the dependency-highlight setting is saved, but no runtime rendering path consumes it.
- **Test-covered:** no automated test suite, test framework configuration, or test script is checked into this repository.
- **Verified in this task:** the 2026-11-01 documentation task passed TypeScript checking and full source lint. It did not run a build or automated tests.
- **Externally unverified:** Obsidian UI behavior, mobile compatibility, Community Plugins availability, and execution of the release workflow. Source implementation and CI configuration do not establish these outcomes.

## Requirements

| Item | Repository evidence |
| --- | --- |
| Plugin version | `1.0.3` in `manifest.json` and `package.json` |
| Host | Obsidian `>=1.5.0`, as declared by `manifest.json` |
| Platforms | `isDesktopOnly: false`; no OS-specific minimum versions are declared, and mobile runtime behavior is unverified |
| Development runtime | CI uses Node.js 22; the root package declares no Node.js or npm version requirement |
| Package manager | npm; `package-lock.json` uses lockfile version 3; npm version is not pinned |
| Build tools | TypeScript and esbuild; lint uses ESLint and typescript-eslint |

The locked Obsidian API package is `1.13.1`, distinct from the declared minimum host version. Compatibility with that older host is not validated here. Exact dependency versions and bundle externals are documented in [Technical Documentation](TECHNICAL_DOCUMENTATION.md).

## Installation and setup

From the repository root, using the Node.js 22 runtime selected by CI:

```bash
npm ci
npm run build
```

`npm ci` installs the locked dependency tree and normally requires registry access. The build checks TypeScript and produces a minified `main.js`. There are no API keys, environment files, certificates, backend services, IDE schemes, or simulator targets to configure for local plugin development.

To install the built plugin, create this directory in the intended vault:

```text
<vault>/.obsidian/plugins/spreadsheet-table/
```

Copy these files into it:

- `main.js`
- `manifest.json`
- `styles.css`

Enable **Spreadsheet Table** in Obsidian's Community plugins settings. After replacing runtime files, disable and re-enable the plugin to load the new code. Building in this repository does not copy files into a vault. If the vault uses a custom Obsidian configuration directory, adjust the destination accordingly.

Community Plugins directory publication cannot be confirmed from this repository; manual installation is the documented local route.

## How to run

Open a Markdown note in Obsidian and place the cursor in a table. Use the Command Palette or the ribbon button to open the right sidebar toolbar. In Live Preview, a rendered cell can be selected for toolbar operations. Tab and Shift+Tab navigate horizontally; Enter moves downward within the existing table. No default hotkeys for commands are assigned by the plugin.

```markdown
| Item | Qty | Price | Total |
| --- | ---: | ---: | ---: |
| A | 2 | $1,000.00 | =B2*C2 |
| B | 3 | $5.50 | =B3*C3 |
| Sum | | | =SUM(D2:D3) |
```

The header is spreadsheet row 1, so the first body row is row 2. Formulas start with `=` and support binary `+`, `-`, `*`, `/`, parentheses, A1 references, rectangular ranges, and whole-column ranges within the current table. Multiplication and division take precedence over addition and subtraction. Function names are case-insensitive:

```text
=722*2+621*2
=SUM(B2:B10)
=AVERAGE(B2:B10)
=B2:B99+C2:C99
=CONVERT(B2, 0.5, "$")
=DATE(2026,7,1)
=TODAY()
=DAYS(B3,B2)
```

`=722*2+621*2` evaluates to `2,686.00` with default display settings. Ranges used with operators are summed; ranges passed to functions are flattened into arguments. Whole-column ranges include the header and can include the formula itself, causing a circular reference.

Numbers in referenced cells accept comma grouping and a decimal point. Supported currency prefixes are `$`, `US$`, `HK$`, `CA$`, `C$`, `AU$`, `A$`, `NZ$`, `SG$`, `NT$`, `MX$`, `¥`, `￥`, `JPY`, `CNY`, and `RMB`. Different prefix strings can produce `#CURRENCY!`; `CONVERT` uses a supplied rate and does not retrieve exchange rates. Dates accept `YYYY-MM-DD`, `YYYY/MM/DD`, or `DD/MM/YYYY` and display as `YYYY-MM-DD`.

Table formatting uppercases formula references and function names. Sorting and structural edits do not rewrite references. CSV export downloads raw cell text, including formulas, rather than calculated values.

Local editing and calculation use no service or demo backend. Help opens the repository README on GitHub and requires network access to load that page. There is no standalone browser or command-line application.

## Project structure

| Path | Responsibility |
| --- | --- |
| `src/main.ts`, `src/types.ts`, `src/settings.ts` | Plugin lifecycle, shared models, settings and persistence |
| `src/commands.ts`, `src/ui/` | Command Palette, icons and sidebar toolbar |
| `src/table/` | Markdown parsing, structural operations, editor integration and CSV |
| `src/formula/` | Formula parsing, references, typed values, evaluation and functions |
| `src/render/` | CodeMirror Live Preview and Reading Mode output |
| `styles.css` | Toolbar, result, error, selection and header presentation |
| `.github/workflows/release.yml` | Tag-triggered build, attestations and GitHub release configuration |
| `docs/help.md` | Usage reference |

## Development

```bash
npm run build
npm run dev
npm run lint
npx --no-install tsc --noEmit --skipLibCheck
```

`build` typechecks and bundles once. `dev` starts the esbuild watcher with inline source maps; it does not run TypeScript checking or install/reload the plugin in Obsidian. `lint` checks all source TypeScript. The final command performs typechecking without writing output. Run these after installing dependencies. There are no test, formatter, or fixture-validation scripts.

`main.js` and source maps are ignored by Git. For an existing installation, copy the rebuilt runtime file into the vault and reload the plugin. Release CI is triggered by version tags and writes to GitHub; it is separate from local development.

## Known limitations

- This is a small formula language, without unary signs, exponentiation, comparisons, absolute or cross-table references, Excel file import/export, or Advanced Tables `TBLFM` support.
- Reading Mode requires source section information and matching table dimensions. If either is unavailable, the renderer skips that table. Embedded or unusual Markdown structures need host validation.
- `SUM` and `AVERAGE` filter out nonnumeric arguments, including error values. Their behavior differs from spreadsheet applications that propagate such errors.
- No automatic reference adjustment, incremental dependency recalculation, large-table limits, or midnight refresh timer is implemented.
- Display separators do not change the numeric input grammar. Settings changes may require a subsequent editor update or rerender to become visible.
- Mobile CSV download, DOM integration, multi-window behavior, and minimum-host compatibility are unverified. Responsive toolbar CSS alone does not establish platform support.

## License

Project source is licensed under the [MIT License](LICENSE), copyright 2026 Sunny Yu. Third-party dependencies retain their own licenses; the project license does not relicense those packages or the Obsidian host.
