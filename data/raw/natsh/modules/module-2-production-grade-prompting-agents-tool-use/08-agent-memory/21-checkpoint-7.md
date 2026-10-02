# Production-Grade Prompting, Agents & Tool Use — Agent Memory — Checkpoint 7

_Module 2, screen S21_

CheckpointAgent Memory·3 min

# Checkpoint 7 · Choose the right memory pattern

Read the three agent use cases below. Match each agent use case on the left to the correct memory scope on the right. There is one correct scope per use case.

A customer support agent assists the same user across daily check-ins over two weeks. Each session starts where the previous one left off.

In-context memory: all state lives in the active conversation.External storage: write state to a database at session end, then read it back at session start.No persistent memory (stateless): each session starts fresh.

A document formatter receives a file, applies a transformation, returns the output, and terminates. Each job is fully independent.

In-context memory: all state lives in the active conversation.External storage: write state to a database at session end, then read it back at session start.No persistent memory (stateless): each session starts fresh.

A coding assistant works with a developer across a multi-hour session. The session will not continue after it ends.

In-context memory: all state lives in the active conversation.External storage: write state to a database at session end, then read it back at session start.No persistent memory (stateless): each session starts fresh.

Submit
Skip for now
