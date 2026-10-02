# Production Engineering, Evals & Security — Cost & Orchestration — Checkpoint

_Module 4, screen S13_

CheckpointCost & Orchestration·8 min

# Match each task to its agent type and cost lever

Try it now. For each of the four scenarios below, select the configuration snippet that best matches it. Each snippet is labeled with its agent type and the primary cost lever it uses.

Labeled configuration snippets

A orchestrator_worker(lead=LARGE, workers=SMALL, n=5) # lever: parallel split
B single_agent(model=SMALL, batch=True, cache=True) # lever: Message Batches API (~50% cost reduction) + prompt caching
C single_agent(model=SMALL, retrieval="fetch_once") # lever: model choice
D single_agent(model=SMALL, stream=True) # lever: streaming

A single-fact lookup against a stable reference corpus

ABCD

A broad research question that splits into independent parts explored at once

ABCD

A user-facing request where the reply should feel instant

ABCD

A cost-sensitive, non-urgent batch job

ABCD

Submit
Skip for now
