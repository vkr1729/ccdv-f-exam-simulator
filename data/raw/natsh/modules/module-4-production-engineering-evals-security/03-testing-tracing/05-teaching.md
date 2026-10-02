# Production Engineering, Evals & Security — Testing & Tracing — Teaching

_Module 4, screen S05_

TeachingTesting & Tracing·14 min

# Testing and tracing

The eval you just built tells you what good looks like as a number. It does not tell you where a failure happened, nor does it prevent a passing eval from hiding a break somewhere in the workflow.

A graded target needs a test and tracing layer underneath it: tests that isolate each failure type, and traces that show which step produced the bad result.

## Various test levels, each catching a failure the others miss

A test is only useful if you know which failure it identifies. Four levels divide the work, and most silent production breaks live at one particular level:

- A unit test isolates one function, such as a parser or a tool wrapper, and checks it on its own. It tells you that one piece behaves, but nothing about how pieces fit together.

- A functional test checks that one Claude call returns the expected shape for a given input: the right fields, the right type, a parseable response. It validates the call rather than the system around it.

- An integration test exercises the handoff between two components, for example, where a retrieval result is passed into a model call. This is where most silent failures hide, because each side can pass its own tests while the handoff between them is broken.

- An end-to-end test runs the whole flow the way a user would, from input to output. It catches breaks that only appear when everything runs together, at the cost of being the slowest to run and the hardest to localize.

## Tracing: finding the source of failure

Tests tell you that a failure exists, but they do not tell you which step caused it. That is what a trace adds.

A trace records each step of a run: the prompt, the tool calls, the intermediate outputs, and the timing. When a case fails, the trace lets you see which step produced the bad result. Without a trace, a failed eval tells you something is wrong but does not tell you where it failed. This is the difference between a five-minute fix and a day spent tracing the workflow by hand. A trace reads like a timeline of the run, and the failing step is usually obvious once you can see the intermediate output.

[trace run_id=8f21c] case: "Where is my refund?"
step 1 retrieve(query) ok 42ms -> 3 chunks
step 2 build_prompt(chunks) ok 1ms -> prompt 1,240 tok
step 3 model.call(prompt) ok 980ms -> answer "..."
step 4 parse(answer) FAIL 2ms -> KeyError: amount
final score: 0 (failure localized to step 4, the parser)

The trace turns "the case failed" into "step four: the parser raised a KeyError on a field the model did not return." That is also what makes a change reviewable: you can show the step that moved rather than just the score that dropped.

## Routing between the two approaches so you pay for iteration only when you need it

You do not have to pick one strategy for everything. A cheap classification step can send single-fact lookups to the fetch-once path and multi-part questions to the search-across-rounds path. This allows you to spend on iteration only when the query needs it. Defaulting everything to iterative search inflates cost and latency on questions a single fetch would have answered, while defaulting everything to a static index gives shallow answers on questions that needed several passes. The router is one small model call that reads the query and picks the path.

def route(query):
kind = classify(query) # cheap call: "lookup" or "multi_step"
if kind == "lookup":
return fetch_once(query) # static retrieval, one pass
return agentic_search(query) # search across rounds

That one classification call costs far less than running iterative search on a query a single retrieval would have answered. The router earns its cost whenever your traffic is mixed: some queries are simple lookups and some need several passes. If every query is the same shape, skip the router and hardcode the path that fits.

## The reference you can keep open while you build

| Level | What it isolates | What it cannot catch

| Unit | One function, such as a parser or tool wrapper, on its own. | Anything about how components fit together.

| Functional | One Claude call returning the expected shape for an input. | Failures in the system around that single call.

| Integration | The seam where two components hand off, such as retrieval into the model. | Whole-flow behavior that only emerges end to end.

| End-to-end | The full flow as a user runs it, input to output. | Where exactly the break is, since it sees only the final result.

| Retrieval choice | Fetch a fixed set once for single-fact lookups in a stable corpus. | Multi-step questions and changing corpora, which need search across rounds.

Handles well
Localizes a failure to a step and matches each test to the break it can see.

Adds cost or complexity
Tracing and four test levels are infrastructure you build and maintain.

Use a different approach
For a single-fact lookup in a stable corpus, fetch-once retrieval beats iterative search.
