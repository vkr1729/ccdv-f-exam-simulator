# Production Engineering, Evals & Security — Key Takeaways — Recap

_Module 4, screen S19_

RecapModule 4·3 min

# Key takeaways

1

#### Set the standard before you build it.

An eval turns "done" from a feeling into a score on a fixed set of cases. The grading method must match the output: exact match when there is one correct form, a code check for structured output, and a judge for open-ended quality, which you calibrate against human-labelled cases before you trust it. You write the eval first because identifying the expected behavior forces you to define success while the design can still change.

2

#### Match the test to the failure, and trace so you know where it happened.

Unit, functional, integration, and end-to-end tests each catch a different break, and most silent failures hide at the integration seam where two passing components hand off. A trace shows which step produced the bad result, which turns a day of investigation into a short fix. The same instinct drives the retrieval choice: fetch once for single-fact lookups, search across iterations when the question is genuinely multi-step.

3

#### Sort every failure, then handle them individually.

The first question for any failure is whether waiting and retrying could resolve the issue. Retriable failures get exponential backoff, with a cap and a retry budget, never an immediate loop that only deepens the problem. Tool failures come back to the model with the error flag set, not hidden behind an empty result that the model mistakes for data. Every failure a retry cannot fix requires a named fallback. Otherwise, an unhandled exception becomes the default behavior, which is how one bad response takes down the whole flow.

4

#### Measure cost and latency per call, and fan out only when a task truly splits.

You cannot budget what you do not measure, so instrument token cost, latency, and error rate on every call. Then tune a chosen lever instead of guessing from the invoice. An orchestrator-worker pattern multiplies token cost by the number of subagents, roughly fifteen times in Anthropic's reported case. It earns that cost only on tasks that split into independent parallel parts, not on tightly coupled work that a single agent can handle for a fraction of the cost.

5

#### Treat fetched content as data and enforce the boundary with a hook.

A model reads everything in its context together, as one stream of tokens with no built-in line between trusted instructions and untrusted data. An instruction hidden in fetched content can influence the agent's behavior. Trusting your own users does not help, because the injection arrives through the content the agent reads. Examine untrusted input as data, scope the agent's identity to least privilege, keep secrets out of committed config, and enforce the action boundary with a hook that blocks and logs before the tool runs. That boundary is what a regulated review can control and inspect.

What comes next

The next module turns the production-ready systems you can now build into reusable accelerators and contributed intellectual property. It covers how to package a working build as a parameterized template, MCP server, or portable eval suite, contribute it back through a channel a maintainer accepts, and then choose, version-pin, and defend where it runs across the first-party API, Amazon Bedrock, and Google Vertex AI so a model change or a residency review does not break production. The next module covers the deployment platform specifics this module set aside.

## Anthropic public references (time-sensitive)

| ID | Source | Type | Used for

| S1 | https://platform.claude.com/docs | Product documentation | Eval tooling and grading methods, test levels, API error and status codes, retry and backoff guidance, tool-result error flag, observability and prompt caching, IAM and prompt-injection defenses.

| S2 | code.claude.com | Product documentation | Claude Code hook lifecycle events (PreToolUse) and guardrail patterns.

| S3 | anthropic.com and Anthropic multi-agent research writing | Engineering and research writing | Orchestrator-worker pattern and its roughly 15x token cost, agentic search versus RAG and the Claude Code retrieval finding, prompt-injection defenses.

| S4 | Building with the Claude API (Skilljar) | Anthropic course | Eval pipeline, code and model graders, RAG and retrieval mechanics, workflow patterns, prompt caching. Stable conceptual material only.

| S5 | Claude Code 101 In Action (Skilljar) | Anthropic course | Claude Code hooks and configuration carried from the prior module.

## You can now prove a Claude feature holds under production traffic.

Evals, tests and traces, failure handling, cost and orchestration discipline, and a security boundary; each layer closes one way development hides what production reveals.
