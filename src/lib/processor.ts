import { cpus } from "os";
import { basename, dirname, join } from "path";
import { rename } from "fs/promises";
import { extractPdfData, formatMetadata } from "./pdf-extractor";
import { queryFilename } from "./query";
import { createSpinner } from "./spinner";

export interface ProcessResult {
  status: "success" | "failed" | "skipped";
  oldPath: string;
  oldName: string;
  newName: string | null;
  error?: string;
}

interface ProcessOptions {
  debug?: boolean;
}

async function processPdf(
  filePath: string,
  options: ProcessOptions,
): Promise<ProcessResult> {
  const oldName = basename(filePath);

  try {
    const pdfData = await extractPdfData(filePath);
    const metadata = formatMetadata(pdfData.metadata);

    if (options.debug) {
      console.log(`\n[${oldName}] Extracted PDF data:`);
      console.log(`Metadata:\n${metadata}`);
      console.log(`Text preview: ${pdfData.text.slice(0, 200)}...`);
    }

    const newName = await queryFilename(oldName, metadata, pdfData.text, {
      debug: options.debug,
    });

    if (!newName || newName === oldName) {
      return {
        status: "skipped",
        oldPath: filePath,
        oldName,
        newName: null,
        error: "AI suggested same name or no name",
      };
    }

    if (!newName.endsWith(".pdf")) {
      return {
        status: "failed",
        oldPath: filePath,
        oldName,
        newName: null,
        error: "AI response did not include .pdf extension",
      };
    }

    return {
      status: "success",
      oldPath: filePath,
      oldName,
      newName,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: "failed",
      oldPath: filePath,
      oldName,
      newName: null,
      error: errorMessage,
    };
  }
}

class PromisePool {
  private concurrency: number;
  private running = 0;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  async add<T>(task: () => Promise<T>): Promise<T> {
    while (this.running >= this.concurrency) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
    }
  }

  async waitAll(): Promise<void> {
    while (this.running > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
}

export async function processAllPdfs(
  filePaths: string[],
  options: ProcessOptions = {},
): Promise<ProcessResult[]> {
  const concurrency = cpus().length;
  const pool = new PromisePool(concurrency);
  const results: ProcessResult[] = [];
  const spinner = createSpinner();

  if (!options.debug) {
    spinner.start();
  }

  let completed = 0;

  const tasks = filePaths.map((filePath) =>
    pool.add(async () => {
      const result = await processPdf(filePath, options);
      results.push(result);
      completed++;

      if (!options.debug) {
        spinner.update(`Processing (${completed}/${filePaths.length})`);
      } else {
        console.log(
          `\n[${completed}/${filePaths.length}] Completed: ${basename(filePath)}`,
        );
      }
    }),
  );

  await Promise.all(tasks);
  await pool.waitAll();

  if (!options.debug) {
    spinner.stop();
  }

  return results;
}

export async function applyRenames(
  results: ProcessResult[],
  selectedNames: Set<string>,
): Promise<void> {
  const toRename = results.filter(
    (r) => r.status === "success" && r.newName && selectedNames.has(r.oldName),
  );

  if (toRename.length === 0) {
    return;
  }

  console.log("");

  for (const result of toRename) {
    if (!result.newName) continue;

    const dir = dirname(result.oldPath);
    const newPath = join(dir, result.newName);

    try {
      await rename(result.oldPath, newPath);
      console.log(`✓ ${result.oldName} → ${result.newName}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`✗ Failed to rename ${result.oldName}: ${errorMessage}`);
    }
  }
}
