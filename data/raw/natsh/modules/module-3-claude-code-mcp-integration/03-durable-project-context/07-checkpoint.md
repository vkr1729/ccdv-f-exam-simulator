# Claude Code, MCP & Integration — Durable Project Context — Checkpoint

_Module 3, screen S07_

CheckpointDurable Project Context·3 min

# Checkpoint 2: drag the correct value

Try it now. You are setting up a hook that enforces a path restriction, and the configuration below has two blanks.

Select the correct one: the lifecycle event that runs before a tool call executes, and the command the hook runs to block reads of `.env.production`.

{
"hooks": {
"________": [
{
"matcher": "Read",
"hooks": [{ "type": "command", "command": "________" }]
}
]
}
}

Blank 1: the lifecycle event

PreToolUse

PostToolUse

UserPromptSubmit

SessionStart

Blank 2: the command

A script that reads the tool call from stdin, checks the file path, and exits with code 2 when the path is .env.production (writing the reason to stderr).

A script that logs the tool call to an audit file and exits 0.

A script that prints a warning and exits 0 unconditionally.

Submit
Skip for now
