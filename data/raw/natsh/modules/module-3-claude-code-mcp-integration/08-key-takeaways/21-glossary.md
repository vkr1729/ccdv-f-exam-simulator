# Claude Code, MCP & Integration — Key Takeaways — Glossary

_Module 3, screen S20B_

GlossaryKey Terms·3 min

# Key terms from this module

Alphabetical. Click a term to expand its definition.

Claude Agent SDK

A programmable interface that exposes the same agent loop Claude Code runs in the terminal. It allows developers to invoke the loop from code, set the permission mode and available tools, and run tasks without an interactive session. The same permission model and deny rules that apply in the terminal apply in the SDK.

CLAUDE.md

A Markdown file placed at the root of a Claude Code project. Its contents are prepended to the context window at the start of every session. It holds the universal project constraints, conventions, and commands that should apply unconditionally across all sessions. Files that grow beyond roughly 200-300 lines risk diluting critical rules through content weight.

Hook

A command bound to a lifecycle event in Claude Code's execution (PreToolUse, PostToolUse, UserPromptSubmit, Stop). Unlike instructions in CLAUDE.md, hooks run deterministically at the configured event regardless of what the model decides. A PreToolUse hook can exit with code 2 to block a tool call before it runs.

MCP (Model Context Protocol)

An open communication layer that allows an MCP client such as Claude Code to connect to an MCP server that exposes tools, resources, and prompts. The protocol defines how the client discovers and calls the server's tools. Using MCP moves tool definition and maintenance out of individual application code and into a reusable server that any MCP client can attach to.

MCP transport

The communication channel between an MCP client and an MCP server. stdio runs the server as a local subprocess on the same machine as the client. HTTP connects to a remotely hosted server over a network. The choice of transport determines where the server can run and who can connect to it.

Permission mode

A setting in Claude Code that controls how often the agent stops to request confirmation before executing tool calls. Modes range from default (prompts before nearly every action) to bypass modes (no prompts at all). Deny rules override any mode; a deny rule at the enterprise settings level cannot be bypassed by any individual configuration.

Plugin

A versioned bundle of Claude Code components (skills, hooks, subagents, and MCP server configurations) distributed through a marketplace. Installing a plugin gives the recipient the same setup as the author in a single step. Enterprise administrators can deploy plugins organization-wide through managed settings.

Rules instruction file

A file that scopes guidance to a specific path or condition in Claude Code. Unlike CLAUDE.md, which loads for every session unconditionally, a rules file activates only when Claude Code is working in the directory it supervises. Used to keep path-specific guidance out of the main project memory file.

Subagent

A separate execution context launched by Claude Code to handle a delegated task. A subagent does not inherit the main conversation's context or accumulated files; it starts clean, performs the task, and returns only a summary. Using subagents for exploratory or investigative work keeps the main session context from filling with content that will not be reused.
