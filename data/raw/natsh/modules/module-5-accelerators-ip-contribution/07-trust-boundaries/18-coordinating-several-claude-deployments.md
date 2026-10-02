# Accelerators & IP Contribution — Trust Boundaries — Coordinating several Claude deployments

_Module 5, screen S14_

TeachingTrust Boundaries·14 min

# Coordinating several Claude deployments with the trust boundaries holding under review

The accelerators, deployments, and tradeoffs now come together in a single application. Connecting components multiplies the places where identity, secrets, and untrusted input can cross. The discipline is to identify every boundary before connecting anything.

## Map which component does what before you connect them

A multi-component app coordinates more than one Claude capability into a single workflow. An API request might trigger a Claude Code task, which then reaches a customer system through an MCP server. Each component contributes a capability the others do not have. The challenge is that every connection between them creates a place where identity, secrets, and untrusted input can cross. Map which component does what before connecting anything.

## The trust boundary is where data moves

The trust boundary is the point where data or instructions move from one deployment environment to another. It is exactly where the injection and access controls from the prior module apply. Content fetched by a Claude Code task is untrusted when it reaches the next component. The receiving component should treat it as data, rather than as instructions, following the same principle used throughout the security module. The core discipline here is to identify every seam as a boundary. Don't assume a component is trusted simply because it worked correctly on its own.

## Least privilege applies to the whole application

Identity and least privilege, which means giving each component only the access its task needs and nothing more, apply to the application as a whole. Each component operates under an identity. The application is only as contained as its most privileged seam, which means a single component scoped too broadly becomes the weak point even when every other component is properly scoped. You scope each component to the least privilege its role in the workflow requires. This is what keeps a steered component from reaching beyond its intended task.

## Scoping for a regulated review pulls the module together

A regulated review requires justifying audit logging, data-residency decisions, and permission controls across the full application. For regulated deployments, Bedrock and Vertex AI are typically the platforms that satisfy regional residency constraints. Confirm ZDR and HIPAA BAA eligibility for each component against the Anthropic Trust Center and platform.claude.com before scoping.

### The multi-component integration map

| Component | What it contributes | The trust boundary at its seam | The control that enforces it

| First-party API | Orchestrates the workflow and holds the entry point. | The request entering the app from outside. | Input validation and the identity the call runs under.

| Claude Code task | Runs the agentic work and may fetch external content. | Content it fetched, which is untrusted downstream. | Treat fetched content as data at the next seam.

| MCP server | Reaches a customer system to read or act. | The system access it holds on the app's behalf. | Scope the server to least privilege and log the access.

Handles well

Naming every seam as a boundary and scoping each component to least privilege makes a multi-component app deployable under review.

Adds cost or complexity

Mapping seams, enforcing controls at each, and logging boundary crossings adds design and audit work to every integration.

Use a different approach

When a seam cannot be secured, do not ship around it: escalate to a human owner.
