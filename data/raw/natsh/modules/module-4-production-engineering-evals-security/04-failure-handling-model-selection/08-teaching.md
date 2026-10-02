# Production Engineering, Evals & Security — Failure Handling & Model Selection — Teaching

_Module 4, screen S08_

TeachingFailure Handling·12 min

# Surviving production failure: tool errors

Your tests now tell you a failure exists and the trace tells you where it happens. The next question is what the system does the moment a failure happens in live traffic.

Production introduces failures a prototype never sees. The difference between a resilient system and a fragile one is whether you decided in advance how each kind of failure is handled.

## Every failure starts with one question: is it retriable or terminal?

The test is a single question: would waiting and trying the exact same request again plausibly work? If yes, it is retriable. If not, it is terminal. A rate limit clears with time; a malformed request will fail identically until the request itself is fixed.

Production traffic produces failures development never shows you: rate-limit responses, timeouts, malformed tool results, and transient network errors. The first decision for any failure is whether a later attempt is likely to succeed. If so, the failure is retriable. If not, retrying only wastes time and budget, making it terminal. A rate-limit response or a temporary server overload is retriable, because the same request will probably go through in a moment. A malformed request or an authentication failure is terminal, because retrying the identical bad request changes nothing. Every subsequent handling decision depends on which bucket a failure lands in. On the Anthropic API, the status code tells you the bucket. A 429 means you hit a rate limit and a 529 means the service is temporarily overloaded, both are retriable. A 400 means a bad request and a 401 means an auth failure, both are terminal. Server errors in the 5xx range, including a 500 internal error and a 504 timeout, are also retriable, because they are Anthropic-side faults that typically resolve on retry.

RETRIABLE = {429, 529, 500, 502, 503, 504} # rate limit, overload, transient
TERMINAL = {400, 401, 403, 404} # bad request, auth, missing

def is_retriable(status):
return status in RETRIABLE # everything else fails fast

The reason this one distinction carries so much weight is that it determines whether waiting helps. A retriable error is one where the cause is transient: the service was momentarily over capacity, a connection dropped, or you briefly exceeded a per-minute limit. Time alone resolves it, so a later attempt is likely to succeed. A terminal error is one where the cause is in the request itself: a malformed body, an expired key, a model name that does not exist. Time changes nothing, because each request will produce an identical error. Retrying a terminal error wastes the retry budget and hides the actual problem behind a wall of identical failures. Each unnecessary retry consumes retry budget and increases the latency that a retriable failure elsewhere in the flow might have needed. Correct classification preserves the retry budget for failures that need it.

A few statuses sit on the line and are worth calling out. A timeout is usually retriable because the work may simply have taken longer than the client was willing to wait. Repeated timeouts on expensive requests is a signal to fix the request itself, not to retry it. A 500 from the service is retriable, because it is a server-side fault that often clears. A 403 is terminal, because it is a permissions problem that a retry cannot fix. When you are unsure, the safe default is to treat an error as terminal and raise it. A failure incorrectly classified as terminal fails loudly and gets fixed. A failure incorrectly classified as retriable hammers a service and hides the real problem behind a wall of retries.

## The SDK already retries some failures, so know what it covers before you write your own

Before you build a retry loop by hand, check what the SDK does for you. The Anthropic client libraries automatically retry transient failures with progressive retry delays, up to a configurable number of attempts. The point of knowing this is to avoid adding your own retries on top of the ones the SDK is already running. Two retry loops wrapped around the same call multiply attempts against a rate limit rather than capping them. Decide where the retry lives: either let the SDK handle transient cases and reserve your own code for application-specific fallbacks, or turn the SDK retries down and own the full path yourself. Running both layers retrying the same failure without either knowing about the other is the pattern to avoid.

The API also returns rate-limit headers on each response that tell you how much of your limit remains and when it resets. The most useful is retry-after, which a 429 or 529 response includes to tell you how long to wait before trying again. Honoring that value is more precise than guessing with backoff alone, because the service is telling you exactly when capacity returns. The corrected retry code later in this module reads retry-after first and falls back to exponential backoff only when the header is absent. Treat the header as the authoritative wait time when it is present, and treat your own backoff as the fallback when it is not. The specific header names and limit values are version-pinned, so confirm them against the reference layer at build time.

## Tool errors must come back to Claude explicitly rather than dropped

When your code runs a tool and that tool fails, the result should be returned to Claude with is_error explicitly set to true. It should not return as a silent empty result. With the error returned, the model can react: try a different approach, ask for clarification, or stop. A tool that drops its own error and returns nothing produces a confident yet wrong answer downstream. This is because the model treats the empty result as valid data and continues reasoning on top of it. A visible failure is far easier to catch than a confident but incorrect answer built on missing data.

def run_tool(tool_use):
try:
result = execute(tool_use)
return {"type": "tool_result", "tool_use_id": tool_use.id,
"content": result}
except Exception as e:
# surface the error so Claude can react, do NOT return empty
return {"type": "tool_result", "tool_use_id": tool_use.id,
"is_error": True, "content": f"Tool failed: {e}"}

def run_tool(tool_use):
# A refusal is a 200 at the HTTP layer, the retriable classifier will not catch it
if response.stop_reason == "refusal":
raise ValueError("Model refused the request. Review input before retrying.")

With is_error set, the model knows the tool failed and can react. Without it, the model treats the empty result as valid data and continues on a false premise.

## The error-handling decision table you can keep open while you build

| Error type | Retriable or fail-fast | Backoff strategy | Fallback behavior

| Rate limit (429) | Retriable | Exponential backoff with jitter, honor retry-after, capped attempts. | After the cap, raise a clean error or route to a cached or simpler result.

| Overloaded (529) | Retriable | Backoff; a 529 reflects Anthropic-side load, so it is not a rate-limit signal. | Fail over to a fallback path or return a graceful error if it persists.

| Bad request (400) | Fail fast | No retry. The identical request will fail again. | Fix or reject the input and surface the error to the caller.

| Tool result error | Depends on the tool | Retry only if the underlying cause is transient. | Return the error flag to Claude so the model can react, never silence it.

| Refusal (200, stop_reason: "refusal") | Fail fast | No retry. The model made a content decision, not a transient error. | Raise the refusal to the caller. Log it. Do not silently retry or treat it as valid output.

Handles well
Keeps one bad response from cascading into an outage by handling each failure type by name.

Adds cost or complexity
Every failure path is code you write, test, and maintain on top of the happy path.

Use a different approach
Do not retry a terminal error. Retrying a 400 does nothing but waste the retry budget.
