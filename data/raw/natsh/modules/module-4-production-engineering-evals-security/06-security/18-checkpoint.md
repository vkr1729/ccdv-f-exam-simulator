# Production Engineering, Evals & Security — Security — Checkpoint

_Module 4, screen S16_

CheckpointSecurity·10 min

# Assemble the minimal secure configuration for a fetch-and-write agent

The scenario is an agent that fetches untrusted web content and writes to a single protected path while acting under a scoped identity. Assemble the minimal configuration for this agent. Write the four controls it must include and explain in one sentence what each one enforces. Leave out anything that does not belong.

Piece 1 · hook on a lifecycle event

on: PreToolUse # runs before the tool executes
if tool == "write_file" and not path.startswith("/workspace/output"):
deny("write outside permitted path") # returns permissionDecision: "deny"

Piece 2 · deny rule

deny_paths: ["/etc", "/secrets", "~/.aws"] # explicit filesystem denies

Piece 3 · secret reference

api_key: os.environ["SERVICE_API_KEY"] # not committed config

Piece 4 · audit-log line

log_audit(action, path, result) # on every privileged action

Compare with model answer
Skip for now
