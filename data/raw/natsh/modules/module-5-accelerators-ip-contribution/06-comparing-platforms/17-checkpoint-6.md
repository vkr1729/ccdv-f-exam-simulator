# Accelerators & IP Contribution — Comparing Platforms — Checkpoint 6

_Module 5, screen S13_

CheckpointComparing platforms on latency, compliance, and cost·3 min

# Checkpoint 6: Diagnose the platform mismatch from a comparison trace

Try it now. The comparison trace below shows a deployment platform selected on familiarity failing a customer requirement. Identify the mechanism, then pick the targeted fix from the three options.

The trace

platform_selected = "team_default" # chosen on familiarity
latency_test: measured from dev laptop -> 180ms (looked fine)
customer_region: eu-west, payload 12 KB
compliance_check: data residency = EU-only required
result: REJECTED reason="data processed outside EU on selected platform"

AOption 1: Optimize the parser to cut the 180ms latency measured on the laptop.

BOption 2: Remeasure latency from EU-west and select the platform whose region satisfies EU-only residency.

COption 3: Add a caching layer to reduce per call cost on the selected platform.

Submit
Skip for now
