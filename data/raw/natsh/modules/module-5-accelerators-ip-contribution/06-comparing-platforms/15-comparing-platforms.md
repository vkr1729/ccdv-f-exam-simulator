# Accelerators & IP Contribution — Comparing Platforms — Comparing platforms

_Module 5, screen S11_

TeachingComparing Platforms·12 min

# Comparing platforms on latency, compliance, and cost so the choice survives review

In the last two screens you chose a platform and pinned its version. That choice was right for the customer's cloud, but "right for their cloud" is not yet an argument a procurement and security team will sign off on.

## Measure latency from the customer's region

Latency depends on where the platform runs relative to the customer and on how access to new features is routed. A platform running in the customer's own cloud region can reduce round-trip time compared to a first-party endpoint located farther away. The trade-off is timing of access: the first-party API typically receives new capabilities before they reach other platforms. The number is only accurate when you measure it from the customer's actual region against their actual payload. A measurement from your laptop hides the round-trip penalty that appears once the workload runs where the customer is. Within Bedrock specifically, the choice between global and regional endpoints is also the primary residency control and can affect cost. You should measure from the customer's actual region against both options before committing.

## Compliance often determines the platform

Compliance is often the dimension that ends the debate. A customer who already holds a certification on one cloud is unlikely to re-certify on another. Data residency is a rule that a customer's data must be processed in a specific country or region. Available compliance certifications and who can audit access differ by platform, and a regulated financial or healthcare customer treats these as pass-or-fail rather than as tradeoffs to balance. The first-party Claude API may not offer EU data residency; confirm current regional coverage at platform.claude.com, since EU-only residency typically requires Bedrock or Vertex AI; on third-party platforms such as Microsoft Foundry, hosting is per-model: Azure-hosted Foundry models run inference end-to-end on Azure infrastructure, while Anthropic-hosted Foundry models do not satisfy EU regional residency requirements. Residency must be confirmed per model and deployment with Microsoft. Raise the compliance constraint during scoping, or it surfaces at contract review after the work is done.

## What drives total cost beyond the per-token rate

Per-token rates are broadly aligned across platforms; total cost moves on egress, platform fees, and integration effort. A lower token price can cost more in total once data transfer and integration are factored in. Instrument cost per call for each platform. Confirm the current pricing pages at scoping.

### The cross-platform comparison reference

| Dimension | How it differs by platform | How to measure it | Where each platform wins

| Latency | A platform in the customer's region shortens the round trip, while the first-party API may reach new features first. | From the customer's actual region against their actual payload. | An in-region cloud platform wins on round-trip latency, while the first-party API is advantaged on earliest feature access.

| Compliance | Data residency, certifications, and audit controls are determined by the deployment platform. | Against the customer's existing certification and residency requirements during scoping. | The cloud platform the customer has already certified wins, because it needs no re-certification.

| Cost | Token price, data egress, platform fees, and integration effort all vary. | Total cost per call per platform, including egress and integration, rather than token price alone. | The platform with the lowest total cost for the actual workload wins, which is not always the cheapest token.

Handles well

Measuring all three dimensions per platform turns a placement into one a procurement team will sign off on.

Adds cost or complexity

Instrumenting latency, compliance, and cost across platforms requires real measurement work before any code ships.

Use a different approach

When the customer's compliance requirement is already pass-or-fail, skip the full comparison. That constraint determines the placement on its own.
