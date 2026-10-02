# Accelerators & IP Contribution — Key Takeaways — Glossary

_Module 5, screen S19B_

GlossaryKey Terms·3 min

# Key terms from this module

Alphabetical. Click a term to expand its definition.

Accelerator

A working solution packaged so the next engagement configures it rather than rebuilding it. Customer-specific parts are exposed as documented parameters, the assumptions are written down, and an eval is bundled to prove the asset still works in a new context.

Contribution readiness

What a maintainer needs to verify a contribution: focused code, a runnable example, a test that proves the behavior, a statement of environment assumptions, and confirmed rights to contribute the code.

Deployment platform

Where a Claude workload runs. The six are: the first-party Claude API, Claude Platform on AWS, Claude in Amazon Bedrock, Claude on Amazon Bedrock (legacy), Google Vertex AI, and third-party platforms. The same model can differ by platform on identity, data residency, latency, and cost.

Model alias versus pinned ID

An alias such as opus or sonnet resolves to a recommended version that updates over time and can differ by platform. A pinned full model ID is a fixed snapshot. Pinning is what keeps an upstream model change from being a silent production change.

Trust boundary

The seam where data or instructions move from one deployment environment to another in a multi-component app. Content fetched by one component is untrusted when it reaches the next, so the receiving component treats it as data, not instructions.
