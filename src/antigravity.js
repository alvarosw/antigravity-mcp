import { spawn } from "node:child_process";

function commandName() {
  return process.env.AGY_CMD || "agy";
}

export function runAg(yArgs, options = {}) {
  const args = Array.isArray(yArgs) ? yArgs : [];
  const cwd = options.cwd || process.cwd();
  const timeoutMs = options.timeoutMs ?? 10 * 60 * 1000;
  const env = { ...process.env, ...(options.env || {}) };

  return new Promise((resolve, reject) => {
    const child = spawn(commandName(), args, {
      cwd,
      env,
      shell: false,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    const timer = setTimeout(() => {
      child.kill();
      finish(reject, new Error(`agy timed out after ${timeoutMs} ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      finish(reject, error);
    });

    child.on("close", (code, signal) => {
      clearTimeout(timer);
      const result = {
        command: commandName(),
        args,
        cwd,
        exitCode: code,
        signal,
        stdout: stdout.trim(),
        stderr: stderr.trim()
      };

      if (code === 0) finish(resolve, result);
      else {
        const error = new Error(
          result.stderr || `agy exited with code ${code ?? "unknown"}`
        );
        error.result = result;
        finish(reject, error);
      }
    });
  });
}

export function buildAgentArgs(input) {
  const args = ["--print"];

  if (input.outputFormat) {
    args.push("--output-format", input.outputFormat);
  } else {
    args.push("--output-format", "json");
  }

  if (input.model) args.push("--model", input.model);
  if (input.effort) args.push("--effort", input.effort);
  if (input.sandbox === true) args.push("--sandbox");
  if (input.skipPermissions === true) args.push("--dangerously-skip-permissions");
  if (input.addDirs?.length) {
    for (const dir of input.addDirs) args.push("--add-dir", dir);
  }
  if (input.conversationId) args.push("--conversation", input.conversationId);
  if (input.continueLatest === true) args.push("--continue");
  if (input.printTimeout) args.push("--print-timeout", input.printTimeout);

  if (Array.isArray(input.extraArgs)) args.push(...input.extraArgs);

  args.push(input.prompt);
  return args;
}
