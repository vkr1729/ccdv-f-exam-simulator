# Claude Code, MCP & Integration — Durable Project Context — Watch Out

_Module 3, screen S06_

Watch OutDurable Project Context·4 min

## The CLAUDE.md that kept growing until the rules stopped landing

Setup

Your CLAUDE.md kept growing because every new rule felt worth adding. Each addition was individually reasonable, and the file seemed to be the right place for each rule. But over a few weeks, the file grew to over 800 lines.

## The trace

The following is a session log excerpt from a project with a CLAUDE.md that accumulated over two months of team additions.

Session context window loaded:
CLAUDE.md: 847 lines
Contents include: framework preferences (lines 1–40), testing conventions (lines 41–90), style guide (lines 91–210), dependency rules (lines 211–320), path restrictions (lines 321–360), historical decisions log (lines 361–700), archived notes (lines 701–847)
User prompt: "Refactor the auth module to use the new token service. Do not modify the /legacy/tokens/ directory."
Claude Code action: [Reading auth module ...]
Claude Code action: [Editing auth/service.ts ...]
Claude Code action: [Reading /legacy/tokens/store.ts for reference ...]
Claude Code action: [Editing /legacy/tokens/store.ts to update token interface ...]
Path restriction from CLAUDE.md (line 347): "Do not modify files in /legacy/tokens/."
User: "You just edited /legacy/tokens/store.ts. I said not to touch that directory."
Claude Code: "I apologize. The /legacy/tokens/ restriction is in the project instructions. The edit was made in the course of updating the token interface. I did not flag the conflict before proceeding."

The rule was in the file; the agent had access to it. However, the failure was dilution: 846 other lines reduced the effective weight of the one instruction that mattered. The historical decisions log and archived notes should have been noted somewhere, but they did not belong in the CLAUDE.md.

What to Watch Out for

CLAUDE.md is a working set of rules that change behavior for the current session, not a growing append log. Every line you add reduces the weight of every other line. If a rule is path-specific, it belongs in a rules file. If a rule is historical context, it belongs in a separate reference document the agent reads on demand. When your CLAUDE.md grows past a few hundred lines, audit it: identify which rules are truly session-critical and move the rest. The one rule you cannot afford to dilute should be the shortest path to a hook.
