# Production-Grade Prompting, Agents & Tool Use — Agent Memory — Watch Out

_Module 2, screen S20_

Watch OutAgent Memory·2 min

## The agent that filled the window on session four

Setup

The agent runs perfectly in development because you are running it in one long continuous session. The context window never fills, so in-context memory holds everything. But now, production runs multiple shorter sessions with more turns across more days, and the window fills at session four.

### Postmortem: In-context state inflates until the window closes

An agent was built to assist a support engineer with ongoing escalation cases. Development ran continuous sessions of 10 to 15 turns. In-context state held the full history correctly. The developer shipped without measuring token usage per session.

In production, each session was shorter, but the state accumulated across sessions. By session four, the injected in-context history exceeded 40,000 tokens before the agent had processed a single tool call. Combined with the system prompt and registered tool schemas, over 45,000 tokens of the context budget were consumed before the session's first productive turn. As tool calls accumulated across the session, the remaining budget was exhausted before the agent could complete its analysis. The agent began returning incomplete results, a symptom that initially looked like a tool selection failure rather than a memory architecture problem.

The fix was a one-hour refactor to external storage: pull accumulated session history out of the live context, persist it to a database, and inject only the relevant subset at session start. The refactor under production pressure took significantly longer than it would have at design time. The storage layer, retrieval logic, and session management all needed decisions that should have been made before the first deployment.

What to Watch Out for

Development used a single long session. Production used many short sessions with accumulated state. Those are different shapes, and in-context memory handles them differently. Measure the expected state size per session (history plus system prompt plus tool schemas) against the context limit before choosing in-context as the default.
