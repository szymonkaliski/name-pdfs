import { defineConfig } from "tsup";

export default defineConfig({
  entry: { "bin/name-pdfs": "src/bin/name-pdfs.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  bundle: true,
  external: [
    "@anthropic-ai/claude-agent-sdk",
    "@inquirer/prompts",
    "pdf-parse",
  ],
});
