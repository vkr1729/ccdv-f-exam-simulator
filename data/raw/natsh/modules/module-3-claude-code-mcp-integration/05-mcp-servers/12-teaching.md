# Claude Code, MCP & Integration — MCP Servers — Teaching

_Module 3, screen S12_

TeachingMCP Servers·21 min

# Building and configuring an MCP server: transport, scope, and the GitHub server

Prior sections introduced plugins as the packaging layer that bundles skills, hooks, subagents, and MCP servers into a single installable unit.

This section further explains what MCP server bundles are and how to build them. An MCP server is the layer that exposes tools to Claude from outside your codebase. When building an MCP server, one of the first decisions is determining the appropriate transport mechanism and defining the server’s scope.

## What is an MCP server and why is it different from wiring a tool directly?

When wiring a tool directly into an application, you are responsible for defining the tool’s schema and its functionality. Both live in that application’s code. If three different applications need access to the same external service, each one maintains its own integration. Model Context Protocol, or MCP, separates tool definitions from individual applications and turns them into a process called a server.

An MCP server is a process that exposes tools, resources, and prompts that MCP clients can use. Claude Code has a built-in MCP client. When you connect to an MCP server, Claude Code discovers the tools it provides and can invoke them during a session. With an MCP server, you build the capability once, and every MCP client that connects to it gets access without re-implementing the integration.

## MCP servers also expose resources and prompts

An MCP server exposes tools, resources, and prompts. We’ve already learned about tools: actions the model can call. The other two cover cases where a tool call won’t give you what you need.

A resource is read-only data the server exposes for the client to fetch and place into context directly, rather than the model calling a tool to get it. The client requests a resource by its address, and the server returns the data. Resources come in two forms: a direct resource has a fixed address for data that takes no parameters, such as a list of available documents, and a templated resource puts a parameter in the address, such as a document address that takes a document identifier. Reach for a resource when you want known data to be in context from the start of a turn. You want this when pulling a resource in directly is cheaper and more predictable than using a tool call to go get it. Resource support varies across MCP clients; verify that your client has a mechanism to inject resources into context before relying on this pattern.

A prompt is a pre-written instruction template the server exposes so a client can invoke a vetted prompt by name instead of asking each user to write their own. A user can already ask the model to do most tasks in their own words, so a prompt is useful when specific wording is needed: a task where a carefully built instruction produces materially better results than whatever a user would type, and where you want every client to get the same quality. Packaging the instruction on the server means the prompt is maintained in one place and reused everywhere the server is connected.

## Transport: how Claude Code talks to the server

Transport is the communication channel between the MCP client and the MCP server. The right transport depends on where the server runs. Select each tab for what it is and when to use it.

stdio
HTTP
SSE

stdio runs the server as a local process on the same machine as the client. The client launches the server as a subprocess and communicates through standard input and output. This is the correct choice for a local tool, a personal script, or a development server you run on your own machine. It does not work for a server you want to share across your team or host remotely.

HTTP is the recommended form of transport for any server that does not run locally. It connects over a standard HTTP connection and supports servers hosted on a different machine. When you register an HTTP server, you provide the URL and the client connects over the network. Shared team servers and hosted integrations use HTTP.

SSE (Server-Sent Events) is an older means of transport that predates the current HTTP transport. It has been superseded by HTTP transport and is no longer recommended for new servers. If you encounter SSE in existing configuration or documentation, treat it as a legacy option rather than a current recommendation.

## Context cost

Each connected MCP server contributes tool definitions that would occupy the context window if loaded upfront. By default, Claude Code defers these definitions rather than loading them upfront, and it uses a search step to discover and load the relevant tools only when a task calls for them. Only the tools called for enter context.

An opt-in mode loads tool definitions upfront when they fit within roughly 10 percent of the context window, deferring only when that limit is exceeded. Either way, connecting only the servers you need keeps each request lean, because every connected server adds to the pool of definitions the model has to account for.

## Prompt caching: paying once for reusable requests

The context-cost problem you just saw with MCP servers has both a cost and window dimension. Every request reprocesses its input from scratch, including the parts that were identical on the last request, meaning that you pay for reprocessing each time. Prompt caching can stop you from paying twice for the same stable content.

Caching stores the processing work done on a stable prefix of your request so a follow-up request can reuse it instead of reprocessing the same tokens. The first request writes the prefix to the cache, and follow-up requests send identical content up to the same point in the cache at a fraction of the cost. The content must match exactly: a single changed character before the cache point invalidates that cache and forces a fresh write. That is why the strongest candidates for caches are the parts of a request that rarely change, such as a long system prompt, a large set of tool definitions, or a reference document you ask several questions about.

You turn on caching by marking a cache breakpoint; there is no global setting that turns caching on. In the Messages API you add a `cache_control` field of type `ephemeral` to the last block you want cached; this caches everything up to and including that block. You can place up to four breakpoints. The request is processed in a fixed order of tools, system prompt, and messages, so a breakpoint after the tools caches the tool definitions while keeping the messages dynamic.

The cache has a time limit. The default cache lifetime is five minutes from the last read. An opt-in one-hour lifetime is available by setting a `ttl` of `1h` on the breakpoint. The five-minute default suits a back-and-forth model where requests arrive every few minutes, since each read resets the clock. The one-hour option suits a workload with longer gaps between requests, such as an agent that pauses between steps, where the five-minute window would expire before the next request. If the window expires before the next request, you are left paying the write cost again for no read benefit. Please note that caching only applies above a minimum token threshold (1,024 tokens for most current models) so short prompts will not be cached even if a breakpoint is set.

## Retrieval-augmented generation: how Claude pulls in only the knowledge a request needs

The context-cost problem you just saw with MCP servers is the same one a large body of reference material creates. A model reads everything in its context window for every request, so the more documents you load up front, the more context is used, and the less room is left for the work. Retrieval-augmented generation, usually shortened to RAG, is the pattern that resolves this. Instead of loading every document into context, the system stores the material outside the context window, finds the parts most relevant to the current request, and supplies only those parts to the model at request time. The model then generates its answer from that retrieved slice rather than from the whole library.

RAG comes in two forms:

Classical RAG does the hard work upfront. Before anyone asks a question, the source material gets split into chunks, and each chunk is converted into a set of numbers (called an embedding) that captures its meaning mathematically. Those numbers are stored in a database. When a user asks a question, the system converts the question into the same type of numbers, then finds whichever chunks have the most similar numbers. Think of it like a librarian who, before the library opens, has already read every book and written a precise summary card for every chapter, so when you arrive with a question, they can pull the right cards instantly.

Agentic search skips the upfront indexing entirely. There’s no pre-built database. Instead, the model figures out what it needs the moment you ask, then goes and fetches it: searching live sources, reading documents on demand, pulling in results as the task unfolds. Think of it like a researcher who, when you ask a question, goes and finds the answer themselves rather than consulting pre-prepared cards.

You may have already encountered agentic search without knowing its name. In Claude Code, when you’re connected to many external tools (MCP servers), Claude doesn’t load every tool definition up front; that would be too much to hold at once. Instead, it discovers and loads only the tools it needs for the current task. Claude.ai Projects works the same way for uploaded documents: when a project’s knowledge base grows larger than can fit in the active window, it surfaces only the document sections most relevant to each question rather than loading everything.

Both approaches do the same fundamental thing; they both find a relevant slice of material and generate from it. The difference is timing: classical RAG finds the slice by matching against an index built in advance; agentic search finds it by searching at the moment of need.

Two properties of retrieval are worth understanding before you reach for it:

- It scales. As your source material grows, the cost of each request stays flat, because the model only ever receives the slice relevant to that question, not the entire library. A knowledge base can grow to thousands of documents and a single question still pulls back roughly the same amount of text. That’s what lets retrieval work at scale: the source can keep growing without the request growing with it.

- It’s only as good as what it finds. The model reasons over the slice it receives. If the retrieval step misses the document you needed, the model never sees it. This means that how you organize your material is important: files with vague names (“notes_final_v3.pdf”) are harder to surface than files with descriptive ones (“Q3 refund policy, updated August 2024”). Grouping related files together helps too. Good retrieval starts with a well-organized source.

## Configuration scope: who loads the server

The scope determines which users and projects load the server. Each scope corresponds to a different configuration location.

- Local scope stores the server configuration in `~/.claude.json` under the current project’s path. It applies only to the project you are currently working on and is not shared with teammates. This is the right scope for a server tied to a specific project context that you are not ready to commit to the repository, or for tooling that only makes sense in one project.

- User scope stores the server configuration in your personal Claude settings and makes it available across all your projects. It is still personal: teammates do not see it, and it is not written into the repository. This is the right scope for a personal utility you use in every project, such as a local database tool or a script you rely on regardless of which codebase you are working on.

- Project scope writes the server configuration to a `.mcp.json` file at the root of the repository. When that file is committed to version control, everyone who clones the repository gets the same server automatically. This is the right scope for a server the whole team can access, because the configuration travels with the code. One thing to keep in mind: a project-scoped server runs from each teammate’s machine. For a stdio server, the committed configuration stores the launch command, and every clone spawns its own local subprocess, so each teammate needs the runtime (such as Node for an npx-launched server) installed locally.

- Enterprise scope deploys through a centrally managed configuration controlled by an administrator. Administrators can push servers to all users in the organization without individual configuration steps. This is the right scope for shared internal services, security tooling, or any server that must be present across the organization and cannot be left to individual developers to configure.

## Permission rules that target a single MCP tool, not the whole server

Connecting a server exposes its full tool list, but you rarely want the agent to reach every one of those tools without checking. The permission layer from the permission-modes section extends to MCP tools, and the rules can name an individual tool rather than the whole server.

An MCP tool is identified in a permission rule by its server and tool name: `mcp__server__tool`. An allow rule on `mcp__github__create_issue` lets that one tool run without a prompt while every other tool on the GitHub server still prompts. A deny rule on a write-capable tool blocks it while read-only tools on the same server stay available. This is how you connect a broad server but keep the agent inside a narrow slice of what it can do. A deny on one tool overrides an allow on the server.

The API MCP connector is another useful control. If you are reaching the server through the API MCP connector, an `mcp_toolset` object lets you set an `enabled` flag per tool. This enabled flag lets you register a server but expose only the specific tools you want the model to see. A permission rule decides whether an exposed tool may run; the enabled flag decides whether the model sees the tool at all. The first is a governance control, the second is a context-cost and scope control. These controls are often used together. Always verify the exact rule syntax and the connector beta header against the documentation before publishing.

## The GitHub MCP server: transport, scope, and authentication in a concrete example

The GitHub MCP server is a remote server maintained by GitHub that exposes tools for repository management including reviewing pull requests, opening issues, searching code, and more. By walking through the connection process, you can see how transport, scope, and authentication work together in a server maintained by someone else.

The GitHub server uses HTTP transport because it is hosted remotely by GitHub. You register it by providing the server URL, and the client connects over the network. For scope, choose project scope when your whole team needs access to the same repository tooling, and local scope when only you need access to the server.

Authentication for the GitHub MCP server uses a Personal Access Token. You generate the token in GitHub, then pass it as a Bearer token in the request header of your MCP configuration. The token must be supplied through an environment variable and referenced in the configuration file. It must not be committed inline to `.mcp.json`, because a token written directly into a committed file enters repository history and cannot be removed by overwriting the file in a later commit.

OAuth is a different authentication mechanism, used by servers where the service authenticates individual users through a browser-based sign-in flow. Linear is an example of a server that uses this pattern. When you connect to a Linear MCP server for the first time, the client redirects to Linear’s sign-in page. After you approve access, a token is issued and stored automatically. No credential is copied or managed by hand. OAuth is the right pattern for any integration where the service’s authorization model is tied to user identity.

GitHub MCP uses a service credential you generate and store; Linear MCP initiates a sign-in flow that handles the credential for you. Both are remote HTTP servers, and both follow the same transport and scope logic. The authentication step is what differs.

## The MCP setup reference

The table below captures transport and scope decisions for each deployment context.

| Context | Transport | Scope | Config location | Secrets handling

| Personal local tool (runs on your machine only) | stdio | Local | `~/.claude.json` (per-project entry) | Environment variables only. Never in config file.

| Shared team server (all teammates connect to same service) | HTTP | Project (`.mcp.json`) | `.mcp.json` committed to repo root | OAuth or env variables. API keys must never be committed to .mcp.json.

| Personal experiment (not ready to share) | stdio or HTTP | Local | Personal Claude settings | Environment variables only.

| Organization-wide deployment (admin-managed) | HTTP | Enterprise | Managed settings (admin-controlled) | Secrets managed by administrator. Config locked to prevent override.

Cost · Complexity · Risk

Cost: Each connected MCP server adds its tool definitions to the context window. The more servers connected, the larger every request. Load only the servers a given task needs.

Complexity: Transport and scope are independent decisions, but they interact: a stdio server cannot be project-scoped for sharing because it runs only on one machine. Match transport to where the server runs before choosing scope.

Risk: Committing an API key inside .mcp.json to version control is the most common mistake in this section. The key travels into repository history where rotating later is not sufficient to remove the exposure. Secrets go in environment variables. The configuration file holds only the server address.

Handles well
A reusable integration you want to use across multiple Claude Code sessions and share with the team, where the capability is stable enough to maintain as a separate process. The GitHub server is a great example.

Adds cost or complexity
Teams that are not managing environment secrets carefully should be watched closely. Adding MCP servers increases the number of places a secret could be mishandled. The risk concentrates on the .mcp.json file, which is committed to the repository.

Use a different approach
A one-off task where the tool logic can live directly in the codebase and does not need to be reused across sessions or applications. For a single-project integration used by one person, wiring the tool directly in the API call may be simpler than maintaining a server.
