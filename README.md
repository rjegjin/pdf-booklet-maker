# pdf-booklet-maker

`pdf-booklet-maker` is a small command-line PDF layout tool for duplicating PDF pages onto A4 print layouts.

It is designed for teachers, churches, study groups, small publishers, and anyone who needs repeatable printable handout layouts.

The project originally started as a Python-based saddle-stitch booklet helper. The active direction is now a native Node.js CLI package that can be used through `npm` and `npx`.

---

## Quick Start

Run without installation:

```bash
npx @mhj6022/pdf-booklet-maker input.pdf output-half.pdf --mode half
npx @mhj6022/pdf-booklet-maker input.pdf output-eighth.pdf --mode eighth
```

Install globally:

```bash
npm install -g @mhj6022/pdf-booklet-maker
pdf-booklet-maker input.pdf output-half.pdf --mode half
```

Show help:

```bash
npx @mhj6022/pdf-booklet-maker --help
```

---

## Current published package

```text
Package: @mhj6022/pdf-booklet-maker
Command: pdf-booklet-maker
Latest published version: 0.1.0
Registry: https://registry.npmjs.org/
```

The package is public on npm and currently provides two fixed duplicate layouts:

- `--mode half`
- `--mode eighth`

---

## Current status

Phases 1–5 are implemented (v0.5.0):

- `--mode half` / `--mode eighth` duplicate layouts
- `--grid CxR` arbitrary grid layouts
- `--margin`, `--gap`, `--rotate auto|none|90|180|270`, `--fit contain|cover|stretch`
- `--cut-line` (with `--cut-line-style`, `--cut-line-width`) and `--crop-mark` (with `--crop-mark-length`, `--crop-mark-offset`)
- `--booklet` / `--saddle-stitch` true saddle-stitch imposition with `--signature-size` and `--duplex short-edge|long-edge`

```bash
# 8 copies of each page with cut guides
npx @mhj6022/pdf-booklet-maker input.pdf output.pdf --grid 2x4 --gap 8 --cut-line

# saddle-stitch booklet, 8-page signatures, long-edge duplex printer
npx @mhj6022/pdf-booklet-maker input.pdf output.pdf --booklet --signature-size 8 --duplex long-edge
```

Built with Node.js, `pdf-lib`, and `commander`. No Python, pip, or virtual environments required; the old Python saddle-stitch workflow remains as legacy code only.

---

## Current Features

### `--mode half`

Duplicate each input PDF page twice on one A4 page.

```bash
pdf-booklet-maker input.pdf output-half.pdf --mode half
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
pdf-booklet-maker input.pdf output-eighth.pdf --mode eighth
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

## npx Troubleshooting

If `npx` says:

```text
sh: 1: pdf-booklet-maker: not found
```

clear the local npx cache and retry:

```bash
rm -rf ~/.npm/_npx
npx --yes @mhj6022/pdf-booklet-maker@0.1.0 --help
```

Alternatively, use `npm exec`:

```bash
npm exec --yes --package=@mhj6022/pdf-booklet-maker -- pdf-booklet-maker --help
```

You can also verify the package by installing it in a temporary directory:

```bash
tmpdir=$(mktemp -d)
cd "$tmpdir"
npm init -y >/dev/null
npm install @mhj6022/pdf-booklet-maker@0.1.0
node_modules/.bin/pdf-booklet-maker --help
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

## v0.2.0 target: General grid layout

The next implementation target is:

```bash
pdf-booklet-maker input.pdf output.pdf --grid 2x4
pdf-booklet-maker input.pdf output.pdf --grid 1x2
pdf-booklet-maker input.pdf output.pdf --grid 3x3
```

Planned behavior:

```text
--grid CxR
```

Where:

- `C` = columns
- `R` = rows

Examples:

- `--grid 1x2`: one column, two rows
- `--grid 2x4`: two columns, four rows
- `--grid 4x4`: four columns, four rows

Shortcut relationship:

```text
--mode half    = --grid 1x2
--mode eighth  = --grid 2x4
```

Validation rules:

- use either `--mode` or `--grid`, not both
- `--grid` must match `CxR`, for example `2x4`
- columns and rows must be positive integers
- very large grids should be rejected to prevent unusable output

---

## Future roadmap

### v0.3.0: Print-control options

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

### v0.4.0: Cut lines and crop marks

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

---

### v0.5.0+: Booklet imposition

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

## Batch automation future

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

## GUI and web future

The CLI is the foundation. Later, the same core layout engine can power:

- Electron desktop app
- simple local web UI
- drag-and-drop browser version
- school document automation pipeline
- server-side batch service

The core principle is:

> CLI first, reusable layout engine second, GUI later.

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
   `half` and `eighth` are shortcuts over a general grid engine.

---

## Roadmap summary

```text
v0.1.0
- Node.js CLI package
- package name: @mhj6022/pdf-booklet-maker
- command: pdf-booklet-maker
- --mode half
- --mode eighth
- npm publish complete

v0.2.0
- --grid CxR
- --mode half as shortcut for --grid 1x2
- --mode eighth as shortcut for --grid 2x4
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
