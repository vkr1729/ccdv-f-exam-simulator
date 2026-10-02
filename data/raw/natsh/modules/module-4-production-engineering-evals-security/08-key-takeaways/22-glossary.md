# Production Engineering, Evals & Security — Key Takeaways — Glossary

_Module 4, screen S19B_

GlossaryKey Terms·3 min

# Key terms from this module

Alphabetical. Click a term to expand its definition.

Agentic search

Letting the model issue its own queries, read the results, and refine across several rounds instead of fetching a fixed set of context once. It handles multi-step questions and changing corpora at higher token and latency cost and avoids the staleness and infrastructure of a maintained index.

Eval

A set of input cases, expected behaviors, and grades that defines what a feature must do before it ships. Running an eval produces a score on a holdout set, which turns "done" from a judgment call into a number you can track as you change the prompt, tools, or model.

Exponential backoff

A retry strategy that waits a growing interval between attempts, up to a cap and a fixed number of tries, often with random jitter. It prevents immediate retries from deepening a rate limit, and it honors a retry-after value when the response provides one.

Hook-based guardrail

A check that runs at a fixed point in the Claude Code agent lifecycle, such as PreToolUse before a tool call, and can block an action and log it. Unlike a prompt instruction, a hook is an enforced control that runs before the protected action, which is the distinction a regulated review cares about.

Integration test

A test that exercises the seam where two components hand off, such as retrieval output passed into a model call. It catches the silent failures that unit and functional tests miss, because each component can pass alone while the handoff between them is wrong.

LLM-as-judge

A grading method that uses a second model call with a rubric to score open-ended outputs that no code rule can check. It returns a score with reasoning, and it is only trustworthy after you calibrate it against human-labeled cases and measure agreement.

Orchestrator-worker pattern

A multi-agent shape where a lead agent plans a task, spawns subagents that work in parallel each with its own context and compiles their results. It helps on broad tasks that split into independent parts, at roughly fifteen times the token cost of a single chat in Anthropic's reported case.

Prompt injection

An attack where instructions hidden inside content the agent fetches are treated as commands, because the model reads its whole context as one stream with no built-in boundary between trusted instructions and untrusted data. The defense is to treat fetched content as data and enforce the action boundary outside the prompt.

Retriable versus terminal error

The first distinction for any production failure. A retriable error, such as a rate limit or overload, is likely to succeed on a later attempt and gets backoff. A terminal error, such as a bad request, will fail again identically and should fail fast instead of wasting the retry budget.
