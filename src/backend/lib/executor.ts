import { type ChildProcess } from "node:child_process";

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
}

/**
 * Executes a piece of JavaScript code locally for the Looply POC.
 * In a real production environment, this should point to a secure sandbox (e.g. E2B or WASM).
 */
export async function executeJavaScript(code: string): Promise<ExecutionResult> {
  const start = Date.now();
  
  return new Promise((resolve) => {
    // We use a dynamic lookup to bypass Turbopack's static argument validation,
    // which incorrectly tries to resolve strings in spawn() as module paths.
    const engine = "node";
    const entry = ["-", "e"].join("");
    
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cp = require("node:child_process");
    const child = cp.spawn(engine, [entry, code], {
      timeout: 10000, // 10s timeout
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer | string) => {
      stdout += String(data);
    });

    child.stderr.on("data", (data: Buffer | string) => {
      stderr += String(data);
    });

    child.on("close", (exitCode: number | null) => {
      resolve({
        stdout,
        stderr,
        exitCode,
        duration: Date.now() - start,
      });
    });

    child.on("error", (err: Error) => {
       resolve({
          stdout,
          stderr: stderr + "\n" + err.message,
          exitCode: 1,
          duration: Date.now() - start,
       });
    });
  });
}
