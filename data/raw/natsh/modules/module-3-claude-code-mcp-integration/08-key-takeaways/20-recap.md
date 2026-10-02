# Claude Code, MCP & Integration — Key Takeaways — Recap

_Module 3, screen S20_

RecapKey Takeaways·6 min

# Seven key takeaways

One takeaway per section, tying the module together.

1

#### Permission mode is a risk decision, not a speed decision.

Claude Code gives you modes ranging from prompt-before-everything to prompt-for-nothing. Permission mode should match the risk profile of the work and environment, not the preference for fewer prompts. A bypass mode on a developer workstation against a live codebase removes every checkpoint between the agent and your files. A deny rule on the path that must not be touched, set at the project or enterprise level, covers the gap that a mode alone does not.

2

#### An AI code review gives you a set of findings to triage, not a verdict to apply.

Trust the findings the reviewer can prove from the diff in front of it, like a missing null check or an unclosed resource, and confirm them on the lines it cites. Treat any claim about runtime behavior or another system as a hypothesis to test, because the reviewer made that claim without the evidence that would prove it. Put the human gate at the point where a finding turns into an action that’s hard to reverse and raise the reviewer’s accuracy by giving it the conventions it would otherwise have to guess at.

3

#### A skill is portable, but “runs everywhere” is something you design for.

The same SKILL.md can run in Claude Code, on the Messages API, and through the Agent SDK, but each one loads and sandboxes it differently: filesystem discovery in Claude Code, beta headers and a code execution container on the API, and settingSources on the SDK. A skill scoped to a clear description and free of local-environment assumptions ports cleanly; one that assumes the terminal it was written in does not. In every runtime, subagents start clean: they do not automatically preload skills.

4

#### Durable context requires the right mechanism for each concern.

CLAUDE.md is the session-persistent project memory, but it dilutes with size. Rules files scope guidance to where it applies. Hooks enforce guardrails deterministically, not probabilistically. Subagents keep exploration work out of the main context. These four mechanisms each solve a different problem, so forcing all of them into CLAUDE.md produces a single file that is harder to maintain and easier to ignore.

5

#### A shareable setup requires portable components.

A plugin that references an absolute path to the author’s home directory will install on one machine and fail on all others. Skills, hooks, and plugin components that will be shared must reference paths relative to the project root, and any environment variable requirement must be documented or validated at install time. Test the install from a clean machine before distributing.

6

#### Transport and scope are independent decisions with dependent consequences.

stdio is for servers that run on your machine. HTTP is for anything hosted remotely or accessed by multiple developers. Local scope keeps a server personal; project scope shares it with the repo via .mcp.json. The combination must match the deployment intent: a shared team server requires HTTP transport and project or enterprise scope. A stdio server in .mcp.json is a configuration that looks shareable but is not.

7

#### Enterprise integration requires identifying the security requirements before deployment.

A regulated customer asks about identity, data residency, access logging, and configuration control. The answers come from OAuth for user-identity services, environment variables for service credentials, PostToolUse hooks for audit logging, and enterprise managed settings for configuration lock. None of these is hard to implement, but all of them are hard to retrofit after a production deployment has failed a security review.

What comes next

Module 4 covers production engineering, evaluations, and security: how to measure whether your Claude Code integrations work correctly at scale, how to build eval harnesses, and how to design production-grade safety guardrails. The permission modes, hooks, and authentication patterns from this module are the foundation those evaluations test against.

## Sources

- Claude 101 (Skilljar)

- Claude Code 101 In Action (Skilljar)

- Building with the Claude API (Skilljar)

- code.claude.com

- platform.claude.com

- docs.claude.com

## You can now run Claude Code safely, share it as a team asset, and connect it to real systems.

From permission modes to enterprise authentication, you now hold the configuration decisions that keep an integration working long after it leaves your machine.
