# Antigravity MCP

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes the local Antigravity CLI (`agy`) to MCP-compatible coding agents.

The project intentionally keeps the architecture small: MCP tools validate inputs, a thin CLI adapter executes `agy`, and `agy_raw` provides an escape hatch for CLI options that are added in future Antigravity releases.

## Features

- Run Antigravity as a local coding agent through MCP.
- Preserve conversation context with conversation IDs.
- Control common CLI options such as model, effort, sandbox, permissions, directories, timeouts, and output format.
- Inspect usage, quota, models, version, and help.
- Execute supported read-only slash commands.
- Pass arbitrary CLI arguments through `agy_raw` for forward compatibility.
- No shell execution: arguments are passed directly to the `agy` process.

## Requirements

- Node.js 18+
- Antigravity CLI installed and authenticated
- `agy` available on `PATH`
- An MCP-compatible client

If `agy` is not on `PATH`, set `AGY_CMD` to the executable path.

```bash
AGY_CMD=/custom/path/agy
```

Windows PowerShell:

```powershell
$env:AGY_CMD = "C:\path\to\agy.exe"
```

## Quick Start

The recommended setup is through npm. You do not need to clone this repository or install the MCP server manually.

### Claude Code

```bash
claude mcp add --scope user antigravity -- npx -y antigravity-mcp
```

Verify the server:

```bash
claude mcp list
```

If `agy` is not on `PATH`:

```bash
claude mcp add --scope user \
  --env AGY_CMD=/custom/path/agy \
  antigravity -- npx -y antigravity-mcp
```

Windows PowerShell:

```powershell
claude mcp add --scope user `
  --env AGY_CMD="C:\path\to\agy.exe" `
  antigravity -- npx -y antigravity-mcp
```

### Gemini CLI

Gemini CLI supports adding local stdio MCP servers with `gemini mcp add`.

```bash
gemini mcp add --scope user antigravity npx -y antigravity-mcp
```

Verify:

```bash
gemini mcp list
```

Reference: [Gemini CLI MCP documentation](https://geminicli.com/docs/tools/mcp-server/)

### Cursor

Add the following MCP server to Cursor's MCP configuration:

```json
{
  "mcpServers": {
    "antigravity": {
      "command": "npx",
      "args": ["-y", "antigravity-mcp"]
    }
  }
}
```

### Windsurf

Add the following stdio server to Windsurf's MCP configuration:

```json
{
  "mcpServers": {
    "antigravity": {
      "command": "npx",
      "args": ["-y", "antigravity-mcp"]
    }
  }
}
```

### Cline / Roo Code / Other MCP Clients

For MCP clients that expose a generic stdio configuration, use:

```json
{
  "command": "npx",
  "args": ["-y", "antigravity-mcp"]
}
```

If the client supports environment variables, `AGY_CMD` can be set there as well.

## Why npx?

`npx` lets MCP clients start the published package without requiring a local repository checkout. The client only needs Node.js and the Antigravity CLI.

To pin a specific version:

```bash
npx -y antigravity-mcp@1.0.1
```

Using `npx -y antigravity-mcp` follows the package version selected by npm's normal package resolution behavior.

## Local Development

```bash
git clone https://github.com/alvarosw/antigravity-mcp.git
cd antigravity-mcp
npm install
npm start
```

No build step is required.

## Tools

### `agy_run`

Run Antigravity as an agent with common CLI controls:

- prompt
- model
- reasoning effort
- sandbox
- permission bypass
- additional directories
- conversation ID
- latest-conversation continuation
- print timeout
- output format
- additional raw arguments
- working directory
- environment variables

Example:

```json
{
  "prompt": "Review the authentication implementation and identify security issues.",
  "cwd": "/workspace/project",
  "model": "gemini-3-flash",
  "effort": "high",
  "addDirs": ["/workspace/shared"],
  "sandbox": true
}
```

### `agy_usage`

Runs Antigravity's `/usage` command in print mode.

### `agy_quota`

Runs Antigravity's `/quota` command in print mode.

### `agy_models`

Lists models available through the installed Antigravity CLI.

### `agy_version`

Returns the installed CLI version.

### `agy_help`

Shows CLI help. A command can be provided for command-specific help.

### `agy_readonly_command`

Runs a read-only slash command through print mode. Examples include:

```text
/usage
/quota
/model
/effort
/skills
/credits
```

The tool does not maintain a fixed command list, so newer read-only commands can be used as long as the installed CLI supports them.

### `agy_raw`

Runs `agy` with an arbitrary argument array. This is the compatibility escape hatch for flags or commands not covered by the convenience tools.

Example:

```json
{
  "args": ["models"]
}
```

## Architecture

```text
src/
├── index.js           # MCP server and tool registration
├── tools.js           # Tool behavior and response formatting
└── antigravity.js     # Thin process adapter for the agy CLI
```

Dependency direction:

```text
MCP transport
    ↓
tool handlers
    ↓
agy CLI adapter
    ↓
local agy executable
```

There is intentionally no service container, repository layer, or framework abstraction. The project has one external process boundary and keeps that boundary explicit.

## Security Notes

`agy_raw` can execute arbitrary Antigravity CLI arguments with the permissions of the user running the MCP server. The server itself does not invoke a shell, so tool arguments are not shell-interpreted, but `agy` still has whatever permissions the user grants it.

Use permission bypass options only when you explicitly trust the task and workspace.

Environment variables passed through the `env` field are inherited by the `agy` process. Avoid sending secrets through MCP tool arguments unless necessary.

## License

MIT
