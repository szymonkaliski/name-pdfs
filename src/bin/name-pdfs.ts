#!/usr/bin/env node

import { existsSync, readdirSync } from "fs";
import { resolve } from "path";
import { ensureAuth } from "../lib/api-key.js";
import { processAllPdfs, applyRenames } from "../lib/processor.js";
import { displayResultsAndConfirm } from "../lib/tui.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
name-pdfs - Intelligently rename PDF files using Claude AI

Usage:
  name-pdfs [options] [file1.pdf] [file2.pdf] [...]

  If no files are specified, all PDFs in the current directory are used.

Options:
  --debug    Show verbose debug information (full prompts/responses)
  --help     Show this help message

Examples:
  name-pdfs
  name-pdfs paper.pdf
  name-pdfs --debug document.pdf

Auth (checked in order):
  ANTHROPIC_API_KEY    API key for Claude
  ~/.name-pdfs-key     File containing your API key
  claude login         Claude Code subscription (fallback)
`);
    process.exit(0);
  }

  const debug = args.includes("--debug");
  let pdfFiles = args.filter((arg) => !arg.startsWith("--"));

  if (pdfFiles.length === 0) {
    pdfFiles = readdirSync(".").filter((f) => f.toLowerCase().endsWith(".pdf"));
    if (pdfFiles.length === 0) {
      console.error("No PDF files found in current directory");
      process.exit(1);
    }
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

  await ensureAuth();

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
