import { buildAgentArgs, runAg } from "./antigravity.js";

function textResult(text, structuredContent) {
  return {
    content: [{ type: "text", text }],
    ...(structuredContent ? { structuredContent } : {})
  };
}

function formatResult(result) {
  const output = result.stdout || result.stderr || "";
  try {
    return textResult(JSON.stringify(JSON.parse(output), null, 2), JSON.parse(output));
  } catch {
    return textResult(output);
  }
}

export async function agyRun(input) {
  if (!input.prompt?.trim()) throw new Error("prompt is required");
  const args = buildAgentArgs(input);
  const result = await runAg(args, {
    cwd: input.cwd,
    timeoutMs: input.timeoutMs,
    env: input.env
  });
  return formatResult(result);
}

export async function agyUsage(input = {}) {
  return runReadOnlyCommand("/usage", input);
}

export async function agyQuota(input = {}) {
  return runReadOnlyCommand("/quota", input);
}

export async function agyModels(input = {}) {
  const result = await runAg(["models"], input);
  return formatResult(result);
}

export async function agyVersion(input = {}) {
  const result = await runAg(["--version"], input);
  return formatResult(result);
}

export async function agyHelp(input = {}) {
  const args = input.command ? ["help", input.command] : ["help"];
  const result = await runAg(args, input);
  return formatResult(result);
}

export async function agyReadOnlyCommand(input) {
  if (!input.command?.startsWith("/")) {
    throw new Error("command must be a slash command such as /usage or /model");
  }
  return runReadOnlyCommand(input.command, input);
}

async function runReadOnlyCommand(command, input) {
  const args = ["--print", "--output-format", input.outputFormat || "json", command];
  const result = await runAg(args, {
    cwd: input.cwd,
    timeoutMs: input.timeoutMs,
    env: input.env
  });
  return formatResult(result);
}

export async function agyRaw(input) {
  if (!Array.isArray(input.args)) throw new Error("args must be an array");
  const result = await runAg(input.args, {
    cwd: input.cwd,
    timeoutMs: input.timeoutMs,
    env: input.env
  });
  return formatResult(result);
}
