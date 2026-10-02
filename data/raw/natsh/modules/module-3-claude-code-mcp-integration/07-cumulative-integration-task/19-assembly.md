# Claude Code, MCP & Integration — Cumulative Integration Task — Assembly

_Module 3, screen S19_

CumulativeCumulative Integration Task·6 min

# Cumulative integration task: assembly

Now write the corrected version of all three files.

Produce the complete corrected content for settings.json, SKILL.md, and .mcp.json.

Reveal model answer
Skip for now

Model answer

File 1: settings.json (corrected)

{ "permissions": { "defaultMode": "acceptEdits", "deny": ["Read(.env.production)"] } }

File 2: SKILL.md (corrected)

---
name: migration-validate
description: Validates migration scripts before they run against production.
---
## Steps
1. Run: $CLAUDE_PROJECT_DIR/scripts/validate-migration.sh
2. Report validation results.

File 3: .mcp.json (corrected)

{
"mcpServers": {
"data-warehouse": {
"type": "http",
"url": "https://warehouse.internal/mcp",
"headers": {
"Authorization": "Bearer ${WAREHOUSE_MCP_TOKEN}"
}
}
}
}

settings.json sets `defaultMode` to `acceptEdits` inside `permissions`; auto-approves file edits and common filesystem commands but gates destructive shell commands, the right tradeoff for a production migration workstation. The skill uses `$CLAUDE_PROJECT_DIR` so the path resolves from the project root on any machine after cloning. The MCP configuration references the credential as an environment variable so it is never committed to repository history.

How did your assembly compare?

Correct assembly
Missing permission fix
Missing path fix
Missing secret fix
