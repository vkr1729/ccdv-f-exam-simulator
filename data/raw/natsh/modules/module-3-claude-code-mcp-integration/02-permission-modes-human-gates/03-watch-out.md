# Claude Code, MCP & Integration — Permission Modes & Human Gates — Watch Out

_Module 3, screen S03_

Watch OutPermission Modes & Human Gates·3 min

## The bypass mode that removed the one prompt that mattered

Setup

You switched to bypass Permissions to stop the constant prompts because the work felt routine. The agent had been well-behaved for days, the cleanup task was simple, and the prompt-before-every-tool-call behavior felt like unnecessary friction.

## The transcript

The following pairing session happened on a codebase cleanup that had been running without incident for three days.

Dev: "All right, I’m switching to bypassPermissions for this one. It’s just renaming old API endpoint references. Nothing risky."
Claude Code: [Scanning files matching pattern /v1/legacy/ ... 47 files found]
Claude Code: [Updating endpoint references ...]
Claude Code: [Running post-rename cleanup.sh script ...]
Claude Code: [Deleted 3 files matching /v1/legacy/ in /deploy/config/prod/ ...]
Dev: "Wait. What was in /deploy/config/prod/?"
Claude Code: [Files contained environment-specific endpoint overrides for the production deployment. They have been removed.]
Dev: "That directory wasn’t supposed to be in scope. I was working on /src/."
Claude Code: [The pattern /v1/legacy/ matched files in both /src/ and /deploy/config/prod/. In bypassPermissions mode, no confirmation was requested before the deletions.]

The prompt that would have caught this mistake was turned off when bypassPermissions was turned on. In default or acceptEdits mode, the cleanup script would not have run without a confirmation, and the user could have stopped the deletion before it reached the production configuration files. In bypassPermissions, the pattern match was broader than intended, and no prompt stood between the script and the files it deleted.

Note the precise location of the gate: it was the script invocation that would have prompted, not `rm` deletion commands by themselves. acceptEdits auto-approves common filesystem commands, including `rm` on paths inside the working directory. Had Claude issued the deletions directly as `rm` commands, acceptEdits would have let them through silently; only default mode prompts for those.

What to Watch Out for

A bypass mode silences all confirmation prompts, including the ones you might not have anticipated. The failure pattern here is an agent matching a broader set of files than you intended, running in a mode without checkpoints. BypassPermissions also skips the protected path guard that the other modes keep, so even repo state and Claude’s own configuration lose their automatic prompt. To cover this gap, you must set a deny rule on sensitive directories before switching modes. If you want fewer prompts without losing the safety net, use a classifier-gated mode (e.g., auto) instead of a full bypass.
