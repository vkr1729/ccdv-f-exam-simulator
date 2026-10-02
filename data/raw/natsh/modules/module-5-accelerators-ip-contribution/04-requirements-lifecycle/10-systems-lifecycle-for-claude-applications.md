# Accelerators & IP Contribution — Requirements & Lifecycle — Systems lifecycle for Claude applications

_Module 5, screen S07C_

TeachingRequirements & Lifecycle·8 min

# Systems lifecycle for Claude applications

The requirements you just captured are the first phase of a longer arc. This screen names that arc as the systems lifecycle, so the deployment, versioning, and boundary work in the rest of this module sits in the right phase rather than arriving as unrelated tasks.

## The lifecycle phases applied to a Claude application

A Claude application moves through the same lifecycle as any engineered system, with the model work mapped onto it:

- 1Requirements: capture functional and infrastructure needs

- 2Design: choose the platform, the model, and the trust boundaries

- 3Build: write the agent, tools, and prompts

- 4Test: evals, unit, integration, and end-to-end checks

- 5Deploy: pin the version, gate promotion on the eval

- 6Operate: instrument cost, latency, and errors; enforce guardrails

- 7Iterate: feed production findings back into requirements

The phases are the same ones the earlier modules taught one at a time. Identifying them as a lifecycle is what shows how they connect.

## Gating between phases

A gate is a decision to move from one phase to the next, and it is where a regulated engagement keeps control. You do not move from design to build until the platform satisfies the residency requirement; you do not move from deploy toward full production until the new version clears the eval against the pinned baseline. Placing engineering work in the right phase, and refusing to skip a gate, is what keeps a Claude application reviewable.

Handles well

Placing each piece of engineering work in the lifecycle phase it belongs to, with a defined artifact and gate.

Adds cost or complexity

Gating between phases adds checkpoints a team under deadline is tempted to skip.

Use a different approach

A one-off experiment may collapse phases, but a regulated deployment cannot.
