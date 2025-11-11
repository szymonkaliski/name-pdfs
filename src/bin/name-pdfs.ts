#!/usr/bin/env node

import { existsSync } from "fs";
import { resolve } from "path";
import { getApiKey } from "../lib/api-key.js";
import { processAllPdfs, applyRenames } from "../lib/processor.js";
import { displayResultsAndConfirm } from "../lib/tui.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(`
name-pdfs - Intelligently rename PDF files using Claude AI

Usage:
  name-pdfs [options] <file1.pdf> [file2.pdf] [...]

Options:
  --debug    Show verbose debug information (full prompts/responses)
  --help     Show this help message

Examples:
  name-pdfs paper.pdf
  name-pdfs *.pdf
  name-pdfs --debug document.pdf

Environment:
  ANTHROPIC_API_KEY    API key for Claude (or use ~/.name-pdfs-key file)
`);
    process.exit(0);
  }

  const debug = args.includes("--debug");
  const pdfFiles = args.filter((arg) => !arg.startsWith("--"));

  if (pdfFiles.length === 0) {
    console.error("Error: No PDF files specified");
    process.exit(1);
  }

  const validFiles: string[] = [];
  for (const file of pdfFiles) {
    const fullPath = resolve(file);
    if (!existsSync(fullPath)) {
      console.error(`Error: File not found: ${file}`);
      continue;
    }
    if (!file.toLowerCase().endsWith(".pdf")) {
      console.error(`Error: Not a PDF file: ${file}`);
      continue;
    }
    validFiles.push(fullPath);
  }

  if (validFiles.length === 0) {
    console.error("Error: No valid PDF files to process");
    process.exit(1);
  }

  try {
    await getApiKey();
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  try {
    const results = await processAllPdfs(validFiles, { debug });
    const selectedFiles = await displayResultsAndConfirm(results);

    if (selectedFiles.size > 0) {
      await applyRenames(results, selectedFiles);
    } else {
      console.log("\nNo files renamed.");
    }
    process.exit(0);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`\nError: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
