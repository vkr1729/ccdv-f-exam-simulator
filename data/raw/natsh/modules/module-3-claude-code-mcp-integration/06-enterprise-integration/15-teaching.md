# Claude Code, MCP & Integration — Enterprise Integration — Teaching

_Module 3, screen S15_

TeachingEnterprise Integration·18 min

# Connecting Claude to enterprise systems and authenticating it securely

Earlier the module covered how to build an MCP server and configure its transport and scope. For a server used only by your team on an internal project, the GitHub personal-access-token example covers the authentication pattern.

This section covers what changes when the integration must work in a regulated environment: the identity, secret-handling, and data-residency questions that a prototype usually ignores become requirements that must be answered in the production deployment.

## Why enterprise integration is different from a working prototype

A prototype that connects Claude to an internal service answers one question: does the connection work? A production enterprise integration must answer several additional questions: Who is the model acting as, and is that identity auditable? What data can it access, and where does that data leave the organization? Can an administrator lock the configuration so no individual developer can change the authentication setup? Can the access be logged in a way that satisfies a compliance audit?

These questions are not new to enterprise software; they have the same identity, access, and compliance requirements that apply to any external system touching regulated data. Treating them as part of the integration design is what separates a demo from something deployment-ready.

## Authentication patterns by service type

The right authentication mechanism depends on where the service runs and what identity model it supports. Select each tab for the pattern and when to use it.

Remote services with user identity
Remote services with service identity
Local services with file-system accesss

Use OAuth. The MCP server returns a 401 Unauthorized to signal that authentication is required. The client initiates a browser-based sign-in flow. After the user approves access, a token is issued and stored. No one copies a secret by hand; the OAuth flow is the expected pattern for cloud services, SaaS tools, and any integration where the user’s identity is part of the authorization model. The Linear MCP server from earlier in this module uses this pattern; the GitHub server, by contrast, authenticates with a personal access token passed as a header.

Use an API key passed through an environment variable. The key identifies the service account. The key must never be committed to a configuration file; it lives in the environment at the point of execution. For a CI pipeline using the Agent SDK, the key is injected as a secret by the pipeline runner, not baked into the code.

stdio transport with no network authentication. The security boundary is the file-system permission model. A denying rule in the settings files is the governance layer.

Managing the secret itself is the other half of secure authentication. A credential never travels with the configuration that references it: the config file holds only a variable reference, and the value lives in an environment variable or a managed secret store injected at the point of execution. Store service-account keys in a secret manager rather than in files, and rotate them on a schedule and immediately after any suspected exposure. If a key is leaked, you must rotate it, but remember, you cannot rotate a value baked into committed code. Scope each credential to the narrowest access its task needs, so a compromised key reaches only what that one integration required.

## Managing the secret after authentication: storage, rotation, and separation from config

Choosing the right authentication pattern establishes the connection, but keeping it is a separate problem. The MCP key leak mentioned earlier was not a bad choice of auth method, it was a credential that lived in the wrong place and could not be cleaned up once it spread. Three practices keep that from happening, and each one addresses a specific way a credential gets exposed.

The first practice is separation: a credential never travels with the configuration that references it. The configuration file holds a variable reference, and the value lives somewhere the file does not. This is the rule the leaked-key failure broke. The reason it matters is mechanical: configuration files get committed, shared, and cloned. A value written inline rides along with every one of those copies, and a committed value enters repository history in a way that overwriting does not remove. If you keep the value out of the file, then the file stays safe to share.

The second practice is where the value goes once it is out of the file. For a value that lives only on one machine or in one pipeline run, an environment variable injected at the point of execution is enough: the CI runner sets it as a secret, the configuration reads it by name, and nothing is written to disk. For a value that several services or people need, a secret store is better. A secret store is a managed service that holds credentials, returns them to authorized callers at runtime, and records who read what. It centralizes the value so a single rotation updates every consumer at once, and it removes the copies that accumulate when each service keeps its own credential in its own file. Reach for an environment variable when the secret is local and short-lived, and a secret store when the secret is shared or must be audited.

The third practice is rotation: replacing a credential with a new one on a schedule and immediately after any suspected exposure. Rotation is the only appropriate response to a leaked key, because a key that has been exposed cannot be made secret again. You must issue a new one. This is why the inline-credential pattern is so costly: a value baked into committed code cannot be rotated cleanly, since the old value stays in history and every consumer hardcoded to it breaks upon change. A credential read from a secret store or an environment variable rotates without touching the code that uses it, because the code references the value by name and the name does not change when the value behind it does.

Two habits can make rotation cheaper: scope each credential to the narrowest access its task needs, so a key that leaks reaches only what that integration required. Keep a record of which services use each credential, so a rotation does not surface its consumers.

The leaked-key failure earlier in the module identified the mistake: a credential written inline to a committed file. To prevent this from happening, apply these three practices: separation keeps the value out of the file, a secret store or environment variable gives the value a home that the file does not share, and rotation can help with recovery only when the first two are held.

## What regulated industries add on top of working authentication

A financial services or healthcare customer asks more questions than “does authentication work?” They ask where data is processed, how access is logged, and whether an administrator can lock the configuration so a developer cannot change the auth setup during an audit window.

The enterprise managed configuration from earlier sections answers the last question: an administrator-deployed server configuration that cannot be overridden by individual users means the auth setup is consistent across the organization and does not depend on each developer’s settings file being correct.

Audit hooks answer the logging question: a PostToolUse hook that logs every tool call and its parameters to an audit store provides the record a compliance review needs. The hook fires deterministically for every call, regardless of what the model decides, and the log is not something the model can skip.

Data residency answers the processing question: a server configured with an HTTP endpoint in a specific region, combined with a platform deployment that pins processing to that region, gives a compliance reviewer a checkable answer to where data goes. This is why the infrastructure requirement and the platform choice from earlier in the module matter at audit time, not just at build time.

## Code modernization: applying the full module to legacy change

Code modernization is a useful test case for everything this module covers, because it concentrates on the risks each tool was designed to manage. Large-scale changes to an unfamiliar legacy codebase carry high blast radius, unpredictable dependencies, and limited reversibility. The tools from this module address each of those risks directly when you apply them before the work starts. The explore, plan, and code loop is the core workflow for this type of work. Plan mode holds the agent in the read-only explore phase while you build confidence in its changes. You can review the proposed edits, identify anything that touches paths you did not expect, and push back before a single file is modified. Hooks enforce guardrails that prevent edits to specific paths during the most sensitive phases. CLAUDE.md carries the conventions for the new target patterns, so the agent applies them consistently across the full scope of changes rather than drifting back to the legacy patterns it reads in the surrounding code.

A responsible scoping approach for high-risk work addresses three questions before the session starts.

- What is the blast radius if something goes wrong: which systems depend on the code being changed, and what breaks downstream if an edit is wrong?

- How are changes audited: is there a PostToolUse hook logging every tool call, and does that log satisfy whoever needs to review what the agent touched?

- Who approves each phase before the next one begins? Plan mode enforces the boundary between exploration and execution, but the approval decision itself is yours to define and document before work begins.

These questions are not specific to modernization work. They apply to any high-risk agentic task. Code modernization surfaces them clearly because the scope is large, the codebase is unfamiliar, and the cost of getting it wrong is high.

## The authentication and integration checklist

The table below names the key decisions for each service type.

| Service type | Auth method | Where secrets live | What gets logged | Who can lock the config

| Remote with user identity (SaaS, cloud) | OAuth | Token issued by OAuth provider and stored by client. | PostToolUse hook to audit log. | Administrator via enterprise managed settings.

| Remote with service identity (internal API) | API key in environment variable | Environment only. Never in committed config. | PostToolUse hook to audit log. | Administrator via enterprise managed settings.

| Local (file system, local DB) | File-system permissions | No credential needed. Deny rules enforce path access. | PostToolUse hook to audit log. | Deny rules in enterprise managed settings.

Cost · Complexity · Risk

Cost: OAuth flows add a one-time setup step per user per service. API key management requires a secret rotation process, and audit logging through PostToolUse hooks adds a small overhead to every tool call.

Complexity: Regulated environments add requirements that don’t appear in a prototype. Identifying them during scoping is the discipline that keeps integrations on schedule.

Risk: The risk concentrates when a prototype moves toward production. A system that uses hardcoded credentials, has no audit log, and cannot be centrally locked will not pass a regulated customer’s security review. The fixes are not hard, but they require attention before the review.

Handles well
Any integration that touches data a regulated customer cares about, where the same tooling already supports enterprise managed settings and audit hooks. Scoping the security requirements up front adds little overhead and prevents the integration from stalling at the final review.

Adds cost or complexity
Teams that are not familiar with OAuth flows or enterprise secrets management. These patterns require coordination with security or IT teams in most regulated organizations, and the timeline needs to account for that.

Use a different approach
A prototype or proof of concept that will never see production data. The full enterprise integration checklist is not warranted for a demo-only integration but applying the environment variable habit for secrets costs nothing and is good practice.
