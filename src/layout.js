import fs from "node:fs/promises";
import path from "node:path";
import {
  PDFDocument,
  degrees,
  rgb,
  pushGraphicsState,
  popGraphicsState,
  moveTo,
  lineTo,
  closePath,
  clip,
  endPath
} from "pdf-lib";

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

export const ROTATIONS = Object.freeze(["auto", "none", "90", "180", "270"]);
export const FITS = Object.freeze(["contain", "cover", "stretch"]);

export function parsePrintOptions({ margin = 0, gap = 0, rotate = "none", fit = "contain" } = {}) {
  const marginPt = Number(margin);
  const gapPt = Number(gap);

  if (!Number.isFinite(marginPt) || marginPt < 0) {
    throw new Error(`Margin must be a non-negative number of points: ${margin}`);
  }

  if (!Number.isFinite(gapPt) || gapPt < 0) {
    throw new Error(`Gap must be a non-negative number of points: ${gap}`);
  }

  if (!ROTATIONS.includes(String(rotate))) {
    throw new Error(`Invalid rotate value: ${rotate}. Expected ${ROTATIONS.join(", ")}.`);
  }

  if (!FITS.includes(String(fit))) {
    throw new Error(`Invalid fit value: ${fit}. Expected ${FITS.join(", ")}.`);
  }

  return { margin: marginPt, gap: gapPt, rotate: String(rotate), fit: String(fit) };
}

export function computeCells({ columns, rows, margin, gap }) {
  const contentWidth = A4_WIDTH - 2 * margin;
  const contentHeight = A4_HEIGHT - 2 * margin;
  const cellWidth = (contentWidth - (columns - 1) * gap) / columns;
  const cellHeight = (contentHeight - (rows - 1) * gap) / rows;

  if (cellWidth <= 0 || cellHeight <= 0) {
    throw new Error(
      `Margin/gap leave no room for cells (margin ${margin}pt, gap ${gap}pt, grid ${columns}x${rows}).`
    );
  }

  const cells = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      cells.push({
        x: margin + column * (cellWidth + gap),
        y: A4_HEIGHT - margin - (row + 1) * cellHeight - row * gap,
        width: cellWidth,
        height: cellHeight
      });
    }
  }

  return { cells, cellWidth, cellHeight };
}

function resolveRotation({ rotate, sourceWidth, sourceHeight, cellWidth, cellHeight }) {
  if (rotate !== "auto") {
    return rotate === "none" ? 0 : Number(rotate);
  }

  const sourceLandscape = sourceWidth > sourceHeight;
  const cellLandscape = cellWidth > cellHeight;

  return sourceLandscape === cellLandscape ? 0 : 90;
}

function clipToRect(outputPage, { x, y, width, height }) {
  outputPage.pushOperators(
    pushGraphicsState(),
    moveTo(x, y),
    lineTo(x + width, y),
    lineTo(x + width, y + height),
    lineTo(x, y + height),
    closePath(),
    clip(),
    endPath()
  );
}

export const CUT_LINE_STYLES = Object.freeze(["dashed", "solid"]);

export function parseMarkOptions({
  cutLine = false,
  cutLineStyle = "dashed",
  cutLineWidth = 0.5,
  cropMark = false,
  cropMarkLength = 10,
  cropMarkOffset = 3
} = {}) {
  const lineWidth = Number(cutLineWidth);
  const markLength = Number(cropMarkLength);
  const markOffset = Number(cropMarkOffset);

  if (!CUT_LINE_STYLES.includes(String(cutLineStyle))) {
    throw new Error(`Invalid cut-line style: ${cutLineStyle}. Expected ${CUT_LINE_STYLES.join(", ")}.`);
  }

  if (!Number.isFinite(lineWidth) || lineWidth <= 0) {
    throw new Error(`Cut-line width must be a positive number of points: ${cutLineWidth}`);
  }

  if (!Number.isFinite(markLength) || markLength <= 0) {
    throw new Error(`Crop-mark length must be a positive number of points: ${cropMarkLength}`);
  }

  if (!Number.isFinite(markOffset) || markOffset < 0) {
    throw new Error(`Crop-mark offset must be a non-negative number of points: ${cropMarkOffset}`);
  }

  return {
    cutLine: Boolean(cutLine),
    cutLineStyle: String(cutLineStyle),
    cutLineWidth: lineWidth,
    cropMark: Boolean(cropMark),
    cropMarkLength: markLength,
    cropMarkOffset: markOffset
  };
}

function uniqueSorted(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted.filter((value, index) => index === 0 || value - sorted[index - 1] > 0.01);
}

function drawCutLines(outputPage, cells, { cutLineStyle, cutLineWidth }) {
  const xs = uniqueSorted(cells.flatMap((cell) => [cell.x, cell.x + cell.width]));
  const ys = uniqueSorted(cells.flatMap((cell) => [cell.y, cell.y + cell.height]));

  const style = {
    thickness: cutLineWidth,
    color: rgb(0.6, 0.6, 0.6),
    ...(cutLineStyle === "dashed" ? { dashArray: [4, 4] } : {})
  };

  for (const x of xs) {
    outputPage.drawLine({ start: { x, y: 0 }, end: { x, y: A4_HEIGHT }, ...style });
  }

  for (const y of ys) {
    outputPage.drawLine({ start: { x: 0, y }, end: { x: A4_WIDTH, y }, ...style });
  }
}

function drawCropMarks(outputPage, cells, { cropMarkLength, cropMarkOffset }) {
  const style = { thickness: 0.5, color: rgb(0, 0, 0) };

  for (const cell of cells) {
    const corners = [
      { x: cell.x, y: cell.y, dx: -1, dy: -1 },
      { x: cell.x + cell.width, y: cell.y, dx: 1, dy: -1 },
      { x: cell.x, y: cell.y + cell.height, dx: -1, dy: 1 },
      { x: cell.x + cell.width, y: cell.y + cell.height, dx: 1, dy: 1 }
    ];

    for (const { x, y, dx, dy } of corners) {
      const hx = x + dx * cropMarkOffset;
      const vy = y + dy * cropMarkOffset;

      outputPage.drawLine({
        start: { x: hx, y },
        end: { x: hx + dx * cropMarkLength, y },
        ...style
      });
      outputPage.drawLine({
        start: { x, y: vy },
        end: { x, y: vy + dy * cropMarkLength },
        ...style
      });
    }
  }
}

function drawMarks(outputPage, cells, markOptions) {
  if (markOptions.cutLine) {
    drawCutLines(outputPage, cells, markOptions);
  }

  if (markOptions.cropMark) {
    drawCropMarks(outputPage, cells, markOptions);
  }
}

function drawDuplicatedPage({
  outputPage,
  embeddedPage,
  sourceWidth,
  sourceHeight,
  columns,
  rows,
  margin,
  gap,
  rotate,
  fit
}) {
  const { cells, cellWidth, cellHeight } = computeCells({ columns, rows, margin, gap });

  const rotation = resolveRotation({ rotate, sourceWidth, sourceHeight, cellWidth, cellHeight });
  const swapped = rotation === 90 || rotation === 270;

  // Footprint of the source page in the cell after rotation.
  const effWidth = swapped ? sourceHeight : sourceWidth;
  const effHeight = swapped ? sourceWidth : sourceHeight;

  let footWidth;
  let footHeight;

  if (fit === "stretch") {
    footWidth = cellWidth;
    footHeight = cellHeight;
  } else {
    const ratio = fit === "cover"
      ? Math.max(cellWidth / effWidth, cellHeight / effHeight)
      : Math.min(cellWidth / effWidth, cellHeight / effHeight);
    footWidth = effWidth * ratio;
    footHeight = effHeight * ratio;
  }

  // drawPage width/height scale the unrotated page; swap back if rotated.
  const drawWidth = swapped ? footHeight : footWidth;
  const drawHeight = swapped ? footWidth : footHeight;

  for (const cell of cells) {
    const boxX = cell.x + (cell.width - footWidth) / 2;
    const boxY = cell.y + (cell.height - footHeight) / 2;

    // drawPage rotates counterclockwise around the anchor point, so shift
    // the anchor to keep the rotated bounding box at (boxX, boxY).
    let x = boxX;
    let y = boxY;

    if (rotation === 90) {
      x = boxX + footWidth;
    } else if (rotation === 180) {
      x = boxX + footWidth;
      y = boxY + footHeight;
    } else if (rotation === 270) {
      y = boxY + footHeight;
    }

    const needsClip = fit === "cover";

    if (needsClip) {
      clipToRect(outputPage, cell);
    }

    outputPage.drawPage(embeddedPage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
      rotate: degrees(rotation)
    });

    if (needsClip) {
      outputPage.pushOperators(popGraphicsState());
    }
  }
}

export async function duplicatePdf({
  input,
  output,
  mode,
  grid,
  margin,
  gap,
  rotate,
  fit,
  cutLine,
  cutLineStyle,
  cutLineWidth,
  cropMark,
  cropMarkLength,
  cropMarkOffset
}) {
  assertPdfPath(input, "Input");
  assertPdfPath(output, "Output");

  const { columns, rows } = resolveLayout({ mode, grid });
  const printOptions = parsePrintOptions({ margin, gap, rotate, fit });
  const markOptions = parseMarkOptions({
    cutLine,
    cutLineStyle,
    cutLineWidth,
    cropMark,
    cropMarkLength,
    cropMarkOffset
  });

  // Fail fast on impossible margin/gap combinations.
  const { cells } = computeCells({ columns, rows, margin: printOptions.margin, gap: printOptions.gap });

  const inputBytes = await fs.readFile(input);
  const sourcePdf = await PDFDocument.load(inputBytes);
  const outputPdf = await PDFDocument.create();

  const sourcePages = sourcePdf.getPages();

  if (sourcePages.length === 0) {
    throw new Error("Input PDF has no pages.");
  }

  // Embed all pages in one call so resources shared between pages
  // (fonts, images) are copied once instead of once per page.
  const embeddedPages = await outputPdf.embedPages(sourcePages);

  for (const [index, sourcePage] of sourcePages.entries()) {
    const embeddedPage = embeddedPages[index];
    const outputPage = outputPdf.addPage([A4_WIDTH, A4_HEIGHT]);

    drawDuplicatedPage({
      outputPage,
      embeddedPage,
      sourceWidth: sourcePage.getWidth(),
      sourceHeight: sourcePage.getHeight(),
      columns,
      rows,
      ...printOptions
    });

    drawMarks(outputPage, cells, markOptions);
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
    rows,
    ...printOptions
  };
}
