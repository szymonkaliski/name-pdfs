import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export async function ensureAuth(): Promise<void> {
  if (process.env.ANTHROPIC_API_KEY) {
    return;
  }

  const keyPath = join(homedir(), ".name-pdfs-key");

  try {
    const key = (await readFile(keyPath, "utf-8")).trim();
    if (key) {
      process.env.ANTHROPIC_API_KEY = key;
      return;
    }
  } catch {}

  console.log(
    "No API key found; falling back to Claude Code subscription auth.",
  );
}
