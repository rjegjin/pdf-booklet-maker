import test from "node:test";
import assert from "node:assert/strict";

import { parseGrid, resolveLayout, parsePrintOptions, parseMarkOptions, computeCells } from "../src/layout.js";
import { getImpositionOrder, parseSignatureSize } from "../src/booklet.js";

test("parseGrid parses CxR", () => {
  assert.deepEqual(parseGrid("2x4"), { columns: 2, rows: 4 });
  assert.deepEqual(parseGrid("1x1"), { columns: 1, rows: 1 });
  assert.throws(() => parseGrid("0x2"));
  assert.throws(() => parseGrid("2x"));
  assert.throws(() => parseGrid("13x1"));
});

test("resolveLayout requires exactly one of mode/grid", () => {
  assert.deepEqual(resolveLayout({ mode: "half" }), { columns: 1, rows: 2, description: "Duplicate each page twice on one A4 page." });
  assert.deepEqual(resolveLayout({ grid: "3x3" }), { columns: 3, rows: 3 });
  assert.throws(() => resolveLayout({}));
  assert.throws(() => resolveLayout({ mode: "half", grid: "2x2" }));
});

test("parsePrintOptions validates values", () => {
  assert.deepEqual(parsePrintOptions({}), { margin: 0, gap: 0, rotate: "none", fit: "contain" });
  assert.throws(() => parsePrintOptions({ margin: -1 }));
  assert.throws(() => parsePrintOptions({ rotate: "45" }));
  assert.throws(() => parsePrintOptions({ fit: "fill" }));
});

test("parseMarkOptions validates values", () => {
  assert.equal(parseMarkOptions({}).cutLine, false);
  assert.throws(() => parseMarkOptions({ cutLineStyle: "dotted" }));
  assert.throws(() => parseMarkOptions({ cropMarkLength: 0 }));
});

test("computeCells rejects impossible margin/gap", () => {
  assert.throws(() => computeCells({ columns: 12, rows: 12, margin: 0, gap: 100 }));
  const { cells } = computeCells({ columns: 2, rows: 2, margin: 10, gap: 10 });
  assert.equal(cells.length, 4);
});

test("getImpositionOrder matches saddle-stitch order", () => {
  assert.deepEqual(getImpositionOrder(4).order, [4, 1, 2, 3]);
  assert.deepEqual(getImpositionOrder(8).order, [8, 1, 2, 7, 6, 3, 4, 5]);
  // 6 pages pad to 8
  assert.equal(getImpositionOrder(6).workingPages, 8);
});

test("parseSignatureSize validates multiples of 4", () => {
  assert.equal(parseSignatureSize(undefined, 6), 8);
  assert.equal(parseSignatureSize("8", 20), 8);
  assert.throws(() => parseSignatureSize("6", 20));
  assert.throws(() => parseSignatureSize("2", 20));
});
