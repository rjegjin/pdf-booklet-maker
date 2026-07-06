import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, degrees } from "pdf-lib";
import { A4_WIDTH, A4_HEIGHT } from "./layout.js";

// Landscape A4 sheet, two pages side by side.
export const SHEET_WIDTH = A4_HEIGHT;
export const SHEET_HEIGHT = A4_WIDTH;

export const DUPLEX_MODES = Object.freeze(["short-edge", "long-edge"]);

/**
 * Saddle-stitch page order for one signature, padded to a multiple of 4.
 * Returns 1-based positions; positions beyond the real page count are blanks.
 *
 * Example for 4 pages: [4, 1, 2, 3] → sheet front (4 | 1), sheet back (2 | 3).
 */
export function getImpositionOrder(totalPages) {
  const workingPages = Math.ceil(totalPages / 4) * 4;
  const order = [];

  let low = 1;
  let high = workingPages;

  while (low < high) {
    order.push(high, low);
    low += 1;
    high -= 1;
    order.push(low, high);
    low += 1;
    high -= 1;
  }

  return { order, workingPages };
}

export function parseSignatureSize(signatureSize, totalPages) {
  if (signatureSize === undefined || signatureSize === null || signatureSize === "auto") {
    return Math.ceil(totalPages / 4) * 4;
  }

  const size = Number(signatureSize);

  if (!Number.isInteger(size) || size < 4 || size % 4 !== 0) {
    throw new Error(`Signature size must be a multiple of 4 (>= 4): ${signatureSize}`);
  }

  return size;
}

function assertPdfPath(filePath, label) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error(`${label} path is required.`);
  }

  if (path.extname(filePath).toLowerCase() !== ".pdf") {
    throw new Error(`${label} must be a PDF file: ${filePath}`);
  }
}

function drawHalf({ sheetPage, embeddedPage, sourceWidth, sourceHeight, half, rotate180 }) {
  const cellWidth = SHEET_WIDTH / 2;
  const cellHeight = SHEET_HEIGHT;
  const cellX = half === 0 ? 0 : cellWidth;

  const scale = Math.min(cellWidth / sourceWidth, cellHeight / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;

  const boxX = cellX + (cellWidth - width) / 2;
  const boxY = (cellHeight - height) / 2;

  if (rotate180) {
    sheetPage.drawPage(embeddedPage, {
      x: boxX + width,
      y: boxY + height,
      width,
      height,
      rotate: degrees(180)
    });
  } else {
    sheetPage.drawPage(embeddedPage, { x: boxX, y: boxY, width, height });
  }
}

export async function imposeBooklet({ input, output, signatureSize, duplex = "short-edge" }) {
  assertPdfPath(input, "Input");
  assertPdfPath(output, "Output");

  if (!DUPLEX_MODES.includes(String(duplex))) {
    throw new Error(`Invalid duplex mode: ${duplex}. Expected ${DUPLEX_MODES.join(", ")}.`);
  }

  const inputBytes = await fs.readFile(input);
  const sourcePdf = await PDFDocument.load(inputBytes);
  const totalPages = sourcePdf.getPageCount();

  if (totalPages === 0) {
    throw new Error("Input PDF has no pages.");
  }

  const pagesPerSignature = parseSignatureSize(signatureSize, totalPages);
  const signatureCount = Math.ceil(totalPages / pagesPerSignature);

  const outputPdf = await PDFDocument.create();
  const sourcePages = sourcePdf.getPages();

  // Embed all pages in one call so resources shared between pages
  // (fonts, images) are copied once instead of once per page.
  const embeddedPages = await outputPdf.embedPages(sourcePages);

  let sheets = 0;

  for (let sig = 0; sig < signatureCount; sig += 1) {
    const start = sig * pagesPerSignature;
    const pagesInSignature = Math.min(pagesPerSignature, totalPages - start);
    const { order } = getImpositionOrder(pagesInSignature);

    for (let i = 0; i < order.length; i += 2) {
      const sheetPage = outputPdf.addPage([SHEET_WIDTH, SHEET_HEIGHT]);
      const isBackSide = (i / 2) % 2 === 1;
      const rotate180 = isBackSide && duplex === "long-edge";
      sheets += 1;

      for (let half = 0; half < 2; half += 1) {
        const localIndex = order[i + half] - 1;
        const globalIndex = start + localIndex;

        if (globalIndex >= totalPages || localIndex >= pagesInSignature) {
          continue; // blank filler page
        }

        const sourcePage = sourcePages[globalIndex];

        drawHalf({
          sheetPage,
          embeddedPage: embeddedPages[globalIndex],
          sourceWidth: sourcePage.getWidth(),
          sourceHeight: sourcePage.getHeight(),
          half: rotate180 ? 1 - half : half,
          rotate180
        });
      }
    }
  }

  const outputBytes = await outputPdf.save();
  await fs.writeFile(output, outputBytes);

  return {
    input,
    output,
    booklet: true,
    duplex,
    pages: totalPages,
    signatureSize: pagesPerSignature,
    signatures: signatureCount,
    sheetSides: sheets
  };
}
