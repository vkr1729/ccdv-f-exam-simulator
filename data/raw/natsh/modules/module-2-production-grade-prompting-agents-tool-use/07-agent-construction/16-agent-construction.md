# Production-Grade Prompting, Agents & Tool Use — Agent Construction — Agent Construction

_Module 2, screen S16_

TeachingAgent Construction·22 min

# Building a production agent: the loop, wiring paths, orchestration, and human-in-the-loop

An agent is a multi-step tool-use loop with managed context and a defined goal. You have already built the individual pieces, including tool schemas and context management. This section connects them into a working system and adds the layer that neither topics cover on their own.

When components run together across multiple turns, new failure modes appear that isolated testing does not catch. Routing decisions that worked in single-turn tests start to compound. Context fills faster than expected. A step that depends on a previous result gets the wrong input because an earlier tool call was structured incorrectly. The question that should precede every agent build is: does this problem require an agent?

Agents carry coordination overhead, expanded context costs, and more surface area for failure than simpler patterns. Answering that question deliberately is the first design decision.

## Workflow or agent: Make this decision before you write the first line

The most critical mistake in agent development is choosing the wrong pattern at the start. Workflows and agents solve different problems: using an agent when a workflow is sufficient adds behavioral complexity without adding capability. Using a workflow when an agent is needed produces a system that breaks whenever user input deviates from the predetermined path.

| Choose a workflow when… | Choose an agent when…

| You can enumerate the exact steps in code. | You can specify the goal and the tools but not the exact path.

| Error cost is real and step-level guardrails matter. | The path through work cannot be enumerated in advance.

| Observability with standard tooling is required. | Non-determinism is acceptable and the agent's possible actions are constrained by its registered toolset.

| The inputs are well-constrained to a known set. | User inputs vary unpredictably in content and structure.

| Every execution of the task follows the same sequence. | The task requires creative sequencing of available tools.

## The agent is the pattern. The wiring path is an implementation choice.

Once you have decided the task needs an agent, you have also decided on a pattern: a loop that calls tools, manages context, and runs until a goal is met. For single-agent systems, that pattern is constant across all three wiring paths. Multi-agent architectures, where a planner, executor, and evaluator run as separate agents handing off through structured artifacts, introduce additional design decisions beyond the loop itself. Those patterns are covered later in this track. That pattern does not change based on how you build it, what changes is how much of the loop you write yourself versus how much you hand to a library or a hosted service.

There are three wiring paths, and they sit on a spectrum of how much infrastructure you own. You can write the loop directly against the Messages API, which gives you full control and full responsibility. You can use the Agent SDK, which runs the same loop inside your own process and hands you tool execution, context management, and the iteration structure already built. Or you can use Claude Managed Agents (currently in public beta), where Anthropic runs the loop and the sandbox and your application streams events in and results back. The sections that follow teach the loop itself, because the loop is what stays constant. The path you choose decides who maintains the parts around it.

## Wiring paths: who runs the loop, and what you take on

The three paths differ in one variable: how much of the agent's runtime you own. The table is ordered from top to bottom by how much infrastructure you hand off. Choose based on your deployment and compliance constraints, don't be tempted to choose the path that is just fastest to prototype.

Raw Messages API loop
Agent SDK
Claude Managed Agents

Who runs the loop: Your code runs every iteration. You send the request, read the tool-use blocks, execute the tools, and append the results yourself.

What you own: The full loop, tool execution, context management, retries, and exit conditions. Nothing is provided for you.

Choose this when: You need full control over each step, you have constraints a library does not accommodate, or you are teaching yourself how the loop works before adding abstraction.

What to check before committing: The maintenance cost is yours. Every behavior the SDK would give you for free, including context management and parallel tool handling, becomes code you write and test.

Who runs the loop: The SDK runs the loop inside your own process. It iterates and manages context, and your code still executes the tools the agent calls.

What you own: Tool execution and the surrounding application. The SDK provides the loop structure, context management, and tool registration.

Choose this when: You want the loop, context handling, and tool scaffolding that power Claude Code without rebuilding them, and you want the agent running in your own environment in Python or TypeScript.

What to check before committing: Whether filesystem-based features like CLAUDE.md and skills load in the Agent SDK is controlled by the `settingSources` configuration. Do not rely on a default: always set `settingSources` explicitly to the sources you intend (for example, `["user", "project", "local"]` to match Claude Code CLI behavior, or `[]` to run fully isolated with only what you pass programmatically). Confirm current default behavior against the Agent SDK reference at build time.

Who runs the loop: Anthropic runs the loop and the sandbox. Your application sends user events and streams results back over server-sent events.

What you own: The application layer and the agent definition. You define the model, system prompt, tools, MCP servers, and skills once, then reference the agent by ID across sessions.

Choose this when: You need long-running execution measured in minutes or hours, you want a managed sandbox, or you want to avoid building the loop, the sandbox, and the tool-execution layer at all. Also available on Claude Platform on AWS with some feature differences, verify capability parity against your deployment surface before committing.

What to check before committing: Sessions are stateful and stored server-side, which means they are not currently eligible for Zero Data Retention or a HIPAA Business Associate Agreement. (See Anthropic API data retention documentation at platform.claude.com, verify at publish.)

Currently in public beta, all endpoints require the `managed-agents-2026-04-01` beta header and behaviors may be refined between releases. Build with a migration plan in place.

## Claude Managed Agents: when to use

The table above lists Managed Agents as the third path. Let's make that choice concrete because for some workloads it's the right default.

Here's the core difference: with a raw loop or the Agent SDK, your code runs the iteration. You send each request, read the tool-use blocks, run the tools, and append the results. With Managed Agents, Anthropic runs the loop and the sandbox for you. Your application defines the agent once (model, system prompt, tools, MCP servers, skills), refers to it by ID, sends user events, and streams the results back over server-sent events.

### What you stop owning, and what you take on instead

| Category | What you stop owning | What you take on instead

| Execution & infrastructure | The iteration loop, the execution sandbox, the retries inside the loop, and the tool-execution runtime. Anthropic runs all of it server-side. | An agent definition managed as a versioned API resource, plus an application layer that sends events and consumes the streamed results.

| Session duration & state | Long-running execution management. Sessions can run for minutes or hours without your process holding the loop open. | Server-side session state. Sessions are stateful and stored by Anthropic, and are subject to its data handling policies and constraints (see the constraint note below).

| Sandbox lifecycle | Sandbox provisioning and teardown for tool execution. | A dependency on the managed sandbox's available tools and its execution model, rather than your own environment.

### Choose Managed Agents when

- The task runs long. Execution measured in minutes or hours is awkward to hold open in your own process, and the managed loop is built for exactly that.

- You want a managed sandbox. If you'd otherwise be building and securing an execution environment for tool calls, using Managed Agents takes a large piece of infrastructure off your plate.

- You'd rather not build the loop, the sandbox, and the tool-execution layer at all, and you're willing to define the agent as an API resource instead.

The constraint that decides it for regulated work

Managed Agent sessions are stateful and stored server-side. That storage is the reason these sessions aren't currently eligible for Zero Data Retention or a HIPAA Business Associate Agreement. So, if your workload carries PHI or falls under a ZDR requirement, this path is ruled out no matter how well it fits operationally, and you route to the Agent SDK or a raw loop on a covered configuration instead. The governing constraint picks the path before convenience gets a say.

A common progression is to prototype on the Agent SDK locally, then move to Managed Agents for production. The core agent definition carries over conceptually. What changes is the format: the Agent SDK uses code-level and filesystem configuration, while Managed Agents defines the agent as a versioned API resource. Expect a re-expression step, not a direct export.

Handles well
Long-running agents, and workloads where you'd rather not build or secure a sandbox and loop yourself.

Adds cost or complexity
Server-side stateful sessions, an agent-as-resource definition format, and a beta surface that can change between releases.

Use a different approach
For PHI or ZDR workloads, or when you need full in-process control, stay on the Agent SDK or a raw loop on a covered configuration.

## Wiring the loop: the four steps that hold across every path

The four steps below define a working agent loop no matter which path you build on. When you write the loop against the Messages API, you implement all four yourself. When you use the Agent SDK, it provides the structure for registering tools, setting the system prompt, and iterating the loop, and your code still handles tool execution. The steps are the same; what differs is how much you write versus inherit.

- Register tools: Each tool follows the same schema structure. The SDK registers them against the agent, so Claude knows what is available.

- Set the system prompt: Scope it to the agent's task. A broad system prompt produces broader, less reliable tool routing. A system prompt that names the specific task and the tools available for it produces more consistent behavior.

- Handle the tool-use loop: Whether you iterate the loop yourself or the SDK iterates it for you, your code handles execution. Every tool call Claude issues must be executed by your code and returned in a tool-result block.

- Define exit conditions: The agent loop runs until it receives a stop condition. Without explicit exit conditions, the agent will continue requesting tool calls beyond what the task requires. You should define when done means done.

## Loop wiring checklist: verify these regardless of path

| # | Item | What to verify

| 1 | Tools registered | Every tool the agent may need is in the registration list. No unregistered tools are referenced in the system prompt.

| 2 | System prompt scoped | The system prompt names the task and the available tools. It does not describe tools the agent does not have. It does not omit tools the agent does have that require scoping guidance.

| 3 | Tool-use loop implemented | Your code handles every tool-use block Claude issues and returns a tool-result block for each one before the next assistant turn. All tool-use blocks from a single assistant turn must be resolved together.

| 4 | HITL insertion point defined | At least one point in the loop has a human-in-the-loop check. See the section below for where to insert it.

| 5 | Exit conditions defined | The loop has a clear stopping criterion that does not depend on Claude volunteering to stop.

## Human-in-the-loop (HITL): Insertion points and when each applies

A human-in-the-loop checkpoint pauses agent execution and routes to a human review step before proceeding. The question that determines where to insert one is: what is the worst possible outcome if this step runs without a human check?

| Insertion point | What triggers the check | Risk level it addresses

| Before a destructive tool call | The agent is about to execute a write, delete, or send operation. | High: irreversible actions where a wrong call cannot be undone

| After a planning step | The agent has generated a plan and is about to begin executing it. | Medium: incorrect plans that would produce the wrong outcome even if all steps execute correctly

| On unexpected output | The tool result contains an error flag, an empty result, or a value outside expected bounds. | Variable: catches failure modes that retry logic alone will not resolve

## Tool orchestration: Over-tooling and under-tooling

The agent's routing behavior is shaped by two things, including how tools are described and how many tools are registered. Too many tools with overlapping descriptions produce erratic routing. Too few tools force the agent to either hallucinate a path or return an incomplete result.

Over-tooling is the more common problem in production agents. Teams register every tool they might need "just in case" and discover that Claude's selection quality degrades as the tool surface grows. Start with the minimum set required for the task and add tools only when a specific gap in capability is confirmed.

| When agents are the right call
| What you take on when you use an Agent
| When to choose a workflow instead

| Goal-directed tasks where the exact path cannot be enumerated in advance. Handling variable inputs that would require dozens of conditional branches in a workflow. | Agents add behavioral complexity: the path through the task emerges from the model's reasoning over accumulated context rather than from explicit branching logic in your code. Observability requires transcript-level tooling rather than standard operational logging. | When you can enumerate the steps in code, use a workflow. Agents are the last step in progression. Start with the simplest pattern that solves the problem, a single API call, then a workflow, then an agent. And move up only when the simpler pattern cannot handle the variability the task requires.

## Regulated data constraints set your delivery route and credentials before you write the wiring

If your data needs to be handled with specific constraints (e.g., attorney-client privilege, HIPAA, GDPR, FedRAMP, or an internal data-residency policy), that constraint decides which endpoint your code calls, which credentials it carries, and where its logs land before you make a single design choice about prompts, tools, or memory.

As a developer you usually do not pick the surface, but you do write the code that targets a specific endpoint, attaches credentials, configures the region, and emits logs. Get the governing constraint named at the start, because the wrong client configuration is much more expensive to undo after the agent is wired than to set correctly the first time. The five constraints below cover the cases you are most likely to hit in production.

| Constraint | What it tends to rule out in code | What usually survives a code review

| Attorney-client privilege | Calls from a consumer-grade Claude.ai surface that the firm cannot audit end-to-end. Code paths that send privileged document content to any endpoint the firm has not approved for privileged material, regardless of how the prompt or system message is structured. | Direct API or SDK calls from inside the firm's own application, authenticated via SSO, routed through a firm-approved LLM gateway with full request and response logging. Note that Anthropic's native Compliance Conversation content (prompts, responses, and tool call payloads) is not captured by Anthropic by default on direct API traffic, so the organization must implement conversation logging in the application layer and route it to an approved log destination. Tool calls and tool results stay inside the audited path. Confirm the final logging design with your Anthropic account team.

| HIPAA (PHI handling) | Code that sends Protected Health Information to any endpoint or delivery route not covered by a Business Associate Agreement for the specific configuration in use. This includes any logging or retention path your code writes to that has not been scoped under the same BAA. | Direct API or SDK calls on a BAA-covered configuration. BAA coverage for Anthropic first-party API access is arranged with Anthropic, which provisions a dedicated HIPAA-enabled organization that enforces feature restrictions on its own end. Confirm the covered configuration with your Anthropic account team. An alternative is a cloud-mediated route via AWS Bedrock or GCP Vertex on the partner's existing HIPAA-eligible cloud account. Note: the BAA does not cover Console, Workbench, beta features, or consumer plans. Not all API features are covered under the BAA, verify the current feature eligibility list in Anthropic's Implementation Guide before configuring.

| GDPR and data residency | Delivery routes where the region of model execution cannot be pinned in code, or where the request can be served from a region outside the approved geographic boundary. Defaulting to a global endpoint without specifying region is the common pattern that breaks here. | A cloud-mediated route such as Bedrock or Vertex, with the region pinned in the client configuration to a covered jurisdiction. The direct Anthropic API is a separate case; it does not currently provide EU data residency, so partners with EU data residency requirements should route through Bedrock or Vertex rather than calling the API directly.

| FedRAMP and government | Any code path that calls an endpoint not on an authorized cloud environment at the required impact level. This includes development and test paths that hit the commercial endpoint while production hits the authorized one, because credentials and code patterns leak between them. | Three authorized routes exist as of publish time. Claude for Government (C4G) carries a direct FedRAMP High authorization held through Palantir Federal Cloud Service – Supporting Services (PFCS-SS). Claude via Amazon Bedrock GovCloud is approved for FedRAMP High and DoD IL4/5 workloads. Claude via Vertex AI Assured Workloads is also FedRAMP authorized. Claude Enterprise on AWS Marketplace is not FedRAMP authorized, so teams requiring FedRAMP compliance must use one of the three routes above. Verify current authorization status at trust.anthropic.com before configuring.

| Internal data-residency policy | Calls from any SDK client configured against a cloud vendor outside the partner's approved list, regardless of whether the underlying technical capability would support the workload. Procurement-level constraints rule the code path out before engineering preferences enter the conversation. | The delivery route on the partner's approved cloud vendor. In code terms, that is whichever SDK client and endpoint configuration their CIO has already cleared. Build against that one rather than switching mid-project because another route looks easier.

This table covers the constraints that directly determine endpoint selection and credential configuration. SOC 2 is not in scope here. It governs how your systems are built and operated, not which endpoint your code calls, and is covered in Module 4 alongside other security posture and audit requirements.

Forward pointer

Module 4 (Production Engineering, Evals & Security) goes deep on secure-by-design patterns for IAM and privacy, defenses against prompt injection from untrusted inputs, runtime guardrails, and agent hardening. The role of this section is narrower: surface the constraint at the point in the build where it actually rules options out, which is when you pick the endpoint, the SDK client configuration, and the credentials your agent carries into production.
