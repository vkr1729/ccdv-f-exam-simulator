# Accelerators & IP Contribution — Packaging for Reuse — Checkpoint 1

_Module 5, screen S04_

CheckpointPackaging a reusable accelerator·4 min

# Checkpoint 1: Fix the broken accelerator template

Try it now. Below is an agent template another team is supposed to reuse. It has one defect: a customer-specific value is hardcoded where a parameter belongs.

The template as shipped

# agent_template.py : "reusable" code-review agent
def build_review_agent():
return Agent(
model="claude-opus-4-8",
system_prompt=SYSTEM_PROMPT,
tools=[read_file, run_linter],
repo_path="/home/acme/checkout-service", # customer repo
)

(Confirm current model ID at platform.claude.com/docs/en/about-claude/models at build time.)

Identify the hardcoded value, then write the corrected function signature and the parameterized line that replaces it.

Compare with model answer
Skip for now

Skipped

Move on if you need to but come back before the cumulative task. A later checkpoint plants a version of this same hardcoding defect among two others and is harder to spot under multi-layer load.
