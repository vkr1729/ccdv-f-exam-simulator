# Accelerators & IP Contribution — Cumulative Task — Cumulative: assemble and verify

_Module 5, screen S18_

CumulativeAll topics·6 min

# Cumulative task: assemble and verify the corrected deployment

You have identified three defects across this module. Now assemble the fix: in your own words, describe what each defect was, what you changed, and why the corrected version is deployable. Then review the corrected code below and confirm your reasoning holds.

When you are ready, reveal the model answer.

Reveal model answer
Skip for now

The corrected deployment

def build_agent(repo_path): # parameterized for reuse
return Agent(
model="us.anthropic.claude-opus-4-8", # pinned full Bedrock model ID
system_prompt=SYSTEM_PROMPT,
repo_path=repo_path, # set per engagement
tools=[read_file, run_linter],
)

deploy(platform="amazon_bedrock", identity=aws_role_arn,
retain_previous_pinned_version=True) # rollback target kept

fetched = code_task.run(fetch_url=customer_page)
next_call(input=treat_as_data(fetched)) # untrusted -> data, not instructions

# verify before promoting: gate the version through the bundled eval
assert eval_suite.run(model="us.anthropic.claude-opus-4-8") >= baseline_score

Model answer: The first defect was a hardcoded repository path. Parameterizing it restores reuse: a new engagement sets the value rather than editing the loop. The second defect was a moving model alias. Pinning the full Bedrock model ID (with the anthropic. prefix) with a retained previous version restores controlled rollout and gives a rollback target if the new version regresses. The third defect was fetched content passed directly as instructions. Wrapping it in treat_as_data() closes the trust boundary: content from an untrusted source is treated as data, not as something the agent should act on. The eval assertion gates promotion on a proven baseline score before the version ships.

All three defects landed · pass
I missed one or more · retry
