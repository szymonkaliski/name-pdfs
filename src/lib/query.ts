import {
  query,
  type Options,
  type PermissionMode,
} from "@anthropic-ai/claude-agent-sdk";

const QUERY_TIMEOUT_MS = 60000;

function buildRenamePrompt(
  currentName: string,
  metadata: string,
  text: string,
): string {
  return `Based on the PDF metadata and extracted text below, suggest a proper academic paper filename in the format "Title - Subtitle.pdf".

Rules:
1. Use proper title case
2. If there's a clear subtitle, include it after " - "
3. If no subtitle, just use "Title.pdf"
4. Remove special characters that are problematic in filenames (keep only: a-zA-Z0-9 spaces - _ .)
5. Keep the name concise but descriptive
6. Ensure the .pdf extension is included

IMPORTANT: Output ONLY the new filename, nothing else. No explanations, no commands, just the filename.

CURRENT FILE: ${currentName}

PDF METADATA:
${metadata}

EXTRACTED TEXT (first pages):
${text}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Query timed out after ${timeoutMs / 1000}s`)),
        timeoutMs,
      ),
    ),
  ]);
}

export interface QueryOptions {
  debug?: boolean;
}

export async function queryFilename(
  currentName: string,
  metadata: string,
  text: string,
  options: QueryOptions = {},
): Promise<string> {
  const results: string[] = [];
  const prompt = buildRenamePrompt(currentName, metadata, text);

  if (options.debug) {
    console.log("\n" + "=".repeat(80));
    console.log("PROMPT SENT TO CLAUDE:");
    console.log("=".repeat(80));
    console.log(prompt);
    console.log("=".repeat(80) + "\n");
  }

  const startTime = Date.now();

  try {
    const sdkOptions: Options = {
      disallowedTools: [
        "Edit",
        "Write",
        "NotebookEdit",
        "TodoWrite",
        "Task",
        "Bash",
        "Grep",
        "Glob",
      ],
      permissionMode: "bypassPermissions" as PermissionMode,
      systemPrompt: {
        type: "preset",
        preset: "claude_code",
      },
    };

    const queryExecution = (async () => {
      for await (const message of query({
        prompt,
        options: sdkOptions,
      })) {
        if (message.type === "assistant" && message.message?.content) {
          for (const block of message.message.content) {
            if (block.type === "text") {
              results.push(block.text);
            }
          }
        }
      }
    })();

    await withTimeout(queryExecution, QUERY_TIMEOUT_MS);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const response = results.join("\n").trim();

    if (options.debug) {
      console.log("=".repeat(80));
      console.log("RESPONSE FROM CLAUDE:");
      console.log("=".repeat(80));
      console.log(response);
      console.log("=".repeat(80));
      console.log(`Response time: ${duration}s\n`);
    }

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (options.debug) {
      console.error("\nERROR:", errorMessage);
    }
    if (errorMessage.includes("timed out")) {
      throw new Error(`Query timed out after ${QUERY_TIMEOUT_MS / 1000}s`);
    }
    throw new Error(`Query failed: ${errorMessage}`);
  }
}
