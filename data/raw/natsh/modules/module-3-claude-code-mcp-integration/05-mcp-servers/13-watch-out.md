# Claude Code, MCP & Integration — MCP Servers — Watch Out

_Module 3, screen S13_

Watch OutMCP Servers·4 min

## The API key that traveled with the configuration file into the repository

Setup

The server was working, the team needed a shared setup, and cleaning up the authentication method felt like something you could do after the handoff. That shortcut turned a temporary hardcoded API key into a shared credential exposure the moment the configuration file was committed.

## What happened

A developer connected to a data warehouse MCP server using a service account API key. To get the server working quickly during setup, the key was placed directly in the `.mcp.json` configuration file. The plan was to move it to an environment variable before sharing the setup with the team.

The developer committed the `.mcp.json` to the project repository so teammates could connect to the same server by cloning the repo, and the key committed along with it. Within 48 hours, three teammates had cloned the repository, and a CI pipeline had triggered a fresh clone. The key was now in four places: the local machine, the repository history, the three teammate machines, and the CI runner’s file system.

After realizing this, the developer moved the key to an environment variable, updated the `.mcp.json`, and committed the corrected file. But the key was still in the commit history, and the service account had to be rotated. The rotation broke two external services that had been configured with the same key, and this took three hours of work to fix.

The corrected `.mcp.json` uses an environment variable reference instead of an inline value:

Before (do not use)

{
"type": "http",
"url": "https://warehouse.internal/mcp",
"headers": {
"Authorization": "Bearer sk-abc123..." .............inline credential
}
}

After (correct)

{
"type": "http",
"url": "https://warehouse.internal/mcp",
"headers": {
"Authorization": "Bearer ${WAREHOUSE_MCP_TOKEN}" ............env variable reference
}
}

What to Watch Out for

API keys committed to a configuration file are committed to repository history. Overwriting the file in a later commit does not remove the key from history; it only removes it from the current version. Any credential written inline in a committed file must be treated as compromised and rotated. The correct pattern is to put the value in an environment variable and reference the variable in the configuration file.

To prevent the agent from writing credential values directly to committed files, use two layers. First, add a convention instruction to CLAUDE.md stating that credential values must never be written inline to .mcp.json. This signals the rule to the model during each session. Second, back that instruction with a PreToolUse hook that inspects write and edit operations against .mcp.json for patterns that look like inline credential values and exits with code to block the operation if one is detected. The CLAUDE.md instruction communicates the intent; the hook enforces it deterministically regardless of what the model decides to do. This is the same hook-versus-instruction distinction covered in the durable project context section: an instruction in CLAUDE.md can be followed inconsistently when the file grows or context shifts, and a hook fires at every relevant tool call without exception.
