# Claude Code, MCP & Integration — Permission Modes & Human Gates — Checkpoint

_Module 3, screen S04_

CheckpointPermission Modes & Human Gates·4 min

# Checkpoint 1: assemble the settings file and place the human gate

Try it now. You are configuring Claude Code for a trusted local refactor of the payments module.

The refactor should auto-approve file edits but must never run destructive shell commands, and the file `.env.production` must never be readable by the agent. Below are settings.json pieces.

## Part 1: Select the setting.json pieces that assemble the correct configuration

Select two pieces.

✓
Piece A. `{ "permissions": { "defaultMode": "default"} }`

✓
Piece B. `{ "permissions": { "defaultMode": "bypassPermissions" } }`

✓
Piece C. `{ "permissions": { "allow": ["Bash(npm run:*)"], "deny": ["Bash(rm:*)", "Bash(git push:*)"] } }`

✓
Piece D. `{ "permissions": { "deny": ["Read(.env.production)"] } }`

✓
Piece E. `{ "permissions": { "allow": ["Bash(*)", "Edit(*)"] } }`

## Part 2

Your settings allow the agent to edit files automatically. During the refactor the agent proposes a change to a deployment configuration file that several production services read. Where should a human gate sit for that one action? Choose the single best answer.

aNowhere: the settings already auto-approve edits, so let it run.

bA human reviews and approves the change to the deployment configuration file before the write executes, because a wrong value there is hard to undo and reaches systems outside the file.

cAdd bypassPermissions so the agent never pauses.

dReview the change only after the write, during the next pull request.

Submit
Skip for now
