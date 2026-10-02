# Production-Grade Prompting, Agents & Tool Use — Module Wrap-up — Glossary

_Module 2, screen S28_

GlossaryKey Terms·3 min

# Key terms from this module

Alphabetical. Click a term to expand its definition.

Claude Agent SDK

A managed agent runtime distributed as @anthropic-ai/claude-agent-sdk (Typescript) / claude-agent-sdk (Python). It gives a partner programmatic access to the same agent loop that powers Claude Code: iteration, tool execution, observation, termination, so the partner can embed an agent inside their own product instead of running Claude Code in a terminal. Distinct from the Anthropic SDK, which is a thin convenience wrapper over the API and does not run an agent loop.

Context Window

The total number of tokens a model can process in a single request, including the system prompt, conversation history, tool definitions, tool results, and the model's own output. When the running total reaches the limit, earlier content must be removed or summarized before new content can be added.

Function signature

Function signature is a programming term that means the declaration of a function: its name plus the list of parameters it accepts, including their names, types, and any default values.

HITL

Human-in-the-loop refers to inserting a human review or approval step into an automated process before consequential action is taken.

Refactor

Refactor refers to changing the internal structure of code without changing what it does from the outside. You reorganize, rename, or rewrite the implementation to make it cleaner, faster, easier to test, or easier to extend, but the behavior the rest of the system sees stays the same.

SOC 2

Service Organization Control 2 is an audit framework developed by the American Institute of Certified Public Accountants (AICPA) for evaluating how a service organization handles customer data. It is the standard most commonly cited when a SaaS vendor or cloud service provider is asked to demonstrate that their security practices meet a recognized bar.

State

State is the information an agent carries between turns: the conversation so far, what the user asked for, results from earlier tool calls.

Stop_reason

A field in the API response that tells your code why the model stopped generating. The two values most relevant to agentic loops are end_turn, which means Claude has finished and is not requesting any further action, and tool_use, which means Claude has issued one or more tool_use blocks and is waiting for results before continuing.

Subagent

A separate agent instance spun up by an orchestrating agent to handle a discrete subtask. Subagents do not inherit conversation history, skills, or context from the parent session, each starts clean and must be configured explicitly with the instructions and tools it needs. Results are returned to the orchestrator, which incorporates them into the broader task.

Token

The unit Claude uses to measure and process text. The characters-per-token average depends on the tokenizer of the model at hand and differs between model generations. Treat any chars-per-token rule of thumb as model-dependent and confirm current tokenizer behavior at build time. Tokens are consumed by everything in the context window: prompts, responses, tool schemas, and tool results. They are the basis for both pricing and context budget calculations.

Tool_use_block

A content block returned by the assistant when Claude wants to call a function. Contains the tool name, a unique ID, and the input arguments Claude wants passed to your code. Every tool_use block must be answered by a matching tool_result block in the immediately following user turn, with the same ID preserved exactly.
