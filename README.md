# pdf-booklet-maker

`pdf-booklet-maker` is a command-line PDF layout tool for teachers, small publishers, churches, study groups, and anyone who repeatedly prepares printable handouts.

The project originally started as a Python-based saddle-stitch booklet helper. From this point forward, the main direction is a native Node.js CLI package that can be used through `npm` and `npx`.

The immediate goal is simple:

> Take one PDF page and duplicate it onto an A4 sheet in useful print layouts.

The long-term goal is larger:

> Build a practical, scriptable, open-source PDF imposition tool that can handle classroom handouts, mini cards, booklet printing, crop marks, printable grids, and eventually GUI/web workflows.

---

## Package name

This project is intended to be published as:

```bash
@rjegjin/pdf-booklet-maker
```

The CLI command is fixed as:

```bash
pdf-booklet-maker
```

Example final usage:

```bash
npx @rjegjin/pdf-booklet-maker input.pdf output.pdf --mode half
npx @rjegjin/pdf-booklet-maker input.pdf output.pdf --mode eighth
```

---

## Why this project exists

Many teachers and document creators repeatedly need small but annoying PDF transformations:

- duplicate the same worksheet twice on one A4 page
- make 8 small copies of the same notice or card
- prepare mini test papers
- print vocabulary cards or Bible verse cards
- make cuttable classroom materials
- create booklet-style layouts
- add cut lines and crop marks
- automate the same layout from scripts, bots, or batch jobs

Large PDF editors can do some of this, but they are often slow, GUI-heavy, paid, or awkward to automate. This project aims to make these workflows available as simple CLI commands.

---

## Current status

Early implementation stage.

The project is being rebuilt as a native Node.js CLI using:

- Node.js
- `pdf-lib`
- `commander`

The old Python saddle-stitch workflow may remain as historical or legacy code, but the npm/npx-facing tool should not require users to install Python, pip, or virtual environments.

---

## Phase 1: Minimum useful duplicate layouts

### `--mode half`

Duplicate each input PDF page twice on one A4 page.

```bash
npx @rjegjin/pdf-booklet-maker input.pdf output.pdf --mode half
```

Layout:

```text
┌──────────────┐
│     copy     │
├──────────────┤
│     copy     │
└──────────────┘
```

Use cases:

- half-page handouts
- short quizzes
- compact notices
- classroom activity sheets

---

### `--mode eighth`

Duplicate each input PDF page eight times on one A4 page using a 2 × 4 layout.

```bash
npx @rjegjin/pdf-booklet-maker input.pdf output.pdf --mode eighth
```

Layout:

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

Use cases:

- mini cards
- memorization cards
- Bible verse cards
- vocabulary cards
- small tickets
- classroom feedback slips

---

## Phase 2: General grid layout

Planned option:

```bash
pdf-booklet-maker input.pdf output.pdf --grid 2x4
pdf-booklet-maker input.pdf output.pdf --grid 1x2
pdf-booklet-maker input.pdf output.pdf --grid 3x3
```

This generalizes `half` and `eighth` into arbitrary columns and rows.

Planned behavior:

```text
--grid CxR
```

Examples:

- `--grid 1x2`: one column, two rows
- `--grid 2x4`: two columns, four rows
- `--grid 4x4`: four columns, four rows

---

## Phase 3: Print-control options

Planned options:

```bash
--margin <points>
--gap <points>
--rotate auto|none|90|180|270
--fit contain|cover|stretch
```

Purpose:

- control outer whitespace
- control space between duplicated items
- rotate pages to fit better
- preserve aspect ratio or fill cells

---

## Phase 4: Cut lines and crop marks

Planned options:

```bash
--cut-line
--crop-mark
--registration-mark
```

Use cases:

- printable classroom cards
- cuttable memorization cards
- church handouts
- small group materials
- labels and slips

Possible future options:

```bash
--cut-line-style dashed
--cut-line-width 0.5
--crop-mark-length 10
--crop-mark-offset 3
```

---

## Phase 5: Booklet imposition

The project name is `pdf-booklet-maker`, so the long-term target includes true booklet imposition.

Example conceptual transformation:

```text
Input reading order:
1, 2, 3, 4

Booklet print order:
4 | 1
2 | 3
```

Planned modes:

```bash
--booklet
--saddle-stitch
--signature-size 4
--signature-size 8
--duplex short-edge|long-edge
```

Use cases:

- small booklets
- class reading packets
- church bulletins
- devotional booklets
- zines
- folded handouts

---

## Phase 6: Batch automation

Planned features:

```bash
--input-dir ./pdfs
--output-dir ./out
--pattern "*.pdf"
--suffix "-8up"
```

Use cases:

- batch convert many worksheets
- generate multiple classroom versions
- connect with Telegram bots or school automation scripts
- prepare weekly handouts automatically

---

## Phase 7: GUI and web future

The CLI is the foundation. Later, the same core layout engine can power:

- Electron desktop app
- simple local web UI
- drag-and-drop browser version
- school document automation pipeline
- server-side batch service

The core principle is:

> CLI first, reusable layout engine second, GUI later.

---

## Installation

After npm publication:

```bash
npm install -g @rjegjin/pdf-booklet-maker
```

or without installation:

```bash
npx @rjegjin/pdf-booklet-maker input.pdf output.pdf --mode half
```

---

## Local development

```bash
git clone https://github.com/rjegjin/pdf-booklet-maker.git
cd pdf-booklet-maker
npm install
npm test
```

Run locally:

```bash
node src/cli.js input.pdf output.pdf --mode half
node src/cli.js input.pdf output.pdf --mode eighth
```

Or link as a local command:

```bash
npm link
pdf-booklet-maker input.pdf output.pdf --mode half
```

---

## First implementation target

The first working version should support only this API:

```bash
pdf-booklet-maker <input> <output> --mode half
pdf-booklet-maker <input> <output> --mode eighth
```

No extra options at first. The project should become reliable before becoming flexible.

---

## Design principles

1. **Simple command first**  
   Common tasks should be one command.

2. **Predictable print output**  
   A4 size, stable scaling, centered placement.

3. **No unnecessary dependencies**  
   Keep the package small and portable.

4. **Automation-friendly**  
   Every feature should be usable from scripts.

5. **Teacher-friendly**  
   The tool should solve real classroom document problems, not only abstract PDF manipulation problems.

6. **Expandable architecture**  
   `half` and `eighth` are only shortcuts over a future general grid engine.

---

## Roadmap summary

```text
v0.1.0
- Node.js CLI package
- package name: @rjegjin/pdf-booklet-maker
- command: pdf-booklet-maker
- --mode half
- --mode eighth

v0.2.0
- --grid CxR
- basic validation
- better error messages

v0.3.0
- --margin
- --gap
- --rotate
- --fit

v0.4.0
- --cut-line
- --crop-mark

v0.5.0
- booklet imposition prototype

v1.0.0
- stable CLI
- duplicate layouts
- grid layouts
- print marks
- booklet mode
- documented examples
```

---

## Legacy note

Earlier versions of this repository used a Python script such as:

```bash
python booklet_maker.py
```

That workflow may remain useful for old saddle-stitch experiments, but the active npm package direction is Node.js.

---

## License

MIT
