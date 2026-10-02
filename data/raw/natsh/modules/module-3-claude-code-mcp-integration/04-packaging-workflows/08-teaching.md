# Claude Code, MCP & Integration — Packaging Workflows — Teaching

_Module 3, screen S08_

TeachingPackaging Workflows·8 min

# Packaging a workflow as a plugin: skills, custom commands, and marketplace install

Previously, we covered the mechanisms that give Claude Code durable context and enforce behavior: CLAUDE.md for always-on project memory, rules files for scoped guidance, hooks for deterministic guardrails, and subagents for isolated task delegation.

These mechanisms live in your `.claude` directory and are version-controlled with the project. Now we turn to the next question: how can you package that setup so a teammate can install it simply in one step instead of repeating your manual configuration by hand?

## Skills are reusable workflows the agent loads on demand

A skill is a portable Markdown file (`SKILL.md` file) placed in `.claude/skills`. The front matter identifies the skill and describes when it applies, and the body holds the steps. The same skill can run in Claude Code, be invoked through Messages API, or be loaded by the Agent SDK. What changes across the three isn’t the file itself; it’s where the skill runs, how it gets loaded, and what it’s allowed to touch. A developer who has only ever seen skills in Claude Code may assume things that don’t hold true on the API, so this section outlines the differences.

## How the skill loads and runs in each

Select each tab for how the skill loads, where the steps run, and what you need to know.

Claude Code
Messages API
Agent SDK
Claude Managed Agents

How the skill loads: Discovered from `.claude/skills` on the filesystem. Loads on a description match or when you invoke it by name.

Where the steps run: In your terminal session, against your local files, under the active permission mode and deny rules.

What you need to know: It’s filesystem-based and is governed by the settings layer.

How the skill loads: Sent along with the request and run inside the code execution container, not your application’s environment. Requires code-execution and skills beta headers.

Where the steps run: Inside Anthropic’s code execution container, not on your machine. The skill’s filesystem and tool access are whatever that container provides.

What you need to know: A skill that assumes local files or local tools won’t behave the same way here, because it isn’t running where those files are.

How the skill loads: Loaded by the agent the SDK runs, but whether filesystem settings (CLAUDE.md, skills) load is controlled by the settingSources configuration. Do not rely on a default: always set it explicitly to the sources you intend, and confirm current default behavior against the Agent SDK reference at build time. You set it through the “settingSources” (TypeScript) / “setting_sources” (Python).

Where the steps run: In the process the SDK runs, which is your environment, once you’ve told it to load filesystem sources.

What you need to know: The common surprise: a skill that worked in Claude Code does nothing under the SDK because settingSources was never set, so the skill never loaded.

How the skill loads: Defined once as an API resource that names the model, system prompt, tools, MCP servers, and skills. Anthropic loads the skill server-side when the agent runs, so there is no filesystem discovery step on your side.

Where the steps run: Inside a sandbox Anthropic provisions and runs, not your environment. Your application sends user events and reads streamed results back. The skill has access to whatever that managed sandbox provides, not your local files.

What you need to know: Currently a public beta that requires the `managed-agents-2026-04-01` beta header, and sessions are stored server-side, which means Managed Agents are not currently eligible for Zero Data Retention or HIPAA BAA coverage. Skills are attached when defining the agent resource, not at session time. Update the agent definition to change which skills are available.

## Three portability rules

- Write the description as the matching criterion. The model loads a skill by comparing your request to its description, so a description that identifies when the skill applies works in every runtime, but a vague one fails to load in all of them.

- Don’t assume a local filesystem or local tools exist inside the skill body. A skill that shells out to a local command works in Claude Code but breaks on the Messages API, where it runs in a container without a command. Keep the skill’s steps confined to what the runtime is guaranteed to provide, or document the dependency.

- Remember that subagents don’t inherit skills. This was true in Module 2, and is still true here: a subagent starts clean, so a skill the parent relied on has to be listed for the subagent explicitly, in every runtime that supports subagents.

The practical takeaway is that you can author a skill once and reuse it, but you must specifically design for the ability to use it across terminals. A skill that’s scoped to a clear description and free of local-environment assumptions ports cleanly across runtimes, but one that assumes a specific local environment does not.

| Handles well | Adds complexity | Use a different approach

| A task-specific procedure authored once and reused across the interactive terminal, an API integration, and a headless SDK job.
| Each runtime loads and sandboxes the skill differently, so you must account for beta headers on the API and settingSources on the SDK.
| For instructions that must apply to every session in a project, CLAUDE.md is still the right tool. Skills are for on-demand, portable procedures.

## Giving a workflow an explicit entry point

A custom command is a shortcut for a defined procedure. In current Claude Code, skills are the recommended format for both explicit and automatic invocation: you invoke a skill directly with `/skill-name`, or Claude loads it automatically when relevant. The older `.claude/commands/` directory format still works but is a legacy process. Use skills with `disable-model-invocation: true` in the frontmatter when you want a workflow that only runs when you explicitly call it.

Plugin commands are namespaced automatically: the plugin’s name becomes the prefix, so a `run-tests` command in a plugin named `payments` is invoked as `/payments:run-tests`. This is why two plugins can both ship a `run-tests` command without colliding. Authors should treat the plugin name as part of the interface, since it prefixes every command you ship, and be aware that renaming the plugin renames them all.

## The packaging layer that makes a setup installable

A plugin bundles skills, hooks, subagents, and MCP servers into a single installable unit. Plugins can be packaged and distributed through a marketplace, which is a catalog of plugins that someone else has created and shared. The official Anthropic marketplace is available automatically when you start Claude Code, and you can add third-party marketplaces hosted in a GitHub repository with a command like `/plugin marketplace add <owner/repo>`. Teammates can then run one simple install command to get the same setup. The plugin replaces a page of manual setup steps with a versioned, auditable install. The plugin places components as follows:

- Skills go in a skills directory.

- Hooks, subagents, and settings go in their respective locations.

The plugin manifest describes the bundle, and the install command wires it into the target installation. Plugins can be downloaded by individuals or at an enterprise-wide level.

Enterprise administrators can deploy plugins organization-wide through managed settings. A managed marketplace allowlist gates which marketplace sources users are permitted to add, so the organization controls where plugins can come from. The allowlist restricts what users can add but does not register marketplaces automatically. If you would like to push a marketplace to all users without requiring them to run the add command themselves, pair the allowlist setting with `extraKnownMarketplaces` in managed settings. The precedence comes from the deployment scope: because managed settings sit above user and project settings in the configuration hierarchy, a plugin deployed at managed scope takes priority and cannot be overridden by users or project files. Review the reference layer for the exact setting names.

## The packaging decision table

The table below identifies each layer, who it is for, and when to reach for it.

| Layer | What it is | Who it is for | When to reach for it

| Skill | A Markdown file in `.claude/skills` that loads when its description matches the task or when invoked by name. | An individual developer or team using Claude Code interactively. | Reach for a skill when a task-specific procedure should stay out of context until it is needed, such as a PR review or a deployment checklist that only loads when the work calls for it.

| Custom command | A named shortcut that runs a defined procedure when you invoke it explicitly. | Developers who want a predictable, explicit entry point for high-frequency procedures. | Reach for a custom command when the procedure has a clear name and you want to trigger it directly rather than relying on the description to match the task.

| Plugin | A versioned bundle of skills, hooks, subagents, and MCP servers distributed through a marketplace. | A team that wants one-step installation of a shared, versioned setup. | Reach for a plugin when a working setup currently lives on one machine and needs to be shared, versioned, and kept consistent across a team.

Cost · Complexity · Risk

Cost: Skills add context cost upon activation, but a plugin adds installation and maintenance overhead. The question to ask is whether you want to pay the setup cost once, as you do with a plugin install, or repeatedly, as you do when every developer runs the same manual steps by hand.

Complexity: A plugin that hard-codes absolute paths in its skills will install correctly for the author and fail for everyone else, because any path or environment assumption baked into a skill or hook command is the thing most likely to break across machines.

Risk: A plugin carries the components it bundles into every install. It’s important to remember that a deny rule or hook the author relied on locally is not included unless it is explicitly listed as part of the bundle. If the skills or hooks are tied to a guardrail that is not included in the bundle, then the protection does not carry over to a teammate’s machine.
