# Production Engineering, Evals & Security — Testing & Tracing — Checkpoint

_Module 4, screen S07_

CheckpointTesting & Tracing·10 min

# Diagnose which test level a failure belongs to

Try it now. Read the trace below, where the end-to-end test fails while every unit test passes. Identify where the break is, name the mechanism, and choose both the targeted fix and the test level that would have caught it from the three options shown.

PASS test_retrieve_unit returns 3 chunks for a known query
PASS test_model_call_functional returns a well-formed answer string
FAIL test_full_flow_e2e
step 1 retrieve(q) ok -> [{"content": "..."}, ...]
step 2 build_prompt(chunks) ok -> chunks placed without .content
step 3 model.call(prompt) ok -> answer unrelated to the documents
step 4 assert "30 days" FAIL -> phrase not in answer

Option A · fix the parser

def parse_date(s): return dateutil.parse(s) # already passes its unit test

Option B · fix the prompt wording

prompt = "Answer carefully and cite the policy." # rewords, ignores the seam

Option C · align the handoff + add an integration test

context = "\n".join(c["content"] for c in chunks) # extract .content
prompt = build_prompt(question, context)
# new test drives retrieve() -> build_prompt() together on real chunks

AFix the parser (dateutil.parse already passes its unit test)

BFix the prompt wording ("Answer carefully and cite the policy")

CAlign the handoff and add an integration test on retrieve() -> build_prompt()

Submit
Skip for now
