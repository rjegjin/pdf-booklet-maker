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

export const MAX_GRID_DIMENSION = 12;

export function parseGrid(grid) {
  if (typeof grid !== "string") {
    throw new Error("Grid must be a string like 2x4.");
  }

  const match = grid.trim().toLowerCase().match(/^(\d+)x(\d+)$/);

  if (!match) {
    throw new Error(`Invalid grid format: ${grid}. Expected CxR, e.g. 2x4.`);
  }

  const columns = Number(match[1]);
  const rows = Number(match[2]);

  if (columns < 1 || rows < 1 || columns > MAX_GRID_DIMENSION || rows > MAX_GRID_DIMENSION) {
    throw new Error(
      `Grid dimensions must be between 1 and ${MAX_GRID_DIMENSION}: ${grid}`
    );
  }

  return { columns, rows };
}

export function resolveLayout({ mode, grid }) {
  if (mode && grid) {
    throw new Error("Use either --mode or --grid, not both.");
  }

  if (grid) {
    return parseGrid(grid);
  }

  if (mode) {
    return getLayoutForMode(mode);
  }

  throw new Error("A layout is required: pass --mode or --grid.");
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

export async function duplicatePdf({ input, output, mode, grid }) {
  assertPdfPath(input, "Input");
  assertPdfPath(output, "Output");

  const { columns, rows } = resolveLayout({ mode, grid });

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
    mode: mode ?? null,
    grid: `${columns}x${rows}`,
    pages: sourcePages.length,
    columns,
    rows
  };
}
