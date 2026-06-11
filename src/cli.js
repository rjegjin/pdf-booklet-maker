#!/usr/bin/env node

import { Command } from "commander";
import { duplicatePdf, MODES } from "./layout.js";

const program = new Command();

program
  .name("pdf-booklet-maker")
  .description("Duplicate PDF pages into printable A4 layouts.")
  .argument("<input>", "Input PDF")
  .argument("<output>", "Output PDF")
  .requiredOption("--mode <mode>", `Layout mode: ${Object.keys(MODES).join(", ")}`)
  .action(async (input, output, options) => {
    try {
      const result = await duplicatePdf({
        input,
        output,
        mode: options.mode
      });

      console.log("PDF generated successfully.");
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  });

program.parse();
