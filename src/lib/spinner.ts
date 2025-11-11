export interface Spinner {
  start(): void;
  stop(): void;
  update(message: string): void;
}

export function createSpinner(): Spinner {
  let interval: NodeJS.Timeout | null = null;
  let isRunning = false;
  let currentMessage = "Processing";

  const dots = ["", ".", "..", "..."];
  let i = 0;

  return {
    start() {
      if (!process.stdout.isTTY || isRunning) {
        return;
      }

      isRunning = true;
      process.stdout.write("\x1b[?25l");

      interval = setInterval(() => {
        const gray = "\x1b[90m";
        const reset = "\x1b[0m";
        process.stdout.write(
          `\r${gray}${currentMessage}${dots[i]}${reset}\x1b[K`,
        );
        i = (i + 1) % 4;
      }, 300);
    },

    update(message: string) {
      currentMessage = message;
    },

    stop() {
      if (!isRunning) {
        return;
      }

      isRunning = false;

      if (interval) {
        clearInterval(interval);
        interval = null;
      }

      if (process.stdout.isTTY) {
        process.stdout.write("\r\x1b[K");
        process.stdout.write("\x1b[?25h");
      }
    },
  };
}
