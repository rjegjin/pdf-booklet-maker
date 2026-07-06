import test from "node:test";
import assert from "node:assert/strict";

import { parseGrid, resolveLayout, parsePrintOptions, parseMarkOptions, computeCells } from "../src/layout.js";
import { getImpositionOrder, parseSignatureSize } from "../src/booklet.js";
import { patternToRegExp, outputPathFor } from "../src/batch.js";
import { startServer } from "../src/server.js";
import { generateCoverPdf, wrapTitle } from "../src/cover.js";
import { PDFDocument } from "pdf-lib";

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

test("patternToRegExp matches glob-style patterns", () => {
  assert.ok(patternToRegExp("*.pdf").test("worksheet.pdf"));
  assert.ok(patternToRegExp("worksheet-*.pdf").test("worksheet-a.pdf"));
  assert.ok(!patternToRegExp("worksheet-*.pdf").test("notes.pdf"));
  assert.ok(patternToRegExp("week-?.pdf").test("week-1.pdf"));
  assert.ok(!patternToRegExp("week-?.pdf").test("week-10.pdf"));
});

test("outputPathFor appends suffix before extension", () => {
  assert.equal(
    outputPathFor({ inputFile: "/in/doc.pdf", outputDir: "/out", suffix: "-8up" }),
    "/out/doc-8up.pdf"
  );
});

test("parseSignatureSize validates multiples of 4", () => {
  assert.equal(parseSignatureSize(undefined, 6), 8);
  assert.equal(parseSignatureSize("8", 20), 8);
  assert.throws(() => parseSignatureSize("6", 20));
  assert.throws(() => parseSignatureSize("2", 20));
});

test("generateCoverPdf produces a small single-page PDF (CJK as outlines)", async () => {
  const bytes = await generateCoverPdf({
    title: "화학 학습자료",
    subtitle: "3학년 1학기",
    author: "테스트",
    date: "2026-07-06"
  });

  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 1);
  // outlines instead of an embedded CJK font keep it far under 100 KB
  assert.ok(bytes.length < 100 * 1024, `cover too large: ${bytes.length} bytes`);

  await assert.rejects(() => generateCoverPdf({}), /title is required/);
  await assert.rejects(() => generateCoverPdf({ title: "x", style: "fancy" }), /Invalid cover style/);
});

test("wrapTitle breaks long titles at word boundaries", () => {
  const measure = (text, size) => text.length * size; // 1 char = size pt
  assert.deepEqual(wrapTitle(measure, "short", 10, 500), ["short"]);
  assert.deepEqual(
    wrapTitle(measure, "one two three four", 10, 90),
    ["one two", "three", "four"]
  );
  assert.deepEqual(wrapTitle(measure, "a\nb", 10, 500), ["a", "b"]);
});

test("generateCoverPdf header style renders", async () => {
  const bytes = await generateCoverPdf({
    title: "내 삶에 새로운 시작을 주님께서 해주시도록 하고 있습니까?",
    subtitle: "(4월 메세지)",
    label: "Message",
    style: "header"
  });
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 1);
});

test("web server serves UI and rejects bad convert requests", async () => {
  const { server, port } = await startServer({ port: 0 });

  try {
    const page = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /PDF Booklet Maker/);

    const emptyBody = await fetch(`http://127.0.0.1:${port}/api/convert?grid=2x2`, { method: "POST" });
    assert.equal(emptyBody.status, 400);

    const notFound = await fetch(`http://127.0.0.1:${port}/nope`);
    assert.equal(notFound.status, 404);
  } finally {
    server.close();
  }
});
