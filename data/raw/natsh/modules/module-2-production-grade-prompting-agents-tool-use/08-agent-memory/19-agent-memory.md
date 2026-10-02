# Production-Grade Prompting, Agents & Tool Use — Agent Memory — Agent Memory

_Module 2, screen S19_

TeachingAgent Memory·8 min

# Choosing the right scope for state that survives sessions

The agent from the previous section runs correctly within a single session. What it cannot do is remember anything when that session ends. Memory scope is how you decide what the agent should know at the start of the next session, and how much it costs to carry that knowledge forward.

## Memory patterns and when each is right

Beyond memory scope, the blueprint groups several agent design patterns under this objective, and you have already built each one earlier in this module. The tool-use loop, where the model calls a tool, reads the result, and continues, is the core pattern from the tool-use and agent-construction clusters. Multi-step task decomposition breaks a goal into ordered subtasks, and planning-and-execution separates deciding the plan from carrying it out, the same split the human-in-the-loop check after a planning step guards. Memory scope, covered next, is the pattern that decides what state survives once the loop ends.

Memory scope sets what an agent knows when a new session starts. Making the wrong choice has two failure modes, and they pull in opposite directions:

- Too much state in-context inflates every API call, because the model re-reads the full conversation on every turn and the bill scales with session length.

- Too little state in-persistent storage strips the agent of memory across sessions, because anything not written down disappears the moment the conversation ends.

| Scope | What persists | Cost | When to use | What you lose

| In-context memory | State lives in the active conversation and survives turns within a single session. | Zero retrieval overhead; inflates token cost as conversation grows | Short sessions where all the state the agent needs fits inside the context window and nothing has to carry across restarts. | Everything once the session ends. A clear command or a new session wipes the state.

| External storage | State is written to a database and read back at session start or on demand. | Each database call adds retrieval latency, and you take on the engineering work of read and write logic. | State that has to survive across sessions, move between users, or be shared across multiple agent instances. | Nothing on the persistence side. The cost shows up as latency on every call and ongoing implementation complexity.

| Summarized memory | A condensed version of prior conversation is generated and injected at the start of the next session. | Lower token cost per session than replaying full history, but the summarization step drops detail that was in the original. | Long-running conversational agents where the full history would outgrow the context budget before the conversation is done. | Any detail the summarizer did not preserve. The agent only sees what the summarization prompt chose to keep.

| No persistent memory (stateless) | Nothing. Each session is independent. | No overhead at all, since there is nothing to retrieve or store. | Task-execution agents that finish and close out, or pipelines where every session is fully independent by design. | All prior context. If a follow-up depends on something from an earlier session, the agent has no way to reach it.

## Choosing a memory scope at agent design time

The choice of how an agent remembers prior interactions belongs in the design phase, not the production refactor. An agent that helps the same user across multiple days needs to carry state between sessions, which means storing summaries or full history outside the model's context window so the next session can read them back. An agent that receives a single job, completes it, and closes it out has no prior session to recall, so it runs stateless.

The default path looks reasonable at first. You store the full conversation history in the messages array, send it on every API call, and the prototype works. It keeps working for a while. The trouble starts further in, when token cost scales with every additional turn, latency climbs as the context window fills, and eventually a long session hits the hard limit and the agent stops responding. At that point, you need to refactor: pull conversation state out of the live context, put it in external storage, and add only what each turn needs. The refactor itself is mechanical, a few hundred lines of code and a database the team already has. What it costs is timing. The work happens under production pressure, usually with a deadline already in motion, and every hour spent restructuring memory is an hour not spent on whatever the agent is supposed to do next. Making the call during design phase is cheap, while doing it when it's time to refactor is more expensive.

The content below outlines three memory approaches and the conditions where each fits, the overhead each carries, and the assumption that most often pushes teams toward the wrong choice.

Handles well
The memory scope matches the task at design time. Use external storage when the agent continues a thread across sessions. Use stateless when each job is self-contained. Use in-context when the session is short and does not need to survive a restart.

Adds cost or complexity
External storage adds retrieval latency and the read/write logic that goes with it. Summarized memory depends on a well-specified summarizer prompt; without one, task-critical state gets dropped on every compression. Neither approach is free, so weigh the costs and choose wisely.

Use a different approach
Holding all state in-context on the assumption that the window will be large enough. Token cost grows with every additional turn because the full context is sent on each API call. Without caching or compaction, long sessions accumulate cost faster than teams expect when they only measure early turns. Measure actual session token usage against the window limit before committing.

## Skills: reusable instruction sets that load on demand without inflating every session

The memory scope table above covers how an agent carries state across sessions. There is a related but distinct problem: how you carry repeatable instructions across tasks without paying to inject them into every session. The pattern for that is a Skill, a reusable markdown file that teaches Claude how to handle a specific kind of task once. Claude loads the Skill automatically when a request matches its description. The instructions sit on disk until they are needed; they are not resident in every conversation.

A Skill lives in a `SKILL.md` file inside an identified directory. The file has two parts: a frontmatter block with a name and a description, and the instructions below it. The description is the matching criterion. When you send a request, Claude reads the name and description of every available Skill, compares them against your message, and loads the full instructions only when there is a match. If the instructions are not relevant to the current request, they never enter the context window.

This is the key contrast with the memory patterns in the table above. In-context memory is always present and grows with every turn. CLAUDE.md behavior depends on where you are running Claude Code. In the Claude Code CLI, a CLAUDE.md file loads into every session regardless of what task is running. In the Agent SDK, whether filesystem settings including CLAUDE.md load is controlled by the settingSources configuration. Do not rely on a default: set it explicitly to the sources you intend, and confirm current default behavior against the Agent SDK reference at build time. A Skill, by contrast, loads only when the task calls for it, in both environments. For instruction sets that apply to specific recurring tasks rather than to every session, Skills are a lower-overhead pattern than either alternative.

### Skills vs. CLAUDE.md vs. in-context instructions: choosing the right pattern

| Pattern | When it loads | Context cost | Best for

| Skill (SKILL.md) | On demand when request matches skill's description | Low. Only the name and description load at startup; full content loads only on match | Task-specific expertise that should not inflate sessions where it is not needed. Examples include domain-specific output formats, specialized review checklists, and workflows that apply to a subset of tasks rather than every interaction.

| CLAUDE.md | Every session, unconditionally | Fixed overhead per session regardless of task | Always-on project standards that apply to everything. Examples include coding conventions the team has standardized on, output format rules the project requires, and constraints that hold across all tasks in the codebase.

| In-context instructions | Present for every turn within that session | Grows with session length; does not survive session end | Short sessions where the full history fits within the window and nothing needs to persist. Examples include one-off exploratory work and tasks scoped to a single conversation.

### Current availability: Skills on the Messages API

Skills are available on the Messages API today, but the integration is in beta and the configuration is not the same as the Claude Code or Agent SDK paths. Two beta headers are required on the API request: `code-execution-2025-08-25` and `skills-2025-10-02`. Skills invoked this way run inside the code execution container rather than in the calling application's environment, which has implications for what tools and filesystem access the Skill can rely on.

Beta headers are versioned and change as features move toward general availability. Before building against this configuration in production, check the current Anthropic API documentation to confirm the header values, whether the feature has reached general availability, and whether the code execution container is still the runtime path.

One important constraint: subagents do not automatically inherit Skills from the parent session. When you delegate a task to a subagent, it starts with a clean context. Note that while Skills and conversation history do not carry over, subagents do inherit the permission context from the parent session; permission scope is not reset at delegation. If the subagent needs a Skill, you must explicitly list it in the subagent's configuration. This matters at agent design time: if you are wiring a subagent to perform a task that depends on specific instructions, those instructions need to be registered against the subagent, not assumed to carry over from the parent.
