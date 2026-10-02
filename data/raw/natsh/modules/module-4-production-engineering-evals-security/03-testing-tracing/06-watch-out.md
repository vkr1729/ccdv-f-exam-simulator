# Production Engineering, Evals & Security — Testing & Tracing — Watch Out

_Module 4, screen S06_

Watch Out
Testing & Tracing
8 min

## The pieces passed and the seam broke

Setup

You tested the prompt and the parser in isolation. Both passed, so you trusted the whole flow.

## Trace excerpt: green unit and functional runs, a red end-to-end run at the handoff

A trace from an eval run shows the parser unit tests passing and the model-call functional test passing. Each returns the expected shape when tested in isolation. The end-to-end run fails. Reading down the trace, the failure occurs at the handoff where the retrieval result is passed into the model call.

PASS test_parser_unit parser returns date objects
PASS test_extract_shape_functional model call returns {primary_date, issue}
FAIL test_full_flow_e2e
[trace] step 1 retrieve(q) ok -> 3 chunks (list of dicts)
step 2 build_prompt(ctx) ok -> ctx inserted as raw list
step 3 model.call(prompt) ok -> answer ignores the context
step 4 assert answer... FAIL -> model answered from memory
cause: retrieve() returns [{"content": ...}], build_prompt() expected
a plain string, so the model received malformed context.

Each side was correct in isolation. The retrieval function returns a list of chunk dictionaries, and the prompt builder was written expecting a plain string. This causes the context to arrive malformed and the model to answer from its own memory instead of the retrieved policy. The handoff between the two components was never exercised, because no test covered that seam. This is the failure the integration level exists to catch. A unit test cannot identify it, because the unit itself works. A functional test cannot identify it, because the call works on a well-formed input. Only a test that drives the retrieval-to-model handoff with real retrieved data can raise the mismatch before a user does.

Why this broke

The format contract between the retrieval step and the prompt builder was never defined. One returned a list of dictionaries, the other expected a plain string, and nothing enforced the boundary between them.

How to prevent it

Add an integration test that drives the two components together with real retrieved data. A unit test cannot catch this because each component works in isolation. Only a test that exercises the handoff surfaces the mismatch before a user does.
