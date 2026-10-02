# Production Engineering, Evals & Security — Cost & Orchestration — Watch Out

_Module 4, screen S12_

Watch Out
Cost & Orchestration
6 min

## The parallel fan-out that tripled the bill

Setup

You had a task that was running slowly, so you split it across several parallel subagents, reasoning that work done at the same time finishes sooner. The latency dropped a little. Then the bill arrived several times higher than the single-agent version, while the answer quality barely moved.

## Customer quote: "why is my orchestrator-worker setup so expensive?"

A developer posted in an internal channel:

Developer

"My orchestrator-worker setup works, but the bill tripled and the answers are barely better than the single-agent version. What am I paying for?"

A senior developer replied:

Senior developer

"Every subagent consumes its own tokens against its own context window. Anthropic has reported that its own multi-agent research system uses roughly fifteen times the tokens of a normal chat for exactly that reason. That multiplier is worthwhile when the task decomposes into independent parts that can be explored in parallel, like research across separate sources. Your task does not split that way. Each step depends on the last, so the subagents are mostly waiting on each other. In this case, you are paying the fan-out cost without getting the parallel benefit. Switch to a single agent with good context and the cost drops to what the work actually needs."

The developer moved the task back to a single agent, kept the same context, and the bill fell while the answer quality held. The lesson was not that orchestration is bad. It was that the token multiplier only buys something when the work can genuinely be performed in parallel.

Why this broke

Parallel fan-out was used on a task that did not decompose into independent parts, so every subagent multiplied token cost without adding parallel value. Use orchestrator-worker only when the task needs parallel exploration.
