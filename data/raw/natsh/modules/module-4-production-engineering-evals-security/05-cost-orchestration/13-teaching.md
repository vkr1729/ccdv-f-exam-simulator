# Production Engineering, Evals & Security — Cost & Orchestration — Teaching

_Module 4, screen S11_

TeachingCost & Orchestration·29 min

# Keeping cost, latency, and reliability in budget across agents

A system that recovers from failure still must be affordable and fast, or it will not survive contact with a real bill.

The retry budgets and fallbacks from the last screen keep it reliable. This screen instruments and budgets it, then handles the pattern that multiplies cost fastest: distributing work across several coordinating agents.

## Cost and latency are invisible in development but decisive in production

In development, you run a handful of calls and never see the bill. In production, the same calls run at volume, while cost and latency become the constraint. Observability for a Claude system means instrumenting three metrics per call: token usage (input and output tokens), latency, and error rate. With three metrics for every call, you can see which step is expensive or slow, instead of guessing from a total monthly bill. Instrument every call from the start. Treating observability as a later step means the bill arrives before the explanation. In code, it is a thin wrapper around the call that records the usage the API already returns.

import time

def instrumented_call(make_call, step_name):
start = time.perf_counter()
resp = make_call() # raises on any API error
latency_ms = (time.perf_counter() - start) * 1000
log_metric(step=step_name,
input_tokens=resp.usage.input_tokens,
output_tokens=resp.usage.output_tokens,
latency_ms=latency_ms)
return resp

Once every call logs those three metrics, a cost or latency problem stops being a mystery on the invoice and becomes a row you can sort.

The value of per-call instrumentation is that it changes the questions you can answer. A cost spike without per-call logging gives you one question: why is the bill high? Per-call logging lets you ask which step, on which request type, is responsible, and retrieve the answer from the data directly. A flow that appears uniformly expensive often turns out to have one step doing ninety percent of the spend, and that step is where every optimization dollar should go. The same is true for latency: the slow step is rarely the one you expected, and the trace plus per-call timing tells you which it is instead of letting you optimize the wrong thing.

## The levers that affect the budget

A cost or latency problem almost always traces to one of a few measurable components. Identifying the lever before tuning it is what keeps optimization from being guesswork. Select each tab for the lever and how it moves cost or latency.

Model selection
Prompt & context size
Number of tool calls
Streamed vs. batched
Streaming with tool use

Model selection for the task: Choose a smaller, faster model to cut down on the cost and latency of a more sophisticated one. Reserve the most capable model for the steps that need it, and route simpler work elsewhere.

Prompt and context size: Every token in the prompt contributes to cost. Trimming context and removing unnecessary tool output reduces the per-call cost directly. This is the context-engineering work from the first module applied to the operational cost.

Number of tool calls: Each call adds both cost and latency. A flow that makes more calls than is needed is a common and measurable source of unnecessary spending, one that becomes visible the moment you instrument a call.

Streamed versus batched output, and prompt caching for repeated context: streaming changes how latency is perceived by returning the first token to the user as soon as it is ready rather than waiting for the full response. For a user-facing feature, this matters: a response that starts arriving in 300ms feels faster than one that delivers the same content in a single block after two seconds, even if the total generation time is identical. Prompt caching is covered in its own section below.

Streaming with tool use requires additional handling. In a non-streaming call, the full response arrives as a single object and tool_use blocks are directly accessible. In a streaming call, the response arrives as a sequence of server-sent events and tool_use blocks accumulate across multiple delta events before they are complete. Consuming the stream without accounting for this produces partial tool inputs and silent downstream failures.

The pattern is to accumulate deltas by index until the stream closes, then reconstruct the tool calls from the completed blocks:

def stream_with_tools(client, **kwargs):
tool_blocks = {} # index -> accumulated block
text_chunks = []

with client.messages.stream(**kwargs) as stream:
for event in stream:
if event.type == "content_block_start":
block = event.content_block
tool_blocks[event.index] = {
"type": block.type,
"id": getattr(block, "id", None),
"name": getattr(block, "name", None),
"input_json": ""
}
elif event.type == "content_block_delta":
delta = event.delta
if delta.type == "input_json_delta":
tool_blocks[event.index]["input_json"] += delta.partial_json
elif delta.type == "text_delta":
text_chunks.append(delta.text)
elif event.type == "message_stop":
break

# reconstruct completed tool calls after stream closes
tool_calls = []
for block in tool_blocks.values():
if block["type"] == "tool_use":
tool_calls.append({
"id": block["id"],
"name": block["name"],
"input": json.loads(block["input_json"])
})

return "".join(text_chunks), tool_calls

A tool_use block is not safe to act on until the stream closes and the full input_json has been accumulated. Acting on a partial block produces malformed tool inputs. The same retriable-versus-terminal failure handling from the failure screen applies here: a stream that breaks mid-response is a transient failure and the whole request should be retried, not the partial output passed downstream.

## Prompt caching: reusing the work already done on a stable prefix

Before the model generates anything, it processes your input: it breaks the prompt into tokens and builds the internal representations it needs to attend over them. On an ordinary request, that processing work is discarded once the response comes back. When your next request repeats the same content, the same processing runs again from scratch. The lever that removes that repeated work is prompt caching.

Prompt caching stores the processing work for a stretch of content so a later request can read it back rather than recompute it. The first request writes the work to a cache, and follow-up requests that send the same content up to a marked point read from that cache instead of reprocessing. Cache writes are billed at a premium over base input tokens, 1.25x for the 5-minute TTL, 2x for the 1-hour, while cache reads cost a fraction of standard input (0.1x), so the economics only work when reads outnumber writes. That is also why caching fits stable, frequently reused prefixes: the more requests that hit the same cached content, the lower the blended cost and latency across the batch.

Caching can be set up automatically or with explicit breakpoints. In automatic mode, you add a single cache flag at the top level of your request and the system manages breakpoints as the conversation grows, this is the recommended starting point for most use cases. With explicit breakpoints, you place a cache_control marker on a specific content block, and the model caches all the work up to and including that point. Either way, content after the last breakpoint is processed normally. The components most worth caching are the ones that stay the same between requests: a long system prompt and a large tool schema are the usual candidates, since they rarely change while the user message changes every turn.

Three properties decide whether caching helps with a given workload:

- 1The cached content must be identical. The cache is matched on an exact prefix, so any change before the breakpoint, even adding a single word like "please," invalidates the cache and forces a full reprocess. This is why caching fits stable content and works against anything that must reflect live state, because content that changes every request never produces a cache hit.

- 2The same content must recur and recur soon. The default cache lifetime is five minutes, refreshed on each hit. A one-hour lifetime is available at additional cost. The saving only lands when the same prefix is sent again within that window. A prefix reused several times a minute pays off, while one reused once an hour does not under the default TTL, because the cache has expired before the next request arrives.

- 3The cached prefix must be long enough to clear the minimum. There is a minimum length threshold for caching, and it varies by model. Shorter prompts see no benefit regardless of how stable they are. The longer and more stable the prefix, the more processing work the cache reuses, which is why caching is most effective on high-volume systems carrying a long, fixed system prompt.

There is one tradeoff to weigh against the saving. Caching assumes the cached content is still correct on the later request. If the prefix needs to reflect data that can change, the cache holds a version that may be stale for as long as it lives. That is a consistency window your use case must be able to tolerate. For a fixed system prompt and a stable tool schema there is nothing to go stale, which is why those are safe and high-value places to cache.

## The Batches API: trading latency for a lower bill

Some work does not need an answer immediately. An overnight classification run, a backfill over a large dataset, or a scheduled report can all wait. For that kind of work, the Message Batches API processes requests asynchronously, and in exchange it costs less per request than the same calls made one at a time. The cost reduction is significant enough that it is the deciding lever for any non-urgent, high-volume task. The current discount is version-pinned, so confirm it against the reference layer at build time.

The trade is latency for cost. You submit a batch and results come back within an asynchronous completion window rather than immediately. A batch is the wrong tool for anything a user is waiting on and the right tool for anything driven by a schedule. The decision mirrors streaming in reverse: streaming optimizes how fast a single response feels for a user in the loop, while batching optimizes the bill for work where no user is waiting. The two levers never compete for the same request, because a request is either user-facing, or it is not.

Batching and prompt caching compound when a non-urgent job reuses the same context across many requests. The batch discount lowers the cost of each request and caching lowers the cost of the repeated prefix inside each one, so a scheduled job carrying a long fixed system prompt benefits from both. That combination is exactly what the cost-and-orchestration checkpoint later in this module asks you to recognize.

## Multi-agent orchestration as a deliberate tradeoff

In an orchestrator-worker pattern, a lead agent decomposes a task into subtasks and delegates them to several subagents that work in parallel, each with its own context window. Once assignments are complete, they compile their results. In code, the structure consists of planning, a parallel fan-out, and synthesis.

async def orchestrate(task):
plan = await lead.plan(task) # lead agent decomposes
results = await gather(*[ # subagents run in parallel
worker.run(subtask) for subtask in plan.subtasks
]) # each spends its own tokens
return await lead.synthesize(results) # lead compiles the answer

This genuinely helps with large tasks that can be split into independent parts. For example, research across many separate sources, since the subagents can explore at the same time instead of one after another.

The way to hold this is as a hiring decision. Five researchers finish a broad survey faster than one, but you pay five salaries. You only hire a team when the work genuinely splits into parts people can do without waiting on each other.

Anthropic's own research system uses this pattern and has reported findings that define the tradeoff. On an Anthropic internal research eval, a multi-agent setup with Claude Opus 4 as lead and Claude Sonnet 4 subagents showed a substantial improvement over a single-agent Claude Opus 4 baseline on internal evals. The cost is roughly fifteen times the tokens of a normal chat interaction, because every subagent spends its own tokens against its own context.

The pattern is also less effective for tightly coupled tasks such as coding, where each step depends on previous parts and cannot be explored in parallel. Anthropic's analysis found that token usage accounts for most of the performance variance. The architecture works primarily because it buys more parallel computation.

Use it only when the task genuinely requires parallel exploration. A single agent with good context handles most work at a fraction of the cost. The multiplier also compounds when something misbehaves. A runaway subagent or an oversized tool result can push well past the fifteen times baseline before the request completes.

A rough cost estimation makes the tradeoff concrete. Suppose a single agent answers a research question in about ten thousand tokens. The orchestrator-worker version spins up a lead and four subagents, each reading its own slice of sources in its own context. The lead then synthesizes their returns. Anthropic reports that five contexts plus the synthesis pass use fifteen times the number of tokens. So, the same question costs on the order of a hundred and fifty thousand tokens.

If the question was a single lookup dressed up as research, you paid the multiplier for nothing, because four of the five contexts were doing work the task never needed. The number is neither inherently large nor small. Its value depends entirely on whether the task requires the additional agents.

There is a control dimension the cost estimation does not capture. Spreading work across agents multiplies the places a failure can occur, so each subagent needs the same retriable-versus-terminal handling, the same backoff, and the same fallback discipline from the failure screen, applied independently. A single subagent that hits a rate limit and has no backoff can stall the whole compilation step while the lead waits for a return that never comes. The orchestration pattern does not replace the failure-handling work, it multiplies it, which is another reason to use it only when the parallel exploration is worth that added surface area. A model choice detail also helps here: consider using more capable model as the lead agent and cheaper models for the subagents, so you are not paying top-tier rates across every parallel context. This reduces the cost multiplier while preserving the coordination quality where it matters.

## Reliability has a floor you tune cost within

Cost is only half of the budget. The other half is reliability, and it establishes a baseline below which the cost should not go.

The cheapest configuration is rarely the most reliable. Start by defining the base first, such as a retry budget and a latency ceiling, and then tune cost above it rather than below. Cutting costs beneath the reliability floor replaces a visible expense with silent failures. In production, this is often a worse trade because a slightly higher bill is easier to defend than a system that doesn't work.

A concrete version of the reliability floor makes the discipline clear. Suppose you decide a user-facing request must be completed within four seconds and may retry a failed dependency up to three times. Those constraints define the floor. Now, every cost optimization must satisfy these requirements. Switching to a smaller, cheaper model is fine if it still fits within the latency ceiling and does not increase the error rate up enough to burn the retry budget. Reducing the retry count to two to save costs on a slow dependency is not acceptable if it pushes the failure rate beyond what the floor allows. In this case, you would be exchanging a lower cost for more failed requests.

The floor is what keeps optimization honest: it forces every cost-saving change to demonstrate that it did not quietly trade reliability away. It also provides a clear boundary below which you do not cut, regardless of how attractive the savings may appear.

The order matters, because cost and reliability create opposing pressures, and cost is usually louder. A high bill shows up on a dashboard every day and generates constant pressure to reduce spending. A reliability problem shows up as occasional failures that are easy to dismiss as noise until they accumulate into an incident. If you optimize cost first and reliability second, the louder pressure wins, and you discover the reliability floor only after crossing it. Setting the floor first reverses that: reliability becomes the fixed constraint, and cost becomes the thing you optimize underneath it. The eval set from the earlier section is what makes the floor enforceable: a pinned baseline score defines the minimum acceptable reliability in a checkable form, so any cost-saving change that drops the score below the baseline fails the gate before it ships.

## The observability and orchestration reference you can keep open while you build

| Metric | Where to instrument it | Single-agent versus orchestrator-worker

| Token cost | Per call, aggregated per request and per flow. | A single agent incurs a token cost once per step. An orchestrator-worker multiplies token consumption by the number of subagents, roughly a 15x token multiplier in Anthropic's reported case. That multiplier applies to both input and output tokens, since each subagent receives its own context and generates its own output.

| Latency | Per call, with traces identifying the slowest step in the workflow. | Parallel subagents can reduce wall-clock time on independent work but add coordination latency to plan and compile.

| Error rate | Per call and per dependency. | More agents mean potential failure points, each subagent requires the same retry and fallback handling as a single agent.

Handles well
Makes spend and latency visible per call, so a cost problem traces to a named lever.

Adds cost or complexity
Parallel subagents multiply token cost, roughly by 15x in the reported case, before improving any answer.

Use a different approach
For tightly coupled work, such as coding, a single agent with good context beats fan-out.
