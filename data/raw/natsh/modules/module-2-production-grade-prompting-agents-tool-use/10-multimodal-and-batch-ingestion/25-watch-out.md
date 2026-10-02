# Production-Grade Prompting, Agents & Tool Use — Multimodal and Batch Ingestion — Watch Out

_Module 2, screen S25_

Watch OutMultimodal and Batch Ingestion·4 min

## The batch job that was not actually a batch

Setup

Splitting a job into chunks and processing them one after another is not batching; it is serialization with extra steps. The Message Batches API exists for high-volume workloads precisely because looping over inputs against the synchronous API runs into rate limits the moment the volume gets real, no matter how you slice the input list.

### An internal channel conversation about a nightly job that kept hitting rate limits

A developer has been re-running the same nightly classification job for three nights and keeps hitting rate-limit errors at around the same point each time. The senior developer asks one question that surfaces the actual problem.

Developer: "My nightly job keeps hitting rate limits. I've already split it into smaller chunks. What else can I do?"

Senior Developer: "How are you submitting them?"

Developer: "I'm looping over the list and calling the API for each item."

Senior Developer: "That is not batching. That is serial calls against the synchronous endpoint. Splitting the list into chunks does not change what the API sees: it still sees one request per item, back to back."

Developer: "So the rate limit is firing because I am making thousands of synchronous calls?"

Senior Developer: "Right. The Message Batch API takes up to 100,000 requests or 256 MB per batch in a single batch call, returns a batch_id, and processes them asynchronously. You poll for completion, which means your code repeatedly checks the status of the batch on a schedule until the API tells you it's done. The per-token cost is lower than synchronous, and the rate limit does not fire because you are not making thousands of individual requests."

Developer: "And the tradeoff?"

Senior Developer: "Latency is non-deterministic. Batch processing can take hours. If this were a real-time user interaction, it would be the wrong tool. However, this is perfect for a nightly classification run."

What to Watch Out for

Chunking a list and looping over the synchronous API is not batching, even though it feels like it should be. It produces the same number of API calls as the un-chunked version and runs into the same rate limits. The Message Batches API is a different submission model, not a smaller batch size. Use it whenever the workload is high-volume and offline and reach for the synchronous API only when a user is waiting on the other end. Results return in arbitrary order, not the order requests were submitted in. Use the custom_id field on each request to match results back to inputs.
