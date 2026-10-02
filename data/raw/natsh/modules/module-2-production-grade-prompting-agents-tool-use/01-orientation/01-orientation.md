# Production-Grade Prompting, Agents & Tool Use — Orientation — Orientation

_Module 2, screen S01_

Module 2Orientation·2 min

# What you will be able to do by the end

Writing code that uses Claude is different from using Claude to write code.

You have probably used Claude interactively when you’ve typed a prompt, read the response, and adjusted it as needed. This module addresses all subsequent aspects of using Claude beyond this basic level, including tool schemas, context management, and agent loops. This module builds upon your ability to shape Claude’s outputs. As an engineer, you are responsible for programmatically integrating Claude, ensuring reliable output handling, and successfully deploying a robust production solution.

Each topic in this module addresses a specific failure mode that is frequently overlooked during development but requires significant time and effort to identify and resolve after development is underway. When you learn to identify and avoid these failure modes, you’ll be positioned to effectively and efficiently integrate Claude into your development processes.

## By the end of this module, you will be able to:

- 1Write production-ready prompts using system prompts, XML tags, few-shot examples, and output constraints, and diagnose why a prompt underperforms when first-pass results miss the mark.

- 2Decide when to enable extended thinking, calibrate its effort setting, and handle thinking blocks correctly across tool-use turns.

- 3Define and implement a tool schema that Claude selects correctly, construct the tool-use loop, handle multi-turn message blocks, and distinguish when to use a single tool call versus multiple parallel calls.

- 4Consume a streamed response, assemble streamed events into complete content blocks, and recover cleanly when a stream is interrupted partway through.

- 5Apply context engineering techniques including managing the context window, compacting, clearing history between tasks, and subagent handoffs, to keep multi-turn agent sessions within budget without losing task continuity.

- 6Build a production agent by choosing between workflow and agent patterns, wiring tools and context into a working loop, selecting a wiring path that fits your deployment constraints, and adding Human-in-the-loop (HITL) checkpoints where actions are irreversible.

- 7Manage agent memory across sessions using persistent storage patterns and choosing the right memory scope so that agent state survives across turns without inflating context cost.

- 8Send images and PDFs to Claude using the correct message block structure, apply the Files API for reusable assets, and submit high-volume workloads using the Message Batches API so they complete asynchronously.

This module is for the Developer who is ready to use Claude to take a prototype and turn it into a full production system that holds up during real usage. You are practical, code-forward, and pattern-oriented. This module assumes you are already comfortable writing code; it does not teach programming fundamentals, and it is not about using Claude casually in a chat window. It teaches the engineering decisions around the model: how to structure prompts, define tools, handle streaming safely, manage context and memory, and build agent loops that stay reliable, affordable, and controllable once deployed.

“The build” in this module

Everything in this module is built around one recurring engineering problem: a Claude integration that worked well during development but now has to hold-up in production. In development, the prompt looked solid, the tool call worked, the session stayed short, and the test inputs were manageable. However, in production, that same system has to survive longer sessions, larger tool outputs, interrupted streams, tighter cost and latency constraints, memory across turns, and actions that may be irreversible. This module teaches you which implementation decision prevents which production failure: how to structure prompts, define tools, handle streaming, manage context, choose memory scope, and wire agents safely before those failures show up.

Disclaimer / Notice for Educational Content

We built this Developer course Module 2: Production-Grade Prompting, Agents & Tool-use to help you get real work done with Claude. Treat it as educational content. It doesn't constitute legal, financial, or other professional advice, so adapt what you learn to your own situation. Our products and services evolve quickly, so certain content may contain errors or be outdated; remember to verify on Anthropic’s website or docs. Examples and scenarios used in the course are illustrative and often fictitious. If the course material mentions a company or product, it doesn't mean Anthropic endorses them, they endorse Anthropic, or that we're affiliated. Also note your use of Anthropic products and services is covered by our terms, policies and documentation; if anything in this course conflicts with them, they control.
