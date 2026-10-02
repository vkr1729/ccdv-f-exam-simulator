# Production-Grade Prompting, Agents & Tool Use — Tool-use and Schema Design — Tool Schemas

_Module 2, screen S07_

TeachingTool-use and Schema Design·20 min

# Tool Schemas Claude Selects Correctly: Definition, Loop, and Calling Patterns

So far, the work has been about shaping what Claude produces: framing the request, giving examples, picking the technique that fits the output you want. With tool-use, you’re not steering language toward a good answer anymore, you’re handing Claude a set of actions and trusting it to pick the right one; that pick is driven almost entirely by what you wrote in the schema.

## How the tool-use loop works

The most common misconception about tool-use is that Claude runs the tools. Instead, Claude reads your tool definitions, decides which one fits the situation, and tells your application what to call it along with the required inputs. Your application executes the tool, gets the result, and sends it back; then Claude uses that result to continue.

This back-and-forth shouldn’t be ignored in production: if your application does not handle the return correctly, Claude never gets the data it asked for, and the loop breaks. The boundary between what Claude owns and what your code owns is where most tool-use bugs live. Here is the sequence to ensure proper implementation of tool-use.

Click each step to see what happens.

1

Define schema

2

Send message

3

tool_use block

4

Execute tool

5

Return result

6

Claude continues

Define schema

You define a schema with a name, a description, and an input schema. Claude reads this to decide whether and when to call the tool.

It’s important to note that the loop is not automatic and you need to complete the fourth step. If the miss is systematic, the fix is in the schema definition step.

## Message block structure in a tool-use conversation

A tool-use conversation is built out of structured blocks, not plain text. Each assistant turn and user turn is a list of blocks, and four block types do the work in a tool-use session. A text block carries Claude’s prose response. A tool_use block carries a tool call, including the tool name, a unique ID, and the input arguments. A tool_result block carries what your code returned after running the tool. A thinking block carries Claude’s internal reasoning, and it only appears when extended thinking is enabled.

The API enforces a specific pairing between these blocks. Every tool_use block in an assistant turn must be answered by a tool_result block with a matching ID in the user turn that immediately follows. If the IDs don’t match, if the result is missing, or if the turns are out of order, the request fails validation. This is not something you can fix by adjusting your prompt; it’s structural, and your code has to produce the sequence correctly on every request.

The table below summarizes each block type, what it contains, and the rule that governs how your code must handle it.

| Block type | Role | Contains | Critical rule

| text block | Assistant/Claude | Claude’s prose output | Claude may return a text block alongside a tool_use block in the same turn. When it does, your code must preserve the full content array, including the text block, when appending that turn to conversation history. Dropping the text block corrupts the context Claude relies on for follow-up turns.

| tool_use block | Assistant/Claude | The tool name, a unique ID, and the input arguments Claude wants passed to your function | Every tool_use block must be answered by a tool_result block in the immediately following user turn. The tool_result must carry the same ID. Without that pairing, the API rejects the next request.

| tool_result block | User | Matching tool_use ID, the result content, and an optional is_error flag set to true when the tool call fails | The tool_use_id value must match the original tool_use block exactly. Claude uses this ID to connect each result back to the call that produced it, which matters when a single assistant turn issues multiple tool calls and the results arrive in a different order.

| thinking block | Assistant (extended thinking only)/Claude | Claude’s internal reasoning, visible only when extended thinking is enabled | The block must be passed back to the API unchanged in subsequent turns. The signature verifies the reasoning hasn’t been modified, so any edit or summary breaks the signature and the API rejects the message. Redacted thinking blocks follow the same rule: pass them back as received, even though the content is encrypted and not human-readable.

The critical invariant is that every tool_use block from an assistant turn must have a corresponding tool_result block in the immediately following user turn. Missing tool_result blocks, or tool_result blocks that appear in a later turn rather than the immediately following user turn, cause an API validation error.

## Schema anatomy: What Claude reads to make a tool selection decision

A tool schema has three parts, including name, description, and input_schema. The description determines whether Claude selects the tool correctly or not.

- Name: A short identifier that should be specific. For example, `get_account_balance` is more useful to Claude than `get_data`.

- Description: A critical part that Claude reads to decide whether a tool is required or not. You should always write the description in two parts, including when to and when not to use the tool:

- A description that says "use this to find information" will cause wrong selections because Claude cannot distinguish it from any other tool that retrieves something.

- A description that says "use this to retrieve the current balance for a specific account ID and do not use this for transaction history" gives Claude an exclusion condition to work with and is appropriately descriptive.

- input_schema: Defines the parameters (the inputs your tool function accepts) using JSON Schema.

- You should mark parameters as required when Claude requires them to call the tool correctly.

- You can mark parameters as optional when the tool can operate without them. Overlapping parameter types between tools is the most common source of wrong-tool calls.

## Decision table: Schema design choices

The schema is what Claude reads to decide which tool to call, what arguments to pass in, and whether it has enough information to respond. A schema that’s vague, under-described, or missing required fields will produce tool calls that look syntactically correct but pick the wrong tool, pass malformed inputs, or loop unnecessarily. The five decisions below determine whether your implementation behaves predictably under real conditions. The table notes where sequential and parallel tool-calling diverge.

| Decision | How to handle it | Why it matters

| Subtask dependency | When one tool’s output feeds the next, the calls have to run in sequence because the second call cannot be built until the first result comes back. When the subtasks are independent of each other, you can structure the tool set so Claude issues multiple tool_use blocks in a single turn and your code runs them concurrently. | This is the one decision that changes how you design the schema. Current Claude models default to parallel calls when calls are independent. Where a real dependency exists, model it as separate turns so the first result is available before the next call is built. Use disable_parallel_tool_use to force one tool call per turn if needed.

| Required fields | Mark a field as required only when the call doesn’t make sense without it. Place these in the required array of the input schema. | Marking everything required forces Claude to fabricate values for fields it has no basis to fill in. The required array is how you tell Claude which inputs are non-negotiable.

| Optional fields | Use optional fields for parameters with sensible defaults or where absence carries meaning. Leave them out of the required array and give them defaults in the function signature. | Optional fields let Claude omit information it doesn’t have, instead of guessing. If a field is optional but marked required, every call must invent a value, which can cause bad inputs.

| Description length | Write three to four sentences per tool covering what it does, when Claude should reach for it, and what it returns. Include examples of valid inputs where format matters. | If the description is too short, Claude guesses because there isn’t enough signal to distinguish your tool from others. If the description is too long, the trigger conditions get buried under detail Claude doesn’t reference at decision time.

| Overlapping parameter types | When two tools accept the same parameter shape, add disambiguating language to each description that names the domain or trigger the tool is meant for. | Claude routes on name plus description, with parameter types as a secondary signal. When signatures are identical, routing collapses to description alone, and similar-sounding descriptions become indistinguishable.

### Worked example: A schema that causes wrong-tool selection and the fix

This is an illustrative example based on common patterns observed in tool-use implementations. Tool names, descriptions, and test results are constructed to demonstrate the selection-disambiguation principle, not drawn from a specific production system.

A developer registers two tools, including `search_knowledge_base` and `get_cached_result`. The tool names are distinct, but Claude’s tool selection weighs descriptions heavily; when descriptions overlap, name alone is not sufficient to disambiguate. Both have descriptions that start with "use this to find information." Without exclusion conditions, Claude frequently selected the wrong tool on ambiguous inputs during development testing.

The problem is that both descriptions look identical to Claude at the point where the selection decision is made. The fix is adding an additional sentence per description:

search_knowledge_base: "Use this to search the knowledge base when the user asks a question that requires looking up current information. Do not use this if the result of a prior search in this session already covers the question."

get_cached_result: "Use this to retrieve a result that was already fetched during this session. Only use this if search_knowledge_base was called earlier in this conversation for the same query."

The exclusion conditions give Claude a decision rule rather than two identical-looking options. These conditions rely on complete conversation history being passed in each request. If prior turns are truncated or dropped, Claude cannot evaluate them and the exclusion logic silently fails.

Every additional tool you register increases the surface area Claude has to reason over, so this discipline only pays off when the underlying tools are distinct. The table below shows where exclusion-condition disambiguation helps and where a different approach is warranted.

Handles well
Routing Claude to the right tool reliably when descriptions are specific and exclusion conditions are stated.

Poor fit.
Two tools that do similar things and need ever-longer descriptions to keep apart: at that point, merge them into one tool with a type parameter instead.

## When someone else has already written your tools: MCP as an alternative to manual schema authoring

Everything in the previous sections assumes you are writing the tool schemas yourself: name, description, input_schema, and the function that executes when Claude issues a tool_use block. For many integrations, you do not need to do that. The Model Context Protocol, MCP, is a standardized communication layer that moves tool definitions and execution out of your application code and into dedicated servers. When an MCP server exists for the service you want to reach, you can connect directly to the MCP server rather than building the integration yourself.

Take a GitHub integration as a concrete case. GitHub exposes repositories, pull requests, issues, projects, and more. To build a complete integration using the tool schema approach from this module, you would need to write a schema and an execution function for every piece of that functionality and maintain it as GitHub’s API evolves. An MCP server for GitHub has already done that. So, your application connects to the server, receives the full list of available tools, and Claude selects among them using the same description-based routing you have already been working with. The underlying mechanism is identical, but what changes is who wrote it and who owns the tool definitions.

### How MCP fits into the tool-use loop

The loop you built earlier in this module does not change when you introduce MCP. Claude still issues a tool_use block, your application still executes the tool and returns a tool_result, and the message block pairing rules still apply. The difference is in the setup step. Instead of registering schemas you wrote, your MCP client sends a `ListToolsRequest` to the MCP server, receives the full tool list back, and passes those definitions to Claude. From Claude’s perspective, those tools are indistinguishable from ones you authored manually.

One practical implication worth noting: MCP servers add tool definitions to the context window even when the tools are not being used in the current turn. If you connect several servers at once, the tool definitions themselves consume budget before the first message arrives. The schema design discipline from earlier in this module applies here too. Register only the servers you are actively using, and check context cost against your window limit if you are connecting multiple servers in the same session.

If you are using the API MCP Connector, you control loading cost through an `mcp_toolset` object in the tools array. The `mcp_toolset` carries a `default_config` block that applies to every tool on the server, and you can override individual tools through configs keyed by tool name. Two settings matter for context cost:

- The `defer_loading` boolean, set inside `default_config` or a per-tool entry in configs, delays loading a tool definition until the model needs it, which reduces upfront context cost when you connect a server with a large tool list.

- The `enabled` boolean turns individual tools on or off, so you can register a server but expose only the tools you want the model to see. The MCP Connector requires the `mcp-client-2025-11-20` beta header to be set on the request.

Without that header, the mcp_toolset configuration will not apply as described here.

The other piece worth knowing at this stage is how the client actually talks to the server. MCP runs over one of two transports, and which one you use depends on where the server lives. Local servers use stdio and your application spawns the server as a subprocess and communicates over standard input and output. Remote servers use Streamable HTTP and your application connects over the network via HTTP, using POST for client-to-server messages and an optional GET-based SSE stream for server-initiated messages. An older SSE-only transport exists but is deprecated, and new integrations should use Streamable HTTP. One constraint worth flagging if you are using Anthropic’s MCP connector in the API: only HTTP-exposed servers are supported through the connector, and stdio servers require managing the MCP client connection yourself via the SDK. Once the connection is established and tool definitions are received, your application code treats both transports identically.

Use MCP when

A well-maintained MCP server already exists for the service you need (check that it covers the specific operations you require and is actively maintained against the service’s current API. Writing and owning those schemas yourself adds implementation overhead for no additional capability. Note that the Claude API MCP Connector only supports remote servers. Local stdio servers require Claude Desktop or Claude Code as the client; they cannot be connected directly through the API.

Write schemas manually when

No MCP server covers your use case, or when you need precise control over tool scope and description quality that a general-purpose server does not provide. Before defaulting to manual schemas for scope control, note that the API MCP Connector supports allowlisting and denylisting specific tools per server via MCPToolset configuration. Manual authoring may still be warranted for description quality, but not always for scope.

Use both when

Connect to an MCP server for breadth then apply the description-tuning discipline from earlier in this module to the specific tools you are actively routing to. MCP and manual schema authoring are not mutually exclusive as the server gives you coverage, and your descriptions give you precision where it matters. Apply tool allowlisting via MCPToolset to limit the surface area Claude reasons over before layering in description tuning. Narrowing the tool set and sharpening the descriptions are two separate levers, and you should use both.
