import { checkbox } from "@inquirer/prompts";
import type { ProcessResult } from "./processor";

export async function displayResultsAndConfirm(
  results: ProcessResult[],
): Promise<Set<string>> {
  const successful = results.filter((r) => r.status === "success" && r.newName);
  const failed = results.filter((r) => r.status === "failed");
  const skipped = results.filter((r) => r.status === "skipped");

  if (failed.length > 0) {
    console.log("\nFailed:");
    failed.forEach((result) => {
      console.log(`  ✗ ${result.oldName}: ${result.error}`);
    });
    console.log("");
  }

  if (skipped.length > 0) {
    console.log("\nSkipped:");
    skipped.forEach((result) => {
      console.log(`  - ${result.oldName}: ${result.error}`);
    });
    console.log("");
  }

  if (successful.length === 0) {
    console.log("No files to rename.");
    return new Set();
  }

  const terminalHeight = process.stdout.rows || 24;
  const pageSize = Math.max(terminalHeight - 5, 10);

  const selected = await checkbox({
    message: "Select files to rename:",
    choices: successful.map((result) => ({
      name: `${result.oldName} → ${result.newName}`,
      value: result.oldName,
      checked: true,
    })),
    pageSize,
  });

  return new Set(selected);
}
