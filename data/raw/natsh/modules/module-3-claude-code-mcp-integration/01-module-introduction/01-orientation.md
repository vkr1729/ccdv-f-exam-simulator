# Claude Code, MCP & Integration — Module Introduction — Orientation

_Module 3, screen S01_

Orientation·2 min

# What you will be able to do by the end

Claude Code is your terminal-native development partner.

In previous modules, you set up essential API components: prompts, tool schemas, context engineering, agent loops, and multimodal ingestion; this module builds directly on that foundation. Claude Code allows you to operate the same model within your terminal environment, introducing a permission layer, configuration system, and team-oriented sharing features. The MCP protocol enables secure integration with external services. In this module, you’ll learn how to configure Claude Code and MCP for robust security and effective deployment.

## By the end of this module, you will be able to:

- 1Run Claude Code through the explore, plan, and code loop and select a permission mode that matches the risk level of the work, so the agent stays productive without being granted more authority than the task requires.

- 2Read AI-generated code, review output with calibrated trust, and act on the findings that are reliable, verify the ones that are not, and place a human review gate where the cost of a wrong call is high.

- 3Give Claude Code durable project context using CLAUDE.md, rules instruction files, hooks, and subagents.

- 4Package a workflow as skills, custom commands, and a plugin. Author a skill once that runs the same way across Claude Code, the Messages API, and the Agent SDK.

- 5Build an MCP server that makes the tools, resources, and prompts available to Claude, select the transport that matches how the client and server communicate, and set the configuration scope that controls who loads it.

- 6Connect Claude to enterprise systems, authenticate those connections using patterns a regulated customer will accept, and scope a code modernization engagement so the work holds up under a security review.

This module is for the Developer who already has Claude working in code and now has to make that work configurable, shareable, and safe to connect to real systems. You are practical, code-forward, and pattern-oriented. This module assumes you are comfortable with the API patterns from Module 2. It does not re-teach the agent loop, tool schemas, or context engineering. It teaches the engineering decisions that sit around a working integration: how to run Claude Code in your terminal under a permission model, how to give it durable project context, how to package a workflow so a teammate can install it, and how to connect Claude to external and enterprise systems through MCP without leaking credentials or failing a security review.

“The build” in this module

Everything in this module is built around one recurring problem: code that works on your machine, in your session, or in staging now must hold up when someone else runs it, in production, against real company systems. On your machine the permission mode felt safe, the project rules were small enough to follow, the skill found its script, the credential was right there in the config file, and the connection worked in the staging test. The moment the work leaves your machine, each of those conveniences could become a failure: a permission mode deletes a file that was never in scope, one rule gets buried under hundreds of lines, a skill points at a path that exists on no other machine, a committed key leaks within hours, and a staging-only configuration step takes down the production connection. The work in this module is learning which configuration decision prevents which of those failures, before they show up in front of a teammate or an auditor.

Disclaimer / Notice for Educational Content

We built this Developer course Module 3: Claude Code, MCP & Integration to help you get real work done with Claude. Treat it as educational content. It doesn't constitute legal, financial, or other professional advice, so adapt what you learn to your own situation. Our products and services evolve quickly, so certain content may contain errors or be outdated; remember to verify on Anthropic’s website or docs. Examples and scenarios used in the course are illustrative and often fictitious. If the course material mentions a company or product, it doesn't mean Anthropic endorses them, they endorse Anthropic, or that we're affiliated. Also note your use of Anthropic products and services is covered by our terms, policies and documentation; if anything in this course conflicts with them, they control.
