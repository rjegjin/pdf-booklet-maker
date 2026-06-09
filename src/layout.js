import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";

export const A4_WIDTH = 595.2756;
export const A4_HEIGHT = 841.8898;

export const MODES = Object.freeze({
  half: {
    columns: 1,
    rows: 2,
    description: "Duplicate each page twice on one A4 page."
  },
  eighth: {
    columns: 2,
    rows: 4,
    description: "Duplicate each page eight times on one A4 page using a 2x4 layout."
  }
});

export function getLayoutForMode(mode) {
  const layout = MODES[mode];

  if (!layout) {
    const availableModes = Object.keys(MODES).join(", ");
    throw new Error(`Unsupported mode: ${mode}. Available modes: ${availableModes}`);
  }

  return layout;
}

function assertPdfPath(filePath, label) {
  if (!filePath || typeof filePath !== "string") {
    throw new Error(`${label} path is required.`);
  }

  if (path.extname(filePath).toLowerCase() !== ".pdf") {
    throw new Error(`${label} must be a PDF file: ${filePath}`);
  }
}

function calculateContainSize({ sourceWidth, sourceHeight, cellWidth, cellHeight }) {
  const scale = Math.min(cellWidth / sourceWidth, cellHeight / sourceHeight);

  return {
    width: sourceWidth * scale,
    height: sourceHeight * scale
  };
}

function drawDuplicatedPage({ outputPage, embeddedPage, sourceWidth, sourceHeight, columns, rows }) {
  const cellWidth = A4_WIDTH / columns;
  const cellHeight = A4_HEIGHT / rows;

  const { width: drawnWidth, height: drawnHeight } = calculateContainSize({
    sourceWidth,
    sourceHeight,
    cellWidth,
    cellHeight
  });

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cellX = column * cellWidth;
      const cellY = A4_HEIGHT - (row + 1) * cellHeight;

      const x = cellX + (cellWidth - drawnWidth) / 2;
      const y = cellY + (cellHeight - drawnHeight) / 2;

      outputPage.drawPage(embeddedPage, {
        x,
        y,
        width: drawnWidth,
        height: drawnHeight
      });
    }
  }
}

export async function duplicatePdf({ input, output, mode }) {
  assertPdfPath(input, "Input");
  assertPdfPath(output, "Output");

  const { columns, rows } = getLayoutForMode(mode);

  const inputBytes = await fs.readFile(input);
  const sourcePdf = await PDFDocument.load(inputBytes);
  const outputPdf = await PDFDocument.create();

  const sourcePages = sourcePdf.getPages();

  if (sourcePages.length === 0) {
    throw new Error("Input PDF has no pages.");
  }

  for (const sourcePage of sourcePages) {
    const embeddedPage = await outputPdf.embedPage(sourcePage);
    const outputPage = outputPdf.addPage([A4_WIDTH, A4_HEIGHT]);

    drawDuplicatedPage({
      outputPage,
      embeddedPage,
      sourceWidth: sourcePage.getWidth(),
      sourceHeight: sourcePage.getHeight(),
      columns,
      rows
    });
  }

  const outputBytes = await outputPdf.save();
  await fs.writeFile(output, outputBytes);

  return {
    input,
    output,
    mode,
    pages: sourcePages.length,
    columns,
    rows
  };
}
