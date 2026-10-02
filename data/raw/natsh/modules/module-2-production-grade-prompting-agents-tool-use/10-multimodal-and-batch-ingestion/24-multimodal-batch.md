# Production-Grade Prompting, Agents & Tool Use — Multimodal and Batch Ingestion — Multimodal & Batch

_Module 2, screen S24_

TeachingMultimodal and Batch Ingestion·13 min

# Images, PDFs, and high-volume processing

Up to now you've been managing what Claude remembers between turns. Multimodal ingestion shifts the question to what you're sending in: every image and PDF consumes context budget before Claude reads a single character of your prompt, which changes how you structure requests and what you can fit in one. The second half of this topic deals with the opposite end of the same problem. When you have thousands of inputs to process, sending one request at a time and waiting for each response stops making sense, and the Batch API is how you handle that volume without blocking your application.

## Image token cost: Calculate before you commit

Images are not free in terms of context budget. Claude views images in patches: each 28×28-pixel block of the image is one visual token, so an image costs ⌈width / 28⌉ × ⌈height / 28⌉ visual tokens. A 1,000 × 1,000 pixel image is ⌈1000/28⌉ × ⌈1000/28⌉ = 36 × 36 patches, about 1,296 visual tokens. At that rate, ten high-resolution screenshots consume as much context as a detailed system prompt. Each model also has a maximum native image resolution, expressed as a long-edge limit and a visual-token limit, and these limits differ by model tier. The newest models accept substantially larger images than the standard tier. Images larger than either limit are downscaled before processing, so the formula runs on the scaled dimensions. Confirm the current per-tier limits against the Vision page (Resolution and token cost) at build time; the limits have changed between model generations and will again.

The calculation matters at design time. If you are building a pipeline that processes images, measure the token cost of a typical production image against your model's context limit before you write the ingestion code. The fix for an over-budget pipeline is often a ten-minute image resize step. If you discover this after deployment, it takes even longer.

## Different ways to send an image: When each is right

Inline base64
URL reference
Files API

How it works: Encode the image bytes as a base64 string and include the data directly in the message block.

Overhead: The full encoded payload travels with every request, which inflates request size and counts against latency on large images.

When to use: Best for one-off images where adding an upload step would add complexity without a payoff. The same image sent repeatedly multiplies the cost, so reach for a different method if reuse is likely.

How it works: Pass a publicly reachable URL in the source block, and Claude fetches the image at request time.

Overhead: No payload travels with the request, but you take on the dependency that the URL must be stable, public, and reachable at the moment Claude tries to fetch it.

When to use: Best when the image is already hosted at a stable public URL you control. Skip it for anything behind auth, anything signed with a short expiry, or anything you can't guarantee will be reachable when the request runs.

How it works: Upload the file once through a separate API call, receive a `file_id`, and reference that ID in any future message.

Overhead: The upload is a one-time cost; every later request carries the ID instead of the bytes, so payload overhead drops to near-zero from that point on. Currently in beta and not available on Bedrock or Vertex AI; verify availability for your deployment platform.

When to use: Best when the same image or PDF appears across multiple requests, or when the asset is large enough that re-sending it would dominate request size. Also, the cleanest choice when you want asset management to live separately from inference calls, and the right choice for images that appear across multiple conversation turns, since the file_id carries no payload weight as history grows.

## Sending PDFs: The document block

For PDFs, the block type is `document` rather than `image`. The source structure follows the same pattern as images, which means it can be base64, a URL, or a Files API `file_id`. There is no required `name` field on a document block. The block accepts an optional `title` field for a readable document name, and an optional `context` field for additional metadata, but neither is required to send a PDF. All other mechanics, including token cost considerations and Files API reuse, apply in the same way.

{
"type": "document",
"source": {
"type": "base64",
"media_type": "application/pdf",
"data": "<base64-encoded-pdf-bytes>"
},
"title": "contract_review.pdf"
}

## Applying prompting techniques to multimodal inputs

The same prompting techniques from the first section apply to image and PDF analysis. A bare "describe this image" prompt produces shallow output for the same reason a bare text prompt does as Claude has no target structure to aim for.

The difference is that images carry ambiguity that text cannot, which includes overlapping objects, depth and spatial relationships, and partial occlusion. A prompt for visual analysis should name how Claude should handle each type of ambiguity. "If objects overlap, describe each separately and note the overlap" is a concrete constraint that a text-only prompt would never need.

## The Message Batches API: High-volume asynchronous processing

When you need to run the same prompt pattern against hundreds or thousands of inputs, the synchronous API is the wrong model. Each synchronous call blocks until complete. At scale, that means your application is either burning threads or running thousands of concurrent connections against rate limits.

The Message Batches API accepts up to 100,000 or 256 MB requests (whichever comes first) in a single batch call. You submit the batch, receive a `batch_id`, and poll for completion. When the batch finishes, you download the results. The per-token cost for batch requests is lower than for synchronous ones.

The tradeoff is latency: batch processing is non-deterministic and can take up to 24 hours, often much faster. The pattern suits offline pipelines, evaluation runs, and data processing jobs, not real-time user interactions.

| Use case | Right API pattern | Why

| A user uploads a photo and expects an immediate classification | Synchronous API | Real-time response is required. Batch latency is unacceptable for interactive use.

| A nightly pipeline classifies 5,000 customer records | Message Batches API | Latency is not a constraint. Batch cost reduction and asynchronous processing are both valuable.

| An evaluation run tests a new prompt against 2,000 examples | Message Batches API | Offline task with no real-time requirement. Batch is the correct pattern.

| A chatbot generates a reply to a user's message | Synchronous API | User is waiting; batch would introduce unacceptable delay.

## When multimodal and batch fit together, and when they don't

The combination works for offline workloads that reuse the same assets and need structured output across thousands of inputs. A nightly pipeline classifying images against a fixed taxonomy is the textbook case: Files API removes redundant uploads, Batches API absorbs the latency, structured-output techniques keep results machine-readable.

Two failure modes break the fit.

- The first is misreading latency: reaching for batch in any user-facing flow with an image produces a system that passes tests and fails in production, because the user is waiting and the batch isn't.

- The second is underestimating context cost: images and PDFs consume budget before Claude processes any text, so pipelines loading multiple large images per request blow past token limits at scale. Measure token cost on production-scale inputs before you build.
