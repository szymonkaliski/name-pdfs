import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export async function getApiKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  const keyPath = join(homedir(), ".name-pdfs-key");

  try {
    const key = await readFile(keyPath, "utf-8");
    return key.trim();
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      throw new Error(
        `API key not found. Please either:
  1. Set ANTHROPIC_API_KEY environment variable
  2. Create ~/.name-pdfs-key file with your API key

Get your API key from: https://console.anthropic.com/`,
      );
    }
    throw error;
  }
}
