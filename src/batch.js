import fs from "node:fs/promises";
import path from "node:path";

export function patternToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\*/g, ".*").replace(/\?/g, ".")}$`, "i");
}

export async function listInputFiles(inputDir, pattern = "*.pdf") {
  const stats = await fs.stat(inputDir).catch(() => null);

  if (!stats || !stats.isDirectory()) {
    throw new Error(`Input directory not found: ${inputDir}`);
  }

  const regex = patternToRegExp(pattern);
  const entries = await fs.readdir(inputDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && regex.test(entry.name) && path.extname(entry.name).toLowerCase() === ".pdf")
    .map((entry) => path.join(inputDir, entry.name))
    .sort();
}

export function outputPathFor({ inputFile, outputDir, suffix }) {
  const base = path.basename(inputFile, path.extname(inputFile));
  return path.join(outputDir, `${base}${suffix}.pdf`);
}

/**
 * Run `convert({ input, output })` for every PDF in inputDir matching pattern.
 * Continues on per-file errors and reports them in the summary.
 */
export async function runBatch({ inputDir, outputDir, pattern = "*.pdf", suffix = "", convert }) {
  if (!outputDir) {
    throw new Error("--output-dir is required when using --input-dir.");
  }

  const files = await listInputFiles(inputDir, pattern);

  if (files.length === 0) {
    throw new Error(`No PDF files matching "${pattern}" in ${inputDir}`);
  }

  await fs.mkdir(outputDir, { recursive: true });

  const results = [];
  const errors = [];

  for (const inputFile of files) {
    const outputFile = outputPathFor({ inputFile, outputDir, suffix });

    try {
      const result = await convert({ input: inputFile, output: outputFile });
      results.push(result);
    } catch (error) {
      errors.push({ input: inputFile, error: error.message });
    }
  }

  return {
    inputDir,
    outputDir,
    pattern,
    suffix,
    converted: results.length,
    failed: errors.length,
    results,
    errors
  };
}
