#!/usr/bin/env node

import { Command } from "commander";
import { duplicatePdf, MODES } from "./layout.js";

const program = new Command();

program
  .name("pdf-booklet-maker")
  .description("Duplicate PDF pages into printable A4 layouts.")
  .argument("<input>", "Input PDF")
  .argument("<output>", "Output PDF")
  .option("--mode <mode>", `Layout mode: ${Object.keys(MODES).join(", ")}`)
  .option("--grid <CxR>", "Custom grid layout, e.g. 2x4 (columns x rows)")
  .option("--margin <points>", "Outer margin around the sheet in points", "0")
  .option("--gap <points>", "Gap between cells in points", "0")
  .option("--rotate <rotation>", "Rotation: auto, none, 90, 180, 270", "none")
  .option("--fit <fit>", "Cell fit: contain, cover, stretch", "contain")
  .action(async (input, output, options) => {
    try {
      const result = await duplicatePdf({
        input,
        output,
        mode: options.mode,
        grid: options.grid,
        margin: options.margin,
        gap: options.gap,
        rotate: options.rotate,
        fit: options.fit
      });

      console.log("PDF generated successfully.");
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  });

program.parse();
