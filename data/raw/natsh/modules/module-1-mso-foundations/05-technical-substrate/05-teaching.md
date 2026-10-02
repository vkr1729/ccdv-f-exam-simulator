# MSO Foundations — Technical Substrate — Teaching

_Module 1, screen S05_

TeachingTechnical Substrate·12 min

# The technical substrate: SDKs, REST, streaming, async

SDK vs. REST
Sync, Streaming & Real-time
Async for High-Volume Work

### How a developer reaches Claude: SDK versus raw REST

At its core, Claude is reached over an HTTP REST API: your code sends a request to an endpoint with your API key and a JSON body, and reads a JSON response back. You can call that endpoint directly with any HTTP client. More commonly you use an official SDK, available for Python and TypeScript among others, which is a thin convenience layer over the same REST API. It handles authentication, request construction, retries, and response parsing so you write less boilerplate. The SDK and raw REST reach the same API and the same model. The SDK saves you from assembling requests by hand. Module 2 builds against the SDK and the Messages API, which sits on this same foundation.

### Synchronous, streaming, and real-time responses

A synchronous request is the simplest pattern: you send the request and wait for the complete response to come back in one piece, then act on it. That is fine for short responses and backend jobs where no one is waiting. When a response is long or a user is watching, streaming sends the response in pieces as the model generates it. Output appears immediately rather than after a blank-screen wait, and your code reassembles the pieces into the final message. Claude exposes streaming over the same HTTP connection using server-sent events. Module 2 teaches how to consume a stream safely and recover when it is interrupted.

### Asynchronous patterns for high-volume work

Two patterns address high-volume work, and they solve different problems.

The Python SDK exposes an async client (AsyncAnthropic) that uses non-blocking async/await to make API calls without tying up your application thread. In the TypeScript SDK the standard Anthropic client is Promise-based, so you await calls directly. There is no separate async client class. Either way the request still returns in real time, but your application can handle other work while it waits. This is the right pattern when you need concurrency without blocking.

The Message Batches API is a separate pattern for bulk offline workloads. You submit a large set of requests in one call, receive an identifier, and poll for completion. Batch jobs can take up to 24 hours to complete and run at a lower per-token cost in exchange for that latency. This suits offline pipelines, evaluation runs, and bulk jobs where no user is waiting on each result and cost matters more than turnaround time.
