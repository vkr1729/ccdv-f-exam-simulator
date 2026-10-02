# MSO Foundations — How LLMs Behave — Teaching

_Module 1, screen S02_

TeachingHow LLMs Behave·12 min

# How LLMs behave: tokens, context, sampling, non-determinism

Tokens
Context Window
Sampling
Non-determinism

### Tokens: the unit of input, output, and cost

Claude does not read characters or words directly. It reads tokens, and the characters-per-token average depends on the tokenizer of the model at hand and differs between model generations. Treat any chars-per-token rule of thumb as model-dependent and confirm current tokenizer behavior at build time. Everything the model processes is counted in tokens: your prompt, the conversation history, tool definitions, tool results, and the response the model generates. Tokens are the unit of both pricing and budget, so when you estimate what a feature costs or whether an input fits, you are counting tokens, not words. A useful habit is to think in tokens, since that is the unit the API bills in and the context window measures.

### The context window: a fixed budget

The context window is the total number of tokens the model can take in for a single request. It holds everything at once: the system prompt, the full conversation so far, any documents you inject, every tool result, and the model output. It is a fixed budget with two distinct edge behaviors. A request whose input is already larger than the window is rejected with a validation error before generation begins. A request that fits on input can still reach the ceiling during generation. Current models then stop and return the output generated so far with a model_context_window_exceeded stop reason rather than raising an error. Either way, keeping a long session running requires the application to trim or summarize history before each call. In development, the window rarely fills because test inputs are short. In production, on the other hand, longer inputs and more turns fill the window faster. This is the failure Module 2 explores in detail.

### Sampling: why the same prompt can give different answers

A language model does not pick one fixed next token. At each step it produces a probability distribution over possible next tokens and then samples from it. Settings, such as temperature, shape that distribution: a lower temperature concentrates probability on the most likely tokens and makes output more repeatable, while a higher temperature spreads it out and makes output more varied. Because the choice is sampled rather than fixed, the same prompt run twice can return different wording even when both answers are correct. This is a property of how the model generates. Note that sampling controls are model-dependent: the newest Claude models do not accept non-default sampling parameters. Setting temperature, top_p, or top_k returns a 400 error, and behavior on those models is steered through prompting instead. Even where temperature is accepted, temperature 0 makes outputs more repeatable but does not guarantee identical outputs across calls. Confirm current parameter support in the API reference at build time.

### Non-determinism: what it means for testing and evals

Non-determinism is the primary consequence of sampling: identical inputs do not guarantee identical outputs. That changes how you test a Claude feature. A test that asserts the exact text of a response will be inconsistent, because the model can express the same correct answer many ways. Instead, assert on the property that must hold: a required field is present, a value is in range, the structure parses. When you need to judge meaning rather than structure, use an eval with a model-graded judge. This is why the course treats evals as the standard for knowing a feature is correct, and why Module 3 builds that capability.
