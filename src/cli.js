#!/usr/bin/env node

import { Command } from "commander";
import { duplicatePdf, MODES } from "./layout.js";
import { imposeBooklet, DUPLEX_MODES } from "./booklet.js";
import { runBatch } from "./batch.js";

const program = new Command();

program
  .name("pdf-booklet-maker")
  .description("Duplicate PDF pages into printable A4 layouts.")
  .argument("[input]", "Input PDF (omit when using --input-dir)")
  .argument("[output]", "Output PDF (omit when using --input-dir)")
  .option("--mode <mode>", `Layout mode: ${Object.keys(MODES).join(", ")}`)
  .option("--grid <CxR>", "Custom grid layout, e.g. 2x4 (columns x rows)")
  .option("--margin <points>", "Outer margin around the sheet in points", "0")
  .option("--gap <points>", "Gap between cells in points", "0")
  .option("--rotate <rotation>", "Rotation: auto, none, 90, 180, 270", "none")
  .option("--fit <fit>", "Cell fit: contain, cover, stretch", "contain")
  .option("--cut-line", "Draw cut guide lines along cell boundaries")
  .option("--cut-line-style <style>", "Cut-line style: dashed, solid", "dashed")
  .option("--cut-line-width <points>", "Cut-line thickness in points", "0.5")
  .option("--crop-mark", "Draw crop marks at cell corners")
  .option("--crop-mark-length <points>", "Crop-mark length in points", "10")
  .option("--crop-mark-offset <points>", "Crop-mark offset from the corner in points", "3")
  .option("--booklet", "Saddle-stitch booklet imposition (2-up on landscape A4)")
  .option("--saddle-stitch", "Alias for --booklet")
  .option("--signature-size <pages>", "Pages per signature (multiple of 4, default: whole document)")
  .option("--duplex <edge>", `Duplex printing edge: ${DUPLEX_MODES.join(", ")}`, "short-edge")
  .option("--input-dir <dir>", "Batch mode: convert every matching PDF in this directory")
  .option("--output-dir <dir>", "Batch mode: directory for converted PDFs")
  .option("--pattern <glob>", "Batch mode: filename pattern (* and ? wildcards)", "*.pdf")
  .option("--suffix <suffix>", "Batch mode: output filename suffix (default: derived from layout)")
  .action(async (input, output, options) => {
    try {
      const booklet = options.booklet || options.saddleStitch;

      if (booklet && (options.mode || options.grid)) {
        throw new Error("--booklet cannot be combined with --mode or --grid.");
      }

      const convert = booklet
        ? ({ input: convertInput, output: convertOutput }) =>
            imposeBooklet({
              input: convertInput,
              output: convertOutput,
              signatureSize: options.signatureSize,
              duplex: options.duplex
            })
        : ({ input: convertInput, output: convertOutput }) =>
            duplicatePdf({
              input: convertInput,
              output: convertOutput,
              mode: options.mode,
              grid: options.grid,
              margin: options.margin,
              gap: options.gap,
              rotate: options.rotate,
              fit: options.fit,
              cutLine: options.cutLine,
              cutLineStyle: options.cutLineStyle,
              cutLineWidth: options.cutLineWidth,
              cropMark: options.cropMark,
              cropMarkLength: options.cropMarkLength,
              cropMarkOffset: options.cropMarkOffset
            });

      if (options.inputDir) {
        if (input || output) {
          throw new Error("Use either input/output arguments or --input-dir, not both.");
        }

        const suffix = options.suffix
          ?? (booklet ? "-booklet" : options.grid ? `-${options.grid}` : options.mode ? `-${options.mode}` : "-out");

        const summary = await runBatch({
          inputDir: options.inputDir,
          outputDir: options.outputDir,
          pattern: options.pattern,
          suffix,
          convert
        });

        console.log(`Batch complete: ${summary.converted} converted, ${summary.failed} failed.`);
        console.log(JSON.stringify(summary, null, 2));

        if (summary.failed > 0) {
          process.exitCode = 1;
        }

        return;
      }

      if (!input || !output) {
        throw new Error("Input and output PDF paths are required (or use --input-dir).");
      }

      const result = await convert({ input, output });

      console.log(booklet ? "Booklet PDF generated successfully." : "PDF generated successfully.");
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  });

program.parse();
