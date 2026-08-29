#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  agyHelp,
  agyModels,
  agyQuota,
  agyRaw,
  agyReadOnlyCommand,
  agyRun,
  agyUsage,
  agyVersion
} from "./tools.js";

const server = new McpServer({
  name: "antigravity-mcp",
  version: "1.0.0"
});

const common = {
  cwd: z.string().optional().describe("Working directory for agy."),
  timeoutMs: z.number().int().positive().optional().describe("Process timeout in milliseconds."),
  env: z.record(z.string()).optional().describe("Additional environment variables for agy.")
};

server.registerTool("agy_run", {
  description: "Run the Antigravity agent in non-interactive print mode with common CLI options.",
  inputSchema: {
    prompt: z.string().describe("Task for the Antigravity agent."),
    model: z.string().optional().describe("Antigravity model name."),
    effort: z.enum(["low", "medium", "high"]).optional().describe("Reasoning effort."),
    sandbox: z.boolean().optional().describe("Enable Antigravity sandbox mode."),
    skipPermissions: z.boolean().optional().describe("Pass --dangerously-skip-permissions."),
    addDirs: z.array(z.string()).optional().describe("Additional directories to expose."),
    conversationId: z.string().optional().describe("Continue a specific conversation ID."),
    continueLatest: z.boolean().optional().describe("Continue the most recent conversation."),
    printTimeout: z.string().optional().describe("Antigravity --print-timeout value."),
    outputFormat: z.enum(["json", "text", "stream-json"]).optional(),
    extraArgs: z.array(z.string()).optional().describe("Additional raw agy CLI arguments."),
    ...common
  }
}, agyRun);

server.registerTool("agy_usage", {
  description: "Read Antigravity usage information via the /usage command.",
  inputSchema: common
}, agyUsage);

server.registerTool("agy_quota", {
  description: "Read Antigravity quota information via the /quota command.",
  inputSchema: common
}, agyQuota);

server.registerTool("agy_models", {
  description: "List models known by the Antigravity CLI.",
  inputSchema: common
}, agyModels);

server.registerTool("agy_version", {
  description: "Return the installed Antigravity CLI version.",
  inputSchema: common
}, agyVersion);

server.registerTool("agy_help", {
  description: "Show Antigravity CLI help, optionally for a specific command.",
  inputSchema: {
    command: z.string().optional(),
    ...common
  }
}, agyHelp);

server.registerTool("agy_readonly_command", {
  description: "Execute a read-only Antigravity slash command such as /usage, /quota, /model, /effort, /skills, or /credits.",
  inputSchema: {
    command: z.string().startsWith("/"),
    outputFormat: z.enum(["json", "text", "stream-json"]).optional(),
    ...common
  }
}, agyReadOnlyCommand);

server.registerTool("agy_raw", {
  description: "Run the Antigravity CLI with an arbitrary argument array. Use this as an escape hatch for new or uncommon agy options.",
  inputSchema: {
    args: z.array(z.string()),
    ...common
  }
}, agyRaw);

const transport = new StdioServerTransport();
await server.connect(transport);
