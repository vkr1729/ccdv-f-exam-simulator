# Claude Code, MCP & Integration — Packaging Workflows — Checkpoint

_Module 3, screen S09_

CheckpointPackaging Workflows·3 min

# Checkpoint 3: place the skill in the right runtime

Try it now. Three teams want to reuse the same review-checklist skill in different places.

For each, match what must be configured for the skill to load and run. Note: the source presents four runtime situations. All four are included here so the match stays complete.

A developer wants the skill to load when they ask for a review in the Claude Code terminal.

Enable filesystem sources by setting settingSources explicitly so the agent loads skills from the project. Do not rely on a default, and confirm current default behavior against the Agent SDK reference at build time.Place SKILL.md in .claude/skills with a description that matches review requests.Define the agent as an API resource that lists the skill and set the managed-agents-2026-04-01 beta header on the calls. Write the skill so its steps do not depend on local files, because it will run in Anthropic’s sandbox.Send the code-execution and skills beta headers and write the skill so its steps do not depend on local files or local tools.

A service calls the Messages API and wants the skill to run as part of the request.

Enable filesystem sources by setting settingSources explicitly so the agent loads skills from the project. Do not rely on a default, and confirm current default behavior against the Agent SDK reference at build time.Place SKILL.md in .claude/skills with a description that matches review requests.Define the agent as an API resource that lists the skill and set the managed-agents-2026-04-01 beta header on the calls. Write the skill so its steps do not depend on local files, because it will run in Anthropic’s sandbox.Send the code-execution and skills beta headers and write the skill so its steps do not depend on local files or local tools.

A scheduled headless job uses Agent SDK and expects the skill from the repo to load.

Enable filesystem sources by setting settingSources explicitly so the agent loads skills from the project. Do not rely on a default, and confirm current default behavior against the Agent SDK reference at build time.Place SKILL.md in .claude/skills with a description that matches review requests.Define the agent as an API resource that lists the skill and set the managed-agents-2026-04-01 beta header on the calls. Write the skill so its steps do not depend on local files, because it will run in Anthropic’s sandbox.Send the code-execution and skills beta headers and write the skill so its steps do not depend on local files or local tools.

A product team wants the same review-checklist skill to run inside a long-running agent that Anthropic hosts, reachable by an agent ID across sessions.

Enable filesystem sources by setting settingSources explicitly so the agent loads skills from the project. Do not rely on a default, and confirm current default behavior against the Agent SDK reference at build time.Place SKILL.md in .claude/skills with a description that matches review requests.Define the agent as an API resource that lists the skill and set the managed-agents-2026-04-01 beta header on the calls. Write the skill so its steps do not depend on local files, because it will run in Anthropic’s sandbox.Send the code-execution and skills beta headers and write the skill so its steps do not depend on local files or local tools.

Submit
Skip for now
