# Claude Code, MCP & Integration — Packaging Workflows — Checkpoint

_Module 3, screen S11_

CheckpointPackaging Workflows·4 min

# Checkpoint 4: fix the broken plugin definition

Try it now. The following SKILL.md works on the author’s machine but will fail when a teammate clones the project and installs the plugin.

Select the single defect, then select the correct fix.

---
name: deploy-validate
description: Validates a deployment configuration before release.
---
## Steps
1. Run the validation script: /Users/alexmorgan/projects/deploy-utils/validate.sh absolute path
2. If the script exits with a non-zero code, report the error to the developer.
3. If validation passes, confirm the deployment configuration is safe to proceed.

Part 1 · Which is the defect?

AThe skill name does not match the plugin name.

BThe description is too short for the model to match.

CThe absolute path /Users/alexmorgan/projects/deploy-utils/validate.sh in step 1.

DStep 2 should report to the user, not the developer.

Part 2 · Which is the correct fix?

AReference the script from the project root using CLAUDE_PROJECT_DIR, so it resolves no matter where the project is cloned.

BReplace the path with another absolute path that points to a shared network drive.

CReplace the path with a home-directory shortcut: ~/projects/deploy-utils/validate.sh.

DRemove step 1 so the skill no longer calls an external script.

Submit
Skip for now
