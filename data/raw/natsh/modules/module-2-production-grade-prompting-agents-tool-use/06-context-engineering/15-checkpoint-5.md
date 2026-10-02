# Production-Grade Prompting, Agents & Tool Use — Context Engineering — Checkpoint 5

_Module 2, screen S15_

CheckpointContext Engineering·3 min

# Checkpoint 5 · Diagnose the context failure

The session trace below shows a multi-turn agent run with degrading tool selections. Read the trace, identify which turn triggered the failure, name the mechanism, and select the one-line fix from the three options below.

Session trace

Click each turn to inspect it.

| Turn | Tool called | Result size

| 1 | fetch_policy_document, correct selection | 2,400 tokens

| 2 | fetch_policy_document, correct selection | 2,400 tokens

| 3 | fetch_policy_document, correct selection | 2,400 tokens

| 4 | fetch_policy_document, correct selection | 2,400 tokens

| 5 | search_knowledge_base instead of apply_coverage_rule, wrong selection | 1,800 tokens

| 6 | search_knowledge_base again, wrong selection (same as turn 5) | 1,800 tokens

| 7 | Session ends without result | N/A

Turn 4

fetch_policy_document, correct selection, 2,400 tokens. Last correct turn. Four large tool results (9,600 tokens) are now sitting in the context window, crowding the instructions that tell Claude which tool to use next.

AAdd a clearer description to the apply_coverage_rule tool schema.

BPrune fetch_policy_document results after each turn so that accumulated outputs do not crowd out current instructions, and apply compaction before turn 5.

CIncrease max_tokens in the API call to give Claude more room to respond.

Submit
Skip for now
