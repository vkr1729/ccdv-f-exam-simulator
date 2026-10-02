# Production Engineering, Evals & Security — Failure Handling & Model Selection — Watch Out

_Module 4, screen S09_

Watch Out
Failure Handling
6 min

## The call that never failed in development

Setup

In development, you called the endpoint a few dozen times and it returned cleanly every time, so there was no obvious reason to write an error path. That is the trap. Development traffic is low volume, runs on a stable connection, and rarely hits the conditions that cause a call to fail: rate limits, timeouts, transient network drops, or a malformed response underload. None of those show up when you are testing by hand, so the code that handles them never gets written. The first time the call fails is in production, and the failure appears as an unhandled exception rather than a recoverable error.

## Anecdote: the first rate-limit response took the whole request down

A developer building a customer-facing feature called the API in a loop. Every development run returned successfully because development traffic never came close to a rate limit. The code was written without any error handling, because up until now, nothing had ever failed there.

results = [] # collect each response

for item in batch:
# shipped version, no error path
resp = client.messages.create(model=MODEL, max_tokens=MAX_TOKENS, messages=msg(item))
results.append(resp.content) # assumes every call returns 200

The feature shipped. At the first traffic peak the API returned a rate-limit response, the unhandled error was raised and the whole request failed instead of waiting a moment and trying again. To the user it looked like the feature was simply broken. The developer's first instinct was to add immediate retries in a tight loop. This made it worse: each instant retry counted as another request against the same limit, deepening it. The real fix was the distinction from the teaching screen. The rate-limit response was retriable, so it needed exponential backoff with a capped number of attempts and a retry that honored the retry-after value when the response included one. Development never produced the failure, so the path that would know how to handle one was never written.

Why this broke

A retriable failure met code that had no error path, then met a hammering retry that deepened the limit. Sort the error as retriable, then back off with a cap, before traffic finds the gap for you.
