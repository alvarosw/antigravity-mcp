# Antigravity MCP

A lightweight [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server that exposes the local [Antigravity CLI](https://github.com/google-gemini/gemini-cli) to MCP-compatible coding agents such as Claude Code, Cursor, Gemini CLI, and Windsurf.

The project intentionally keeps the architecture small: MCP tools validate inputs, a thin CLI adapter executes `agy`, and the raw tool provides an escape hatch for CLI options that are added in future Antigravity releases.

## Features

- Run Antigravity as a real local agent from an MCP client.
- Keep conversation context with conversation IDs or the latest conversation.
- Control common CLI options such as model, effort, sandbox, permissions, directories, timeouts, and output format.
- Inspect usage, quota, models, version, and help.
- Execute read-only slash commands supported by the installed CLI.
- Pass arbitrary CLI arguments through `agy_raw` for forward compatibility.
- No shell execution: arguments are passed directly to the `agy` process.

## Requirements

- Node.js 18+
- Antigravity CLI installed and authenticated
- `agy` available on `PATH`
- An MCP-compatible client

Set `AGY_CMD` when the executable is not on `PATH`:

```bash
AGY_CMD=/custom/path/agy
```

On Windows PowerShell:

```powershell
$env:AGY_CMD = "C:\path\to\agy.exe"
```

## Install

Clone the repository and install dependencies:

```bash
git clone https://github.com/alvarosw/antigravity-mcp.git
cd antigravity-mcp
npm install
```

No build step is required.

## Claude Code

### Local checkout

Register the server for your user account:

```bash
claude mcp add --scope user antigravity -- node /absolute/path/to/antigravity-mcp/src/index.js
```

Windows PowerShell:

```powershell
claude mcp add --scope user antigravity -- node C:\path\to\antigravity-mcp\src\index.js
```

Verify the server:

```bash
claude mcp list
```

> The `claude mcp add` command registers an stdio MCP server. The path must point to the local `src/index.js` file.

### Using an environment variable for `agy`

```bash
claude mcp add --scope user --env AGY_CMD=/custom/path/agy antigravity -- node /absolute/path/to/antigravity-mcp/src/index.js
```

PowerShell:

```powershell
claude mcp add --scope user --env AGY_CMD="C:\path\to\agy.exe" antigravity -- node C:\path\to\antigravity-mcp\src\index.js
```

## Cursor

Cursor supports local MCP servers through its MCP configuration. Add the following server entry to your MCP configuration:

```json
{
  "mcpServers": {
    "antigravity": {
      "command": "node",
      "args": [
        "/absolute/path/to/antigravity-mcp/src/index.js"
      ]
    }
  }
}
```

Windows example:

```json
{
  "mcpServers": {
    "antigravity": {
      "command": "node",
      "args": [
        "C:\\path\\to\\antigravity-mcp\\src\\index.js"
      ]
    }
  }
}
```

Restart Cursor after changing the MCP configuration.

## Windsurf

Windsurf supports local stdio MCP servers through its MCP configuration. Add an entry equivalent to:

```json
{
  "mcpServers": {
    "antigravity": {
      "command": "node",
      "args": [
        "/absolute/path/to/antigravity-mcp/src/index.js"
      ]
    }
  }
}
```

If your Windsurf installation uses a different MCP configuration location, use the MCP settings UI and enter the same command and arguments.

## Other MCP Clients

This server uses standard MCP over stdio. Any MCP client that supports local command-based servers can use it with:

```text
Command: node
Arguments: /absolute/path/to/antigravity-mcp/src/index.js
```

The same pattern can be used with other coding agents that support stdio MCP servers.

## Tools

### `agy_run`

Run Antigravity as an agent while exposing common CLI controls:

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

Example payload:

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

Shows CLI help. Pass `command` for command-specific help.

### `agy_readonly_command`

Runs a read-only slash command through print mode. This is useful for commands such as:

```text
/usage
/quota
/model
/effort
/skills
/credits
```

The tool does not try to maintain a fixed list, so newer read-only commands can be used as long as the installed CLI supports them.

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

The dependency direction is intentionally simple:

```text
MCP transport
    ↓
tool handlers
    ↓
agy CLI adapter
    ↓
local agy executable
```

There is no service container, repository layer, or framework abstraction because the project only needs one external process boundary.

## Security Notes

`agy_raw` can execute arbitrary Antigravity CLI arguments with the permissions of the user running the MCP server. The server itself does not invoke a shell, which prevents shell interpolation through tool arguments, but it does not restrict what `agy` is allowed to do.

Use permission bypass options only when you explicitly trust the task and workspace.

Environment variables passed through the `env` field are inherited by the `agy` process. Avoid sending secrets through an MCP client unless necessary.

## Development

Run directly:

```bash
npm start
```

Or:

```bash
node src/index.js
```

The server communicates over stdio, so it is normally launched by the MCP client rather than manually.

## License

MIT
