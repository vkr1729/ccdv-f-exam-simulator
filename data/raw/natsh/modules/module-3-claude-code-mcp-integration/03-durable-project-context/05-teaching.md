# Claude Code, MCP & Integration — Durable Project Context — Teaching

_Module 3, screen S05_

TeachingDurable Project Context·20 min

# Durable project context with CLAUDE.md, rules files, hooks, and subagents

Previously we saw how Claude Code gates actions through permission modes and settings files. That configuration layer controls what the agent is allowed to do.

This cluster builds on top of it: now you’ll learn how to configure what the agent knows and how it behaves, so the rules and project context you define in a session are still in effect at the start of the next one.

## CLAUDE.md: the project file that loads into every session

Every time Claude Code starts in a project directory, it looks for a file named CLAUDE.md at the root and reads it. The contents are appended to your prompt before any message from you arrives. This means every convention, constraint, and command you put in CLAUDE.md is present from the first prompt of every session, without you having to re-state it.

The `/init` command scans your codebase and generates a starter CLAUDE.md. The generated file is a great baseline but should be validated before using. Refine it to hold the rules that control the outcome of your prompts: your testing commands, your framework conventions, the paths the agent should not touch, and the style decisions that differ from defaults.

Size is the main failure mode. A CLAUDE.md that keeps growing with every new instruction can dilute the rules that matter most. A larger file consumes more of the context window, which makes any single instruction a smaller fraction of what loads, and that reduces the chance that the agent follows the one rule that catches a real mistake. Hold CLAUDE.md to the constraints that change behavior and move everything else into Skills that load on demand.

## Rules instruction files: scoping guidance to where it applies

In the previous section, we established that CLAUDE.md loads into every session and should hold the instructions that apply across the whole project. The next question is what to do with guidance that matters only in one part of the codebase. That is where rules instruction files come in: they let you apply instructions only where they are relevant, instead of loading them into every session.

CLAUDE.md is always on, and rules files add a narrower layer on top of that baseline. They live in the project’s `.claude/rules/` directory and can be scoped to specific paths using a `paths` glob in their YAML frontmatter. A rule scoped this way loads into context only when Claude Code works with files matching the pattern, this allows a rule to be applied to one part of the codebase without cluttering the rest of the context.

Note that the scoping comes from the frontmatter, not from file placement. Rules files can be organized into subdirectories of `.claude/rules/` (e.g., `.claude/rules/database/`), but that structure is organizational only; a rules file without a `paths` field loads unconditionally at launch, with the same priority as CLAUDE.md, no matter where it sits inside `.claude/rules/`.

In practice, put broad project memory and universal constraints in CLAUDE.md, and put narrow, path-specific guidance in rules files scoped with `paths`. A constraint like “never modify the database schema” lives in CLAUDE.md because it applies everywhere. A constraint like “all SQL in the database module must include an explicit transaction boundary” lives in `.claude/rules/database.md` with frontmatter such as:

---
paths:
- "src/db/**/*.sql"
---

so it enters context only when Claude is working with those files.

## Hooks: running your own scripts at fixed points in the lifecycle

A Hook allows you to intercept and control tool calls before or after they execute. When you write a specific rule in CLAUDE.md telling the agent to run Prettier after every file edited, the agent will follow it most of the time. Alternatively, a hook makes it happen every single time without exceptions because the hook fires independently of what the model decides to do.

Hooks are defined in settings files and configured using the `/hooks` command. Each hook is bound to a lifecycle event, an optional matcher that scopes it to specific tool types, and a command that runs when the event fires. The core events for most guardrail and automation use cases are:

- PreToolUse: Runs before a tool call executes. Because it runs first, a PreToolUse hook can examine the tool call and exit with code 2 to block it, writing the reason to stderr as feedback the agent sees. This is how you enforce access controls at the configuration layer rather than hoping the agent respects a CLAUDE.md instruction.

- PostToolUse: Runs after a tool call completes. Since the call has already happened, this event cannot block it, which makes it the right place for automated side effects: running a code formatter after an edit, triggering tests after a file change, or logging the operation for an audit trail.

- UserPromptSubmit: Runs when you submit a prompt, before the model processes it. Use it when you need to inject context or validate the request before any work starts.

- Stop: Runs when the model finishes responding. Use it for follow-up actions that belong at the end of a turn, such as notifications, cleanup tasks, or committing the audit log.

- Notification: Runs when Claude Code sends a notification, which occurs when Claude needs permission to use a tool or after Claude Code has been idle for 60 seconds. Use it to route those signals to an external channel or logging system.

- SessionStart: Runs when a session starts or resumes. Use it to initialize state, validate environment variables, or confirm required services are reachable before the agent begins work.

- SessionEnd: Runs when a session ends. Use it for teardown tasks, final audit writes, or notifications that the session has closed.

A hook that blocks edits to a production configuration path using a PreToolUse event enforces that constraint at every tool call during every session, regardless of permission mode. That is the difference between a guardrail and a convention.

## Subagents: delegating work to an isolated context

A subagent is a specialized assistant that Claude Code can delegate tasks to, and each assistant runs a task in its own separate context and returns only its output. It does not inherit your main conversation history, the files you have accumulated in context, or your current session state. When you send a task to a subagent, it starts from a clean slate, does the work, and hands back the result.

The built-in subagents differ in what they load at startup; this difference determines how your project rules apply. Always check the current list in the Claude Code docs, because the set has grown over time, but know that the specific split that affects your project rules holds across versions. The Explore and Plan built-in subagents skip CLAUDE.md and git status to keep research fast and cheap. They are optimized for speed, so project-level rules and repository state defined in CLAUDE.md are not in their context when they run. The general-purpose subagent loads both. If you delegate a task to Explore or Plan and a rule from your CLAUDE.md applies, it’s because that context was not loaded. For tasks where your project constraints must be respected, use the general-purpose subagent or a custom subagent that explicitly loads the rules it needs.

Custom subagents also do not automatically see your skills. If you define a custom subagent in `.claude/agents` and it needs a specific skill, you must explicitly list that skill in the agent’s front matter. Built-in agents do not have preloaded skills. If a built-in agent needs skill-backed behavior, the correct path is to create a custom subagent with those skills listed in its configuration.

The map below names each mechanism, what it loads, when it runs, its context cost, and what belongs in it. Use it to decide which mechanism carries a specific piece of project knowledge, since each one makes a different tradeoff between how much context it costs and how reliably it applies. Flip each card for the full picture.

Mechanism

#### CLAUDE.md
Flip ↻

What it loads: Full file contents prepended to context at session start.

When it runs: Every session, unconditionally.

Context cost: Persistent per session. Dilutes with size.

Belongs here: Universal project constraints, commands, and framework decisions.

Mechanism

#### Rules file
Flip ↻

What it loads: File contents. Scoped via a `paths` glob in YAML frontmatter; without `paths`, loads like CLAUDE.md.

When it runs: When Claude reads a file matching the rule’s paths patterns. Unscoped rules load at session start.

Context cost: Path-scoped: adds to context only when triggered. Unscoped: same persistent cost as CLAUDE.md.

Belongs here: Path-specific guidance that would be noise everywhere else.

Mechanism

#### Hook
Flip ↻

What it loads: Run your script at the lifecycle event. No content added to context.

When it runs: At the configured event (PreToolUse, PostToolUse, etc.).

Context cost: Minimal: only the script output if routed back to Claude.

Belongs here: Enforced guardrails, automated side effects, audit logging.

Mechanism

#### Subagent
Flip ↻

What it loads: Task context only. Isolated from the main session.

When it runs: When dispatched by the main session for a delegated task.

Context cost: Returns a summary, not the full task history.

Belongs here: Exploration, investigation, and tasks whose output would otherwise bloat the main context. Also useful for tasks that can be broken down and parallelized.

Handles well
Projects you’ll return to across many sessions, where a stable set of rules, per-directory variation, or unconditional guardrails repays the setup.

Use a different approach
One-off tasks you won’t revisit. For a quick exploration of an unfamiliar codebase, the setup overhead isn’t warranted.
