# pdf-booklet-maker handoff (Historical — v0.1.0 era)

**NOTE (2026-07-06):** This document is preserved as historical reference from early project development (v0.1.0 planning). The project is now at **v0.9.0** with all planned phases (1–7) implemented and published to npm. See `CONTEXT.md` and `RESOLVED.md` for current status, and `README.md` for current features.

---

This document originally summarized the state of the `rjegjin/pdf-booklet-maker` project from the v0.1.0 phase.

---

## 1. Project identity

Repository:

```text
rjegjin/pdf-booklet-maker
```

Target npm package name:

```text
@mhj6022/pdf-booklet-maker
```

Fixed CLI command:

```text
pdf-booklet-maker
```

Primary goal:

```text
A scriptable PDF layout/imposition CLI for teachers, small publishers, churches, study groups, and anyone preparing printable handouts.
```

Immediate v0.1.0 goal:

```bash
pdf-booklet-maker <input.pdf> <output.pdf> --mode half
pdf-booklet-maker <input.pdf> <output.pdf> --mode eighth
```

---

## 2. Strategic direction decided

The project originally had a Python-oriented saddle-stitch booklet direction. The current agreed direction is:

1. Do not keep the main implementation as Python.
2. Rebuild the npm/npx-facing tool in Node.js.
3. Use `pdf-lib` for PDF manipulation.
4. Use `commander` for CLI parsing.
5. Publish under `@mhj6022/pdf-booklet-maker`.
6. Keep the command name `pdf-booklet-maker`.
7. Start with only two modes:
   - `--mode half`
   - `--mode eighth`
8. Later add:
   - `--grid 2x4`
   - `--margin`
   - `--gap`
   - `--rotate`
   - `--cut-line`
   - true booklet imposition

Reason for Node.js direction:

```text
npx usability. The user should not need Python, pip, virtualenv, or local dependency setup beyond Node.js/npm.
```

---

## 3. Current repository structure

Current intended structure:

```text
pdf-booklet-maker/
├── README.md
├── HANDOFF.md
├── LICENSE
├── .gitignore
├── package.json
└── src/
    ├── cli.js
    └── layout.js
```

Known created/updated files:

- `package.json`
- `README.md`
- `src/layout.js`
- `src/cli.js`
- `LICENSE`
- `.gitignore`
- this `HANDOFF.md`

---

## 4. Important commits so far

Known commit SHAs from the previous agent session:

```text
a924c6e7218a3b4c1858ca595b85040bce53d2e1
  Initialize Node CLI package / create package.json

0203bef4d67f643bcfe0fb7c3a8a7ddcebb1881a
  Expand README with Node CLI vision and roadmap

b032aa843cead9a8723a74b922771713c0f08e6b
  Implement A4 duplicate layout engine / create src/layout.js

17487cab0f8415e8b499503fa8f49d2dc6b666df
  Implement CLI entry point / create src/cli.js

8f167ebe84f758ed17e11bfb5ac8b668a5f57a08
  Add license file

37a0a250ac9282ed7c0f7c6a21fb593c21e996f2
  Add Node.js ignores to .gitignore
```

There may be later commits after this document is created.

---

## 5. Current package.json intent

The package is intended to look approximately like this:

```json
{
  "name": "@mhj6022/pdf-booklet-maker",
  "version": "0.1.0",
  "description": "CLI tool for duplicating PDF pages onto A4 sheets.",
  "type": "module",
  "bin": {
    "pdf-booklet-maker": "./src/cli.js"
  },
  "files": [
    "src",
    "README.md",
    "LICENSE"
  ],
  "scripts": {
    "start": "node src/cli.js",
    "test": "node --check src/cli.js && node --check src/layout.js"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "pdf-lib": "^1.17.1"
  },
  "engines": {
    "node": ">=18"
  }
}
```

Next agent should verify the exact file content in the repository before editing.

---

## 6. Current implementation summary

### `src/layout.js`

Implemented responsibilities:

- defines A4 page size in PDF points
- defines supported modes:
  - `half`: 1 column × 2 rows
  - `eighth`: 2 columns × 4 rows
- loads input PDF
- creates output PDF
- for each source page:
  - embeds the source page
  - creates a blank A4 page
  - draws the same embedded source page into every cell of the layout
  - preserves aspect ratio with contain-fit behavior
  - centers the source page inside each cell
- writes output PDF
- returns a summary object

Conceptual layout for `half`:

```text
┌──────────────┐
│     copy     │
├──────────────┤
│     copy     │
└──────────────┘
```

Conceptual layout for `eighth`:

```text
┌───────┬───────┐
│ copy  │ copy  │
├───────┼───────┤
│ copy  │ copy  │
├───────┼───────┤
│ copy  │ copy  │
├───────┼───────┤
│ copy  │ copy  │
└───────┴───────┘
```

### `src/cli.js`

Implemented responsibilities:

- uses `commander`
- command name: `pdf-booklet-maker`
- required arguments:
  - `<input>`
  - `<output>`
- required option:
  - `--mode <mode>`
- calls `duplicatePdf({ input, output, mode })`
- logs success and a JSON summary
- catches errors and exits with non-zero status

---

## 7. Current limitations

The code exists, but the following have not yet been fully verified in a real local runtime:

- `npm install`
- `npm test`
- actual PDF generation using `node src/cli.js`
- actual npx execution after npm publication
- compatibility with Windows paths
- behavior with rotated PDF pages
- behavior with non-A4 source pages
- behavior with encrypted PDFs
- behavior with very large PDFs
- output visual correctness

No `package-lock.json` has been intentionally generated yet through the agent session.

---

## 8. Immediate next steps

The next agent should prioritize actual validation and CI rather than adding many new features.

### Step 1: Pull and inspect

```bash
git clone https://github.com/rjegjin/pdf-booklet-maker.git
cd pdf-booklet-maker
```

Inspect files:

```bash
cat package.json
cat src/cli.js
cat src/layout.js
```

### Step 2: Install dependencies

```bash
npm install
```

This should create:

```text
package-lock.json
```

Commit `package-lock.json` if the project policy is to lock application/CLI dependencies. For npm CLI tools, committing the lockfile is usually reasonable for reproducible development, though published packages use `package.json` dependency ranges.

### Step 3: Syntax check

```bash
npm test
```

Expected script:

```bash
node --check src/cli.js && node --check src/layout.js
```

### Step 4: Create a sample PDF for testing

A small sample PDF is needed. Possible methods:

- use a hand-made simple PDF
- generate one with `pdf-lib`
- place it under `examples/sample.pdf`

Suggested future example structure:

```text
examples/
├── sample.pdf
├── sample-half.pdf
└── sample-eighth.pdf
```

Do not commit large generated PDFs unless necessary.

### Step 5: Run real commands

```bash
node src/cli.js examples/sample.pdf examples/sample-half.pdf --mode half
node src/cli.js examples/sample.pdf examples/sample-eighth.pdf --mode eighth
```

Verify:

- output files are created
- output files open in a PDF viewer
- output page size is A4
- `half` has 2 duplicated copies
- `eighth` has 8 duplicated copies in 2 × 4 arrangement

### Step 6: Add GitHub Actions CI

Create:

```text
.github/workflows/ci.yml
```

Suggested initial workflow:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm install
      - run: npm test
```

If `package-lock.json` is committed, prefer:

```bash
npm ci
```

instead of:

```bash
npm install
```

---

## 9. Recommended next implementation after v0.1 validation

Do not jump immediately to booklet imposition. The next useful feature is generalized grid layout.

### v0.2.0: `--grid CxR`

Target API:

```bash
pdf-booklet-maker input.pdf output.pdf --grid 2x4
pdf-booklet-maker input.pdf output.pdf --grid 1x2
pdf-booklet-maker input.pdf output.pdf --grid 3x3
```

Suggested design:

- `--mode half` becomes a shortcut for `--grid 1x2`
- `--mode eighth` becomes a shortcut for `--grid 2x4`
- CLI should reject using both `--mode` and `--grid` simultaneously unless a clear precedence rule is defined
- internally use one function:

```js
duplicatePdf({ input, output, columns, rows })
```

instead of hard-coding modes too deeply.

---

## 10. Planned future roadmap

### v0.1.0

- Node.js CLI package
- command: `pdf-booklet-maker`
- package: `@mhj6022/pdf-booklet-maker`
- `--mode half`
- `--mode eighth`
- basic README
- local syntax test
- actual PDF smoke test

### v0.2.0

- `--grid CxR`
- stronger validation
- clearer error messages

### v0.3.0

- `--margin <points>`
- `--gap <points>`
- `--fit contain|cover|stretch`
- possibly `--rotate auto|none|90|180|270`

### v0.4.0

- `--cut-line`
- `--crop-mark`
- basic printable card support

### v0.5.0

- booklet imposition prototype
- saddle-stitch layout

### v1.0.0

- stable CLI
- duplicate layouts
- grid layouts
- margin/gap controls
- cut/crop marks
- booklet mode
- documented examples
- reliable npm release

---

## 11. Key design principles

1. CLI first.
2. Reusable layout engine second.
3. GUI/web only later.
4. A4 predictable print output by default.
5. Teacher-friendly workflows matter.
6. Keep dependencies minimal.
7. Avoid adding many options before PDF output is visually verified.
8. Make common tasks one-command simple.

---

## 12. Known caution points

### A4 point size

Current A4 constants:

```js
export const A4_WIDTH = 595.2756;
export const A4_HEIGHT = 841.8898;
```

These are standard A4 dimensions in PDF points.

### Coordinate system

PDF coordinate origin is bottom-left. The current row placement formula intentionally calculates from the top by using:

```js
const cellY = A4_HEIGHT - (row + 1) * cellHeight;
```

Do not accidentally invert the row order unless intentionally changing layout semantics.

### Aspect ratio

Current behavior is `contain` fit:

```js
scale = Math.min(cellWidth / sourceWidth, cellHeight / sourceHeight)
```

This preserves aspect ratio and centers inside each cell. This is the correct default for handouts.

### Output page per input page

Current behavior:

```text
1 input page -> 1 output A4 page containing duplicated copies of that same input page
```

It does not combine different input pages onto one output page yet.

This is intentional for v0.1.0.

---

## 13. Suggested issue list for next agent

Create GitHub issues if useful:

1. `v0.1.0 validation: run npm install, npm test, and smoke PDF generation`
2. `Add GitHub Actions CI`
3. `Add examples/sample.pdf and example scripts`
4. `Implement --grid CxR`
5. `Implement --margin and --gap`
6. `Implement --cut-line`
7. `Design booklet imposition algorithm`
8. `Prepare npm publish checklist`

---

## 14. npm publish checklist

Before publishing:

```bash
npm login
npm whoami
npm install
npm test
npm pack --dry-run
```

Verify package contents:

```text
package.json
README.md
LICENSE
src/cli.js
src/layout.js
```

Publish public scoped package:

```bash
npm publish --access public
```

After publish:

```bash
npx @mhj6022/pdf-booklet-maker input.pdf output.pdf --mode half
npx @mhj6022/pdf-booklet-maker input.pdf output.pdf --mode eighth
```

---

## 15. High-level summary for the next agent

You are continuing a Node.js/npm rewrite of a PDF booklet/layout project.

Do not start by redesigning everything.

First verify the current implementation.

Then add CI.

Then generalize `half` and `eighth` into `--grid`.

The user values a practical tool for real document workflows, especially teaching and printable handouts. Keep the CLI simple, predictable, and automation-friendly.
