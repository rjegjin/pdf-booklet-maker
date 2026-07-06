# Development Log — pdf-booklet-maker

## Recent History (2026-07)

Project transitioned from Python-based (Streamlit) to Node.js CLI + Web UI in early 2026.
Now actively developed as a published npm package.

### [2026-07-06] v0.9.0 — Header cover style with title wrapping
- Added `--cover-style header` option: top-aligned title with small heading label
- Implemented `wrapTitle()` for word-boundary wrapping at custom page widths
- Web UI: Added style dropdown and label input fields
- Unit tests: Added `wrapTitle()` tests and header style rendering test
- **Commit:** 82223b5

### [2026-07-06] v0.8.0 — Booklet cover pages and PDF merging
- Added `--cover <file.pdf>` to prepend an existing PDF cover
- Added `--cover-title`, `--cover-subtitle`, `--cover-author`, `--cover-date` for generating typographic covers
- CJK font support: Renders Korean/Chinese text as vector outlines via fontkit glyph paths (system font auto-detected)
- Web UI: Cover section with generate/upload mode toggle
- `/api/convert` endpoint: Now accepts JSON bodies with base64 PDF and cover data
- **Commits:** b3c56a1, ae4e164

### [2026-07-06] — Browser auto-open on --serve
- Added `--serve` auto-opens http://127.0.0.1:8383 in default browser
- Disable with `--no-open` flag
- **Commit:** f126a52

### [2026-07] — Phase 7 completion: Web UI (v0.7.0)
- Local drag-and-drop web UI at `--serve`
- No external dependencies (built on node:http)
- Auto-opens in browser on launch

---

## Implementation Timeline

| Version | Features | Commit(s) |
|---------|----------|-----------|
| 0.9.0   | Header cover style, title wrapping | 82223b5 |
| 0.8.0   | PDF cover merging, generated covers, CJK outlines | b3c56a1 |
| 0.7.0   | Local web UI (`--serve`), browser auto-open | 075dbdd, f126a52 |
| 0.6.0   | Batch conversion (`--input-dir`, `--pattern`, `--suffix`) | 61ccf81 |
| 0.5.0   | Saddle-stitch booklet imposition (`--booklet`) | 3eb16c6 |
| 0.4.0   | Cut lines and crop marks | a6823d1 |
| 0.3.0   | Print control (`--margin`, `--gap`, `--rotate`, `--fit`) | ca66174 |
| 0.2.0   | Arbitrary grid layout (`--grid CxR`) | 59ec2fb |
| 0.1.0   | Basic duplicate layouts (`--mode half`, `--mode eighth`) | npm published |

---

## Current Status
- **Active:** v0.9.0 published to npm registry
- **Stability:** Phases 1–7 (basic duplication through web UI) fully implemented and tested
- **Quality:** Unit tests for core layout, grid parsing, booklet imposition, cover generation
- **Next direction:** Feature requests, performance optimization, or extended bind support

---

## Build & Test

```bash
npm install
npm test
```

Run CLI locally:
```bash
node src/cli.js <input> <output> [options]
```

Run web UI:
```bash
node src/cli.js --serve
```

