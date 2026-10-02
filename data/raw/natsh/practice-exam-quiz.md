# Claude Certified Developer – Foundations: Practice Exam Quiz

Practice questionnaire built from the official prep course (5 modules) for team exam preparation. Questions marked from original course checkpoints are adapted to exam format; the rest are new items written in the same style. **This is a study aid, not real exam content.**

## About the real exam (from the official Exam Guide, v1.0)

| | |
|---|---|
| Exam code | CCDV-F |
| Items | 53 (multiple-choice and multiple-response) |
| Time limit | 120 minutes |
| Passing score | 720 (scaled 100–1,000) |
| Delivery | Proctored (online or test center, Pearson VUE) |
| Validity | 12 months |

## Official domain weights and where they're covered

| # | Exam Domain | Weight | Primarily covered in |
|---|---|---|---|
| 1 | Agents and Workflows | 14.7% | Module 2 |
| 2 | Applications and Integration | **33.1%** | Modules 1, 3, 5 |
| 3 | Claude Code | 3.1% | Module 3 |
| 4 | Eval, Testing, and Debugging | 2.6% | Module 4 |
| 5 | Model Selection and Optimization | **16.8%** | Modules 1, 4 |
| 6 | Prompt and Context Engineering | 11.0% | Modules 1, 2 |
| 7 | Security and Safety | 8.1% | Module 4 |
| 8 | Tools and MCPs | 10.6% | Modules 2, 3 |

**How to use the weights:** this quiz has 20 questions per module (100 total) so every module gets full coverage. Each question is tagged with its exam domain. When prioritizing study time, weight your effort by the table above — Applications & Integration plus Model Selection & Optimization together account for ~50% of the real exam, while Claude Code and Eval/Testing/Debugging together are under 6%.

**Suggested timing for a realistic run:** the real exam averages ~2¼ minutes per item. Try 45 minutes per 20-question module block.

---


## Module 1: MSO Foundations (Q1–Q20)

#### Q1 · Domain 5 — Model Selection and Optimization
A teammate insists that two identical prompts sent to Claude must return identical text. What is the most accurate response?

A. That is true; the model is deterministic.
B. Not necessarily; the model samples each next token from a probability distribution, so wording can vary even when both answers are correct.
C. That is only true if streaming is off.
D. That is only true on the largest model.

#### Q2 · Domain 5 — Model Selection and Optimization
A developer asks whether enabling extended thinking means they are switching to a different model. Which statement best separates model choice from reasoning mode?

A. They are the same setting.
B. Extended thinking is a different model.
C. Model choice picks which member of the family runs; extended thinking is a per-call setting that any supporting model can run with on or off.
D. Reasoning mode is fixed per account.

#### Q3 · Domain 6 — Prompt and Context Engineering
A short, well-specified classification task already returns the right answer zero-shot. What does adding three worked examples to the prompt most likely do?

A. Improves accuracy substantially.
B. Adds token cost on every call for little or no gain.
C. Changes the model being used.
D. Disables sampling.

#### Q4 · Domain 2 — Applications and Integration
A team must process thousands of inputs offline at the lowest possible cost, with no user waiting on results. Which request shape fits?

A. Synchronous calls in a loop.
B. Streaming.
C. Batch submission with polling.
D. A larger context window.

#### Q5 · Domain 5 — Model Selection and Optimization
A developer runs the same classification task repeatedly at temperature 0, then again at a high temperature, on a model that accepts sampling parameters. What behavior should they expect across repeated runs?

A. At low temperature the model concentrates probability on the most likely tokens, so runs return the same label far more consistently — though identical output is never guaranteed, even at temperature 0; at high temperature the distribution spreads and wording or even the label can vary.
B. Both configurations return identical output every run, because temperature only affects response length.
C. The high-temperature run is more accurate, because spreading the distribution lets the model consider more correct answers.
D. Temperature has no effect on classification, because classification always returns a fixed label regardless of sampling.

#### Q6 · Domain 6 — Prompt and Context Engineering
A task keeps returning output in the wrong structure under a zero-shot prompt despite added instruction text. What changes if the developer switches to multi-shot prompting?

A. The examples retrain the model on the new structure, so the fix is permanent across all future calls.
B. Two or three correct input-output examples show the model the exact structure to match, which usually fixes a structure problem that more instructions did not — at the cost of extra tokens on every call, so add the fewest examples that make output reliable.
C. Multi-shot will not help a structure problem; only raising the temperature changes the shape of the output.
D. Multi-shot lowers token cost per call, because examples let the model produce shorter responses.

#### Q7 · Domain 2 — Applications and Integration
A pipeline must process 50,000 documents overnight with no user waiting on any individual result. Which request shape fits, and why?

A. A synchronous loop, because one call per document is the simplest pattern and avoids batch overhead.
B. Streaming, because receiving each response in pieces lets the pipeline start processing sooner.
C. The batch pattern: submit the requests in a batch and poll for completion, accepting longer latency for a lower per-token cost; a synchronous loop would hit rate limits, and streaming buys nothing with no user watching.
D. A larger context window, so all 50,000 documents fit into a single request.

#### Q8 · Domain 5 — Model Selection and Optimization
A long multi-turn agent session keeps accumulating history and tool results. What symptoms should the team expect, and which budget is at fault?

A. The model silently drops the oldest turns to make room, so the session continues but quietly loses early context.
B. The context window is a fixed token budget: an already-oversized input is rejected with an error before generation, while a request that reaches the ceiling mid-generation returns truncated output with a model_context_window_exceeded stop reason — so a session that ran fine in testing can fail once inputs grow, and the application must trim or summarize history.
C. The symptom is slower sampling, and the budget at fault is the temperature setting, which must be lowered as the session grows.
D. There is no fixed budget; the window expands automatically to hold whatever history accumulates.

#### Q9 · Domain 5 — Model Selection and Optimization
A developer estimates feature cost by counting the words in prompts and expected responses. Why does the module recommend thinking in tokens instead?

A. Tokens only measure output, so word counts overestimate cost.
B. Every token is exactly four characters on every model generation.
C. Tokens are the unit the API bills in and the context window measures, and everything the model processes — prompt, history, tool definitions, tool results, and output — is counted in tokens.
D. Tokens only matter when streaming is enabled.

#### Q10 · Domain 5 — Model Selection and Optimization
A team is deciding which Claude model tier to use for a new production workload. Which TWO statements reflect the module's guidance? (Select TWO.)

A. Sonnet is the balanced default for most production workloads.
B. Haiku is the most capable tier, built for the most demanding reasoning work.
C. Move up a tier only when an eval shows the current tier missing the quality bar, and move down to Haiku only when an eval shows the quality drop is acceptable.
D. Opus is built primarily for speed and cost efficiency on simple tasks.
E. Model identifiers never change, so there is no need to confirm the lineup in the docs.

#### Q11 · Domain 5 — Model Selection and Optimization
A developer on the newest Claude models wants deeper reasoning on hard requests. According to the module, how is reasoning depth tuned?

A. By setting a fixed budget_tokens value, the recommended control on the newest generations.
B. By switching to a different model, since reasoning mode and model choice are the same setting.
C. By raising the temperature so the model explores more possibilities.
D. Through adaptive thinking's effort setting — the model decides when and how much to think — while the older budget_tokens control is deprecated and returns a 400 error on the newest generations.

#### Q12 · Domain 5 — Model Selection and Optimization
A team migrates to one of the newest Claude models, and a request that sets temperature to a non-default value now fails with a 400 error. What explains this?

A. Temperature must now be set through the SDK rather than raw REST.
B. The newest Claude models do not accept non-default sampling parameters; setting temperature, top_p, or top_k returns a 400 error, and behavior is steered through prompting instead.
C. The 400 error indicates the context window was exceeded.
D. Temperature has become an account-level setting that cannot be sent per request.

#### Q13 · Domain 5 — Model Selection and Optimization
A CI suite that asserts the exact text of Claude's responses passes and fails intermittently even though the answers are semantically correct. What is the recommended fix?

A. Assert on the property that must hold — a required field is present, a value is in range, the structure parses — and use an eval with a model-graded judge when meaning must be assessed.
B. Set temperature to 0, which guarantees identical outputs across calls.
C. Rerun the failing tests until they pass.
D. Disable streaming, which is the source of the variation.

#### Q14 · Domain 5 — Model Selection and Optimization
A developer must estimate whether a request will fit within the model's context window. Which TWO items count against that token budget? (Select TWO.)

A. The HTTP status code of the response.
B. Tool definitions and tool results included in the request.
C. The API key sent in the request header.
D. The full conversation history sent with the request.
E. The server region the request is routed to.

#### Q15 · Domain 2 — Applications and Integration
A developer is choosing between calling Claude's REST endpoint directly with an HTTP client and using an official SDK. Which TWO statements are accurate? (Select TWO.)

A. The SDK reaches a more capable version of the model than raw REST.
B. The SDK is a thin convenience layer that handles authentication, request construction, retries, and response parsing.
C. Streaming requires raw REST; SDKs support only synchronous calls.
D. Using the SDK removes token-based billing.
E. The SDK and raw REST reach the same API and the same model.

#### Q16 · Domain 2 — Applications and Integration
Users of a chat interface stare at a blank screen while long responses generate. Which change addresses this?

A. Stream the response over server-sent events so output appears as the model generates it, with the client reassembling the pieces into the final message.
B. Move the workload to the Message Batches API for a lower per-token cost.
C. Use a model with a larger context window.
D. Switch from the SDK to raw REST, which returns responses faster.

#### Q17 · Domain 2 — Applications and Integration
A Python backend must make many concurrent real-time Claude calls without tying up its application thread; each result goes back to a waiting user. Which pattern fits?

A. The Message Batches API, since it accepts many requests in one call.
B. The AsyncAnthropic async client with non-blocking async/await — requests still return in real time, but the application can handle other work while waiting.
C. A synchronous loop that issues one call at a time.
D. Importing the TypeScript SDK's separate async client class into the Python service.

#### Q18 · Domain 6 — Prompt and Context Engineering
A team notices a smaller, cheaper model fails to match a required output structure zero-shot, while a larger model succeeds zero-shot. What cost-conscious approach does the module suggest?

A. Always use the larger model, since prompting cannot compensate for capability differences.
B. Fine-tune the smaller model on the required structure.
C. Raise the smaller model's temperature until the structure appears.
D. Add a few worked examples to the smaller model's prompt — examples can let a cheaper model do the job — and keep the simplest model-and-examples combination that meets the eval.

#### Q19 · Domain 5 — Model Selection and Optimization
A team enables a high reasoning effort on every request, including simple lookups and classification calls. What does the module predict?

A. Quality improves uniformly across all tasks at no additional cost.
B. Reasoning is automatically disabled for simple tasks, so nothing changes.
C. Wasted cost on the simple calls — reasoning earns its cost on hard, multi-step problems and is wasted on lookups and classification.
D. The simple requests begin returning 400 errors.

#### Q20 · Domain 5 — Model Selection and Optimization
A developer on the newest Claude models wants to display the model's reasoning to end users, but no thinking content appears in responses. Why?

A. Thinking content is omitted from responses by default on the newest models; the developer must request summarized display when it needs to be shown.
B. Thinking is only available on the Haiku tier.
C. Thinking content is only returned over raw REST, not through the SDK.
D. The model never thinks unless a budget_tokens value is set.

### Answer key — Module 1

**Q1: B** — Sampling makes generation non-deterministic: the model samples each next token from a probability distribution, so wording can vary even when both answers are correct. This is why tests assert on properties and meaning rather than exact text.
**Q2: C** — Model choice picks which member of the family runs; extended thinking is a per-call setting. The two levers are independent but compose.
**Q3: B** — Add examples when the output shape is wrong, not when zero-shot already works; each example costs tokens on every call for little or no gain here.
**Q4: C** — Batch trades latency for lower per-token cost and avoids the rate limits a synchronous loop would hit; streaming and a bigger window solve different problems.
**Q5: A** — Lower temperature concentrates probability on the most likely tokens, making repeated runs far more consistent — though identical outputs are never guaranteed, even at temperature 0. Higher temperature spreads the distribution so wording and even the label can vary.
**Q6: B** — Examples in the prompt are not training and do not lower cost; they demonstrate the exact output shape and add tokens on every call, so add the fewest that make output reliable.
**Q7: C** — With no user waiting, the Message Batches API fits: submit in one call, poll for completion, and accept up to 24 hours of latency for a lower per-token cost. A synchronous loop hits rate limits at this volume; streaming only helps when someone is watching.
**Q8: B** — The context window is a fixed budget: oversized input errors before generation, and hitting the ceiling mid-generation returns truncated output with a model_context_window_exceeded stop reason. History is never silently dropped, so trimming or summarizing is the application's job.
**Q9: C** — Tokens are the unit of both pricing and budget; the prompt, history, tool definitions, tool results, and output are all counted in tokens. Chars-per-token averages are model-dependent, so word counts are the wrong unit.
**Q10: A, C** — Sonnet is the balanced production default, and tier moves in either direction should be driven by evals. Fable (not Haiku) is the most capable tier, Haiku is built for speed and cost, and the lineup should be confirmed in the docs at build time.
**Q11: D** — On current models the reasoning mode is adaptive thinking, tuned with an effort setting rather than a fixed token budget; budget_tokens is deprecated and returns a 400 error on the newest generations.
**Q12: B** — The newest Claude models do not accept non-default sampling parameters — temperature, top_p, or top_k return a 400 — and repeatability is managed through prompt design instead.
**Q13: A** — Because sampling makes outputs non-deterministic, exact-text assertions are unreliable. Assert on properties that must hold (field present, value in range, structure parses) and use a model-graded eval to judge meaning.
**Q14: B, D** — The context window holds everything at once: system prompt, full conversation history, injected documents, tool definitions, tool results, and the model's output. Transport details like status codes, API keys, and regions are not part of the token budget.
**Q15: B, E** — The SDK is a thin convenience layer over the same REST API handling auth, request construction, retries, and parsing; both paths reach the same API and the same model, and SDKs fully support streaming.
**Q16: A** — When a user is watching, streaming sends the response in pieces over server-sent events so output appears immediately instead of after a blank-screen wait; the client reassembles the final message.
**Q17: B** — The Python SDK's AsyncAnthropic client uses non-blocking async/await for real-time concurrency without tying up the thread. Batches is for bulk offline work with no user waiting, and the TypeScript SDK has no separate async client class (its standard client is Promise-based).
**Q18: D** — Prompting mode and model choice are related levers: adding a few examples can let a cheaper model match a structure a larger model gets zero-shot. Try the simplest model and fewest examples that meet the eval.
**Q19: C** — Reasoning earns its cost on hard, multi-step problems and is wasted on lookups and classification, so high effort on every call burns tokens with no quality gain on the simple ones.
**Q20: A** — On the newest models thinking content is omitted from responses by default; developers must request summarized display when they need to show it.

---


## Module 2: Production-Grade Prompting, Agents & Tool Use (Q21–Q40)

#### Q21 · Domain 6 — Prompt and Context Engineering
A developer builds a support ticket processor with the system prompt "You are a support ticket processor. Extract the key information from the ticket below." Claude returns plausible but inconsistent output — sometimes prose, sometimes JSON with varying field names — and the downstream parser keeps breaking. What structural piece is missing from the prompt?

A. Extended thinking, so the model reasons about the ticket before extracting fields
B. An output constraint specifying the exact JSON structure, field names, allowed values, and an instruction to return nothing else
C. A higher max_tokens value so the full extraction is never truncated
D. Additional paragraphs describing each ticket category in more detail

#### Q22 · Domain 6 — Prompt and Context Engineering
A developer has revised a classification prompt five times. Each pass adds more descriptive text, yet the output keeps drifting — and the now-verbose prompt is producing verbose, high-latency responses. According to the module's iteration guidance, what should the developer do next?

A. Add two more paragraphs covering the remaining edge cases and a reminder to be precise
B. Restate "Be concise" and "Use only the category name" more forcefully at the end of the prompt
C. Stop adding text, diagnose the failure type, and replace the descriptions with an output constraint plus few-shot examples
D. Switch to a more capable model tier so the longer prompt can be followed reliably

#### Q23 · Domain 6 — Prompt and Context Engineering
A team enables structured outputs by setting `output_config.format` with a `json_schema` so Claude's responses are constrained at generation time. Which statement about this configuration is accurate?

A. Every response is now guaranteed to parse, so the team can remove all response validation code
B. The schema constraint can be combined with prefilling the assistant message to further steer the response
C. Schema compilation adds the same latency to every request, since compiled grammars are never cached
D. The code must still check stop_reason, because a refusal or a max_tokens truncation can still return output that does not match the schema

#### Q24 · Domain 6 — Prompt and Context Engineering
A team must classify 50,000 support tickets into three labels in an overnight run and is deciding whether to enable extended thinking. What is the correct call?

A. Enable it at high effort so every classification is maximally accurate
B. Enable it with a small budget_tokens value to cap the reasoning cost per ticket
C. Leave it off — a one-word label needs no reasoning pass, and thinking tokens would multiply output cost across 50,000 calls with no accuracy gain
D. Enable it only for the first 1,000 tickets to calibrate the effort setting

#### Q25 · Domain 6 — Prompt and Context Engineering
An agent uses extended thinking in a tool-use loop. To save context, a developer strips the thinking blocks out of conversation history before each subsequent request, and the API begins rejecting requests. Why, and what is the correct approach?

A. Thinking blocks are billed on re-submission; the fix is to summarize them instead of removing them
B. Each thinking block carries a signature verifying it was not modified; blocks must be returned unchanged, and accumulated-context pressure should be managed with context engineering instead
C. The API requires thinking blocks only on the first turn; the developer stripped them one turn too early
D. Redacted thinking blocks may be dropped but normal thinking blocks may not, and the developer dropped both

#### Q26 · Domain 8 — Tools and MCPs
In a session trace, the assistant turn issues a tool_use block with id="toolu_01" for get_account_balance. The next user turn returns a tool_result with tool_use_id="toolu_02" and the correct balance content. The following request fails with invalid_request_error: "tool_result block references unknown tool_use_id." What is the targeted fix?

A. Update the description on get_account_balance to add an exclusion condition
B. Correct the tool_use_id on the tool_result block so it matches the id issued in the assistant turn
C. Add a required array to the tool's input_schema so account_id cannot be omitted
D. Move the tool_result block into an assistant-role turn, since the application generated its content

#### Q27 · Domain 8 — Tools and MCPs
A developer registers search_docs ("Use this to find information about the product") and get_context_summary ("Use this to retrieve relevant information from the current session"). Claude repeatedly calls search_docs when the answer is already in context. What is the fix the module prescribes?

A. Rename the tools so their names are more distinct, since names are Claude's primary routing signal
B. Always merge any two retrieval tools into one tool with a type parameter
C. Add exclusion conditions to both descriptions — one sentence saying when to use each tool and one saying when not to — so Claude has a decision boundary
D. Expand each description with several paragraphs of product detail so Claude has more signal

#### Q28 · Domain 8 — Tools and MCPs
A team is authoring tool schemas for a production agent. According to the module's schema-design guidance, which TWO practices are correct? (Select TWO.)

A. Mark a field as required only when the tool call does not make sense without it
B. Write each description in two parts: when to use the tool and when not to use it
C. Mark every parameter as required so Claude can never omit information
D. Keep every description to one short generic sentence such as "use this to find information"
E. Rely on distinct tool names alone, since names outweigh descriptions in Claude's selection

#### Q29 · Domain 8 — Tools and MCPs
A team connects several MCP servers through the API MCP Connector and notices a large amount of the context window is consumed by tool definitions before the first message arrives. What is the module-recommended way to control this cost?

A. Nothing is needed — MCP tool definitions only enter the context window when a tool is actually called
B. Configure mcp_toolset with defer_loading and enabled settings (with the required mcp-client beta header) to defer definitions and expose only the tools the model should see
C. Switch all servers to the stdio transport, which does not load definitions into context
D. Increase max_tokens so the model has room for both the definitions and its response

#### Q30 · Domain 2 — Applications and Integration
A developer is handling a streamed response that includes a tool_use block. The tool call's input arrives as fragments across many content_block_delta events. When is it safe to parse the input and execute the tool?

A. After each delta, parsing incrementally so execution can begin as early as possible
B. At content_block_start, since the block opens with its name, id, and input
C. Only after content_block_stop for that block, because the accumulated JSON string is not valid until the block closes
D. After the first message_delta event, which signals the input is stable

#### Q31 · Domain 2 — Applications and Integration
A streaming handler appends the assistant turn to history whenever its read loop ends. In production, a network blip ends a stream mid-block, a half-built tool_use block is committed to history, and the retry request fails validation. What is the correct fix?

A. Inspect and repair the tool schema, since the validation error names a malformed tool_use block
B. Gate the history append on message_stop, discard the partial turn on interruption, and retry from the last complete turn
C. Keep the partial turn in history but append a tool_result with is_error set to true
D. Wrap the retry in exponential backoff so the API eventually accepts the corrupted turn

#### Q32 · Domain 6 — Prompt and Context Engineering
An agent trace shows fetch_policy_document selected correctly on turns 1–4, each returning ~2,400 tokens. At turn 5 the agent calls search_knowledge_base instead of apply_coverage_rule, repeats the wrong call at turn 6, and the session ends without a result. What is the correct fix?

A. Add a clearer description to the apply_coverage_rule tool schema
B. Increase max_tokens in the API call to give Claude more room to respond
C. Prune fetch_policy_document results after each turn so accumulated outputs do not crowd out current instructions, and apply compaction before turn 5
D. Upgrade to a more capable model tier that can hold more tools in mind at once

#### Q33 · Domain 6 — Prompt and Context Engineering
A multi-turn agent session reuses the same long system prompt and a large, stable tool definition set on every request. What is the highest-leverage cost reduction the module identifies for this shape of workload?

A. Mark a cache breakpoint with a cache_control field of type ephemeral on the stable prefix so follow-up requests reuse the cached processing
B. Call the count_tokens endpoint before each request, which reduces the billed input tokens
C. Move the system prompt into the final user message so it is only billed once
D. Lower max_tokens on every request so the total context stays smaller

#### Q34 · Domain 1 — Agents and Workflows
A team is automating a document-intake process where every execution follows the same enumerable sequence of steps, inputs come from a known constrained set, and step-level guardrails and standard observability are required. Which pattern should they choose?

A. An agent, because agents handle every automation shape a workflow can plus more
B. A workflow, because the steps can be enumerated in code and using an agent would add behavioral complexity without adding capability
C. A multi-agent architecture with a planner, executor, and evaluator
D. An agent with a single tool, which reduces the coordination overhead to workflow levels

#### Q35 · Domain 1 — Agents and Workflows
A healthcare team is choosing a wiring path for an agent that processes Protected Health Information under a HIPAA BAA. Claude Managed Agents fits the workload operationally. What should the team do?

A. Use Managed Agents, since Anthropic's managed sandbox satisfies HIPAA requirements automatically
B. Use Managed Agents but disable session storage in the agent definition
C. Rule out Managed Agents — its sessions are stateful and stored server-side, so they are not currently eligible for ZDR or a HIPAA BAA — and use the Agent SDK or a raw loop on a covered configuration
D. Use Managed Agents in development and switch to a covered path only if an audit flags it

#### Q36 · Domain 1 — Agents and Workflows
A developer must add a human-in-the-loop checkpoint to an agent loop that has read_record and update_record tools, so that updates require operator approval but reads pass through freely. Where does the checkpoint belong?

A. A single approval prompt before the loop starts, covering all updates the agent may propose
B. Inside the loop, gated on the tool name, pausing before execute_tool runs update_record and returning a rejection tool_result if the operator declines
C. Immediately after execute_tool runs, so the operator can review what was changed
D. In the system prompt, instructing Claude to ask permission before proposing any update

#### Q37 · Domain 1 — Agents and Workflows
A team is selecting memory scopes for several agents. Which TWO pairings are correct? (Select TWO.)

A. A support agent that assists the same user across daily check-ins over two weeks — external storage, writing state at session end and reading it back at session start
B. A document formatter that receives a file, transforms it, returns output, and terminates — summarized memory injected at each session start
C. A document formatter whose jobs are fully independent — no persistent memory; each session starts fresh
D. A coding assistant in a single multi-hour session that will not continue afterward — external storage, so no code detail is ever lost
E. A support agent with daily check-ins across two weeks — in-context memory, since conversation state survives turns

#### Q38 · Domain 1 — Agents and Workflows
An agent builds its session history by concatenating the full message transcripts of all prior sessions into context. By session four or five, the window fills before the agent can process the current request. What is the correct fix?

A. Raise the agent's max_tokens so responses fit in the remaining window
B. Keep concatenating transcripts but drop the system prompt to free space
C. Move to external storage and inject only a summary of the prior session at session start instead of full transcripts
D. Strip the thinking blocks from prior transcripts to shrink the history

#### Q39 · Domain 1 — Agents and Workflows
A team has a specialized review checklist that applies only to a subset of tasks. They currently keep it in CLAUDE.md, which loads into every Claude Code session and inflates context even when irrelevant. What pattern should they move it to?

A. A Skill: a SKILL.md file whose name and description load at startup, with the full instructions loaded only when a request matches the description
B. In-context instructions pasted at the start of every conversation, since these persist across sessions
C. A subagent, since subagents automatically inherit all Skills and instructions from the parent session
D. A larger CLAUDE.md with headers, since Claude only reads the sections relevant to the task

#### Q40 · Domain 2 — Applications and Integration
A nightly pipeline classifies 5,000 product images against a fixed taxonomy, and every request includes the same reference diagram. The current implementation loops over the synchronous API with the diagram inline as base64 and keeps hitting rate limits. Which TWO changes are correct? (Select TWO.)

A. Upload the reference diagram once via the Files API and reference its file_id in each request instead of re-sending base64 bytes
B. Submit the 5,000 classification requests in a single Message Batches API call and poll the batch_id for completion
C. Keep the synchronous loop but split the list into smaller chunks so the rate limiter sees fewer requests
D. Keep inline base64 for the diagram, since the Files API adds a round-trip on every request
E. Rely on batch results returning in submission order to match outputs back to inputs

### Answer key — Module 2

**Q21: B** — The defect is a missing output constraint: the prompt never specified the JSON structure, exact field names, allowed values, or the instruction to return nothing else, so Claude returns plausible but inconsistent output that breaks the downstream parser.

**Q22: C** — The six-pass trace is the pattern to recognize: if repeated re-prompts have not worked, stop adding text and diagnose which technique is missing. The fix was an output constraint plus few-shot examples, which fixed the parser, dropped latency, and matched accuracy.

**Q23: D** — A guaranteed schema is not a guaranteed success: a refusal (stop_reason refusal) or truncation (stop_reason max_tokens) can still return non-matching output, so code must check stop_reason. Grammars are cached for 24 hours, and JSON outputs are incompatible with prefilling.

**Q24: C** — A one-word label needs no reasoning pass; enabling thinking multiplies output-token cost across 50,000 calls with no accuracy gain. A bare prompt with an output constraint is the right tool (and budget_tokens is deprecated, returning a 400 on the newest models).

**Q25: B** — Every thinking block carries a signature confirming the reasoning wasn't tampered with; editing, summarizing, or dropping it breaks the signature and the API rejects the request. Redacted blocks follow the same rule, and context pressure is handled with context engineering, not by editing blocks.

**Q26: B** — The API matches tool_use and tool_result blocks by id, not position, so tool_use_id="toolu_02" references a tool_use block that does not exist. The fix is returning the result with tool_use_id="toolu_01"; tool_result blocks correctly belong in the user role.

**Q27: C** — Both descriptions say "find information," so Claude has no reliable signal to distinguish them. The module's fix is an exclusion condition on both tools — when to use it and when not to; merging into one tool with a type parameter is reserved for descriptions that cannot be cleanly separated.

**Q28: A, B** — Mark fields required only when the call doesn't make sense without them (marking everything required forces Claude to fabricate values), and write descriptions in two parts covering when to use and when not to use the tool. Claude routes on name plus description, with descriptions weighted heavily.

**Q29: B** — MCP servers add tool definitions to context even when unused. The mcp_toolset's defer_loading delays loading a definition until needed and enabled exposes only chosen tools; both require the mcp-client-2025-11-20 beta header. The Connector also only supports remote HTTP servers, not stdio.

**Q30: C** — Tool-call inputs arrive as a partial JSON string spread across deltas and are not valid JSON until content_block_stop closes the block; parsing or executing earlier chokes on malformed JSON or runs with half the arguments missing.

**Q31: B** — A stream ending is not the same as a message completing; only message_stop means the message is whole. Gate the history append on message_stop, discard the partial turn on interruption, and retry from the last complete turn rather than committing a half-built tool_use block.

**Q32: C** — Correct selections at turns 1–4 rule out a schema-description problem, and max_tokens controls output length, not readable context. The turn-5 shift points to accumulated tool results crowding out current instructions; prune results after use and compact before the failure point.

**Q33: A** — Prompt caching stores the processing of a stable prefix; marking a cache_control breakpoint of type ephemeral on the system prompt and tool set lets follow-up requests pay a fraction of the cost. count_tokens measures context pressure but does not reduce cost.

**Q34: B** — When you can enumerate the exact steps in code, inputs are well-constrained, and step-level guardrails and standard observability matter, a workflow is correct; an agent would add behavioral complexity without adding capability.

**Q35: C** — Managed Agent sessions are stateful and stored server-side, which is why they are not currently eligible for Zero Data Retention or a HIPAA BAA. The governing constraint picks the path: route PHI workloads to the Agent SDK or a raw loop on a covered configuration.

**Q36: B** — The checkpoint sits inside the loop and gates on the tool name, so read_record passes through and update_record pauses for explicit approval before execute_tool. A single up-front approval cannot gate an update the model has not yet proposed, and approving after execution is too late for irreversible work.

**Q37: A, C** — Cross-session continuity requires external storage (in-context state resets when the session ends, so day two would start as a first contact), and fully independent jobs should run stateless (external storage adds latency and implementation cost for state that is never reused).

**Q38: C** — Concatenating full transcripts grows the window with every session until it fills by session four or five. The fix is external storage with only a summary injected at session start, keeping the live context to what the current turn needs.

**Q39: A** — A Skill loads its full instructions only when a request matches its description; only the name and description load at startup, unlike CLAUDE.md which loads every session unconditionally. Note that subagents do not automatically inherit Skills — they must be listed explicitly.

**Q40: A, B** — A reused asset belongs in the Files API (upload once, reference file_id) so the payload is not re-sent every request, and a high-volume offline job belongs in the Message Batches API (up to 100,000 requests or 256 MB, polled asynchronously at lower per-token cost). Chunking a synchronous loop is still one request per item and hits the same rate limits, and batch results return in arbitrary order — use custom_id to match them.

---


## Module 3: Claude Code, MCP & Integration (Q41–Q60)

#### Q41 · Domain 3 — Claude Code
A developer is configuring Claude Code for a trusted local refactor of the payments module. The session should auto-approve file edits, must never run destructive shell commands, and the agent must never be able to read `.env.production`. Which TWO `settings.json` pieces assemble the correct configuration? (Select TWO.)

A. `{ "permissions": { "defaultMode": "default" } }`
B. `{ "permissions": { "allow": ["Bash(npm run:*)"], "deny": ["Bash(rm:*)", "Bash(git push:*)"] } }`
C. `{ "permissions": { "defaultMode": "bypassPermissions" } }`
D. `{ "permissions": { "deny": ["Read(.env.production)"] } }`
E. `{ "permissions": { "allow": ["Bash(*)", "Edit(*)"] } }`

#### Q42 · Domain 3 — Claude Code
A team's settings auto-approve file edits for a trusted local refactor. Mid-session, the agent proposes a change to a deployment configuration file that several production services read. Where should the human gate sit for that one action?

A. Nowhere — the settings already auto-approve edits, so the change should proceed
B. Switch the session to bypassPermissions so the agent never pauses on any edit
C. A human reviews and approves the change before the write executes, because a wrong value there is hard to undo and reaches systems outside the file
D. Let the write execute and review the change later, during the next pull request

#### Q43 · Domain 3 — Claude Code
A developer must enforce a rule that Claude Code can never read `.env.production`, regardless of what the model decides during a session. Which hook configuration enforces this?

A. A PostToolUse hook with a `Read` matcher that logs the tool call to an audit file and exits 0
B. A PreToolUse hook with a `Read` matcher whose command reads the tool call from stdin, checks the file path, and exits with code 2 (writing the reason to stderr) when the path is `.env.production`
C. A PreToolUse hook with a `Read` matcher whose command prints a warning and exits 0 unconditionally
D. A UserPromptSubmit hook that scans each prompt for references to `.env.production` before the model processes it

#### Q44 · Domain 3 — Claude Code
A team is configuring Claude Code for a locked-down CI script. Only a small set of pre-approved tools from an allow rule (plus read-only commands) may ever run, and any tool call outside that list must be automatically denied with no confirmation queue. Which permission mode matches this requirement?

A. dontAsk
B. bypassPermissions
C. acceptEdits
D. plan

#### Q45 · Domain 3 — Claude Code
A developer switched to bypassPermissions for a "routine" endpoint-rename cleanup. A post-rename cleanup script matched a broader file pattern than intended and deleted files in `/deploy/config/prod/` with no prompt. Which statement correctly describes the safeguard the team should have applied?

A. Use acceptEdits instead, since it would have prompted even for direct `rm` commands inside the working directory
B. Rely on the protected-path guard, which still applies in bypassPermissions mode
C. No safeguard was possible; only `rm -rf /` and `rm -rf ~` can be gated once prompts are disabled
D. Set deny rules on sensitive directories before switching modes, because bypassPermissions removes every confirmation prompt and also drops the protected-path guard the other modes keep

#### Q46 · Domain 2 — Applications and Integration
A security team must guarantee that no developer in the organization can allow Claude Code to edit environment files — even a developer who sets a bypass mode or adds an allow rule in project settings. Which control provides the most durable guarantee?

A. A defaultMode of "plan" set in each project's `.claude/settings.json`
B. A deny rule in enterprise `managed-settings.json`, which users and project files cannot override and which applies even when a bypass mode is set
C. An allow rule at the user level in `~/.claude/settings.json` scoped to safe paths only
D. A convention in each repository's CLAUDE.md stating that environment files must not be edited

#### Q47 · Domain 3 — Claude Code
A team's CLAUDE.md has grown to 847 lines, including framework preferences, a style guide, path restrictions, a historical decisions log, and archived notes. The agent recently violated a path restriction that was present in the file. What is the recommended remediation?

A. Trim CLAUDE.md to session-critical constraints, move path-specific guidance into scoped rules files, move historical context into reference documents read on demand, and back the one critical restriction with a hook
B. Duplicate the path restriction several times throughout CLAUDE.md so the agent is more likely to see it
C. Split CLAUDE.md into two equally sized files so each one consumes less of the context window
D. Move the entire file's contents into a skill so it loads on demand instead of every session

#### Q48 · Domain 3 — Claude Code
A developer creates `.claude/rules/database/transactions.md` containing SQL guidance, assuming that placing it in the `database/` subdirectory scopes it to database work. The file has no YAML frontmatter. What actually happens?

A. The rule loads only when Claude Code works with files in a directory named `database`
B. The rule never loads, because rules files require a `paths` field to be valid
C. The rule loads unconditionally at session launch with the same priority as CLAUDE.md, because scoping comes from a `paths` glob in the frontmatter, not from file placement
D. The rule loads only when the developer invokes it explicitly by name

#### Q49 · Domain 3 — Claude Code
A developer delegates a research task to the built-in Explore subagent and notices it ignored a constraint written in the project's CLAUDE.md. What explains this, and what should the developer do when project rules must be respected?

A. Subagents cache CLAUDE.md from a prior session; restarting Claude Code reloads it
B. CLAUDE.md applies only to file edits, and Explore performs no edits, so the constraint was irrelevant
C. The constraint was diluted by other rules; moving it to the top of CLAUDE.md guarantees Explore follows it
D. Explore and Plan skip CLAUDE.md and git status to keep research fast and cheap; use the general-purpose subagent or a custom subagent that explicitly loads the rules it needs

#### Q50 · Domain 3 — Claude Code
A developer authors a review-checklist skill that must run identically in Claude Code, on the Messages API, and under the Agent SDK. Which TWO design choices make the skill portable across these runtimes? (Select TWO.)

A. Write the description as the matching criterion that identifies when the skill applies, so it loads correctly in every runtime
B. Reference helper scripts by absolute path so the location is unambiguous on every machine
C. Keep the skill's steps confined to what each runtime is guaranteed to provide, avoiding assumptions about local files or local tools
D. Rely on the Agent SDK's default settingSources behavior so no explicit configuration is needed
E. Assume subagents inherit the parent session's skills, so no explicit listing is required

#### Q51 · Domain 3 — Claude Code
A scheduled headless job built on the Agent SDK is expected to use a skill that works correctly in the Claude Code terminal, but under the SDK the skill never loads and the job silently proceeds without it. What is the most likely cause?

A. The skill's frontmatter is missing `disable-model-invocation: true`, which the SDK requires
B. Filesystem settings sources were never enabled — the SDK loads skills from the project only when settingSources is set explicitly, so it should be configured rather than left to a default
C. The SDK requires the `managed-agents-2026-04-01` beta header before any skill can load
D. Skills cannot run in headless mode; the workflow must be rewritten as a hook

#### Q52 · Domain 2 — Applications and Integration
A developer wants the same SKILL.md to run in several runtimes. Which pairing of runtime and required configuration is correct?

A. Claude Code — send the code-execution and skills beta headers with each terminal session
B. Agent SDK — skills load from the repository by default with no configuration required
C. Claude Managed Agents — the skill is discovered from the local `.claude/skills` directory at session time
D. Messages API — send the code-execution and skills beta headers, and write the skill so its steps do not depend on local files, because it runs inside Anthropic's code execution container

#### Q53 · Domain 2 — Applications and Integration
A plugin's SKILL.md runs a validation script via the path `/Users/alexmorgan/projects/deploy-utils/validate.sh`. The plugin installs cleanly for every teammate but the skill fails on every machine except the author's. Which change fixes the defect?

A. Replace the path with an absolute path on a shared network drive
B. Replace the path with the home-directory shortcut `~/projects/deploy-utils/validate.sh`
C. Reference the script from the project root using `$CLAUDE_PROJECT_DIR`, so the path resolves no matter where the project is cloned
D. Remove the step so the skill no longer calls an external script

#### Q54 · Domain 2 — Applications and Integration
An enterprise administrator configures a managed marketplace allowlist so developers can only add approved plugin sources. The admin also wants an internal marketplace to appear for all users automatically, without each developer running the add command. What must the admin do?

A. Nothing — an allowlisted marketplace is registered automatically for every user
B. Pair the allowlist with `extraKnownMarketplaces` in managed settings, because the allowlist restricts what users can add but does not register marketplaces itself
C. Commit the marketplace URL to each repository's `.mcp.json` so it registers on clone
D. Ask each developer to add the marketplace to `.claude/settings.local.json`

#### Q55 · Domain 8 — Tools and MCPs
A code-search service is hosted on the company's infrastructure, and the whole engineering team should get access to it automatically when they clone the repository. Which transport and scope combination is correct?

A. stdio transport, project scope — commit the launch command to `.mcp.json`
B. HTTP transport, local scope — each developer registers the URL personally
C. HTTP transport, project scope — commit the server URL to `.mcp.json` at the repo root
D. stdio transport, user scope — configure it once in personal Claude settings

#### Q56 · Domain 8 — Tools and MCPs
A team connects the GitHub MCP server but wants only `create_issue` to run without prompting, while write-capable tools like merge operations are blocked entirely and everything else still prompts. Which approach matches the course's guidance?

A. Use permission rules that name individual tools in the form `mcp__github__create_issue` — an allow rule on that one tool skips its prompt, and a deny rule on a write-capable tool blocks it while other tools still prompt
B. Permission rules can only target whole servers, so the team must run two copies of the GitHub server with different rules
C. Set `enabled: false` on the whole server in an `mcp_toolset` object; this both hides and blocks every tool
D. Add a CLAUDE.md instruction telling the agent which GitHub tools it may call

#### Q57 · Domain 8 — Tools and MCPs
An MCP server for internal documentation should let clients place a known list of schema documents directly into context at the start of a turn, addressed by identifier, without the model making a tool call to fetch them. Which MCP primitive fits this requirement?

A. A tool, because all server capabilities are exposed as callable actions
B. A resource — read-only data the client fetches by address and places into context, using a direct address for fixed data or a templated address that takes an identifier
C. A prompt, because it injects pre-written content into the conversation
D. A transport, because it controls how data moves between client and server

#### Q58 · Domain 8 — Tools and MCPs
A developer discovers that a service-account API key was committed inline in the `Authorization` header of `.mcp.json` and pushed to the shared repository two days ago. Which TWO actions are required? (Select TWO.)

A. Rotate the key immediately, treating the committed credential as compromised
B. Overwrite the file in a later commit with the key removed, which clears it from the repository
C. Update `.mcp.json` to reference the credential as an environment variable (e.g., `Bearer ${WAREHOUSE_MCP_TOKEN}`) so the value never travels with the file
D. Switch the server from HTTP to stdio transport so headers are no longer needed
E. Move the server entry to `.claude/settings.local.json` and leave the existing key in place

#### Q59 · Domain 8 — Tools and MCPs
A team's OAuth-authenticated MCP integration passed all staging tests, but after cutover every production sign-in fails with a redirect URI mismatch and loops back to the sign-in screen. What should the team do?

A. Rotate the OAuth token, since the mismatch indicates the credential was compromised
B. Switch the integration from OAuth to an API key, since OAuth cannot span environments
C. Roll back the deployment, since the mismatch indicates a code defect introduced at cutover
D. Add the production host's redirect URI to the OAuth app registration, and verify whether the customer's security policy requires separate app registrations for staging and production

#### Q60 · Domain 8 — Tools and MCPs
A CI connection trace shows: a 401 Unauthorized on the first token request; the client reading the credential as a plaintext value from `/home/jenkins/.config/mcp-credentials.json`; and a 401 again on the retry with that credential. Which fix addresses everything the trace exposes?

A. Rotate the API key and write the new value back into `/home/jenkins/.config/mcp-credentials.json`
B. Rotate the rejected key, move the credential out of the file, inject it as an environment variable in the CI pipeline runner configuration, and update the MCP configuration to reference the variable
C. Switch this service-account connection from API key authentication to OAuth
D. Increase the retry count and connection timeout so transient authentication failures resolve on their own

### Answer key — Module 3

**Q41: B, D** — Piece B gates shell execution (allows the safe `npm run` command, denies destructive `rm` and `git push`), and piece D enforces the `.env.production` restriction at the settings layer. Default mode prompts on nearly every edit, bypassPermissions removes shell oversight and the protected-path guard, and `Bash(*)`/`Edit(*)` allows everything with no destructive-command gate.

**Q42: C** — The worst-case question governs the one high-cost action: a wrong value in a deployment config read by production services is hard to undo and reaches beyond the file, so a person reviews and approves it before the write executes. The session default (auto-approve) does not answer the per-action question, and post-write PR review comes after the damage.

**Q43: B** — Only PreToolUse fires before the tool call executes, which is when blocking is possible; the command must inspect the path and exit with code 2 (stderr becomes the feedback Claude sees). PostToolUse runs after the read has already happened, and a script that exits 0 unconditionally lets everything through.

**Q44: A** — dontAsk auto-approves only pre-approved allow-rule tools plus read-only commands and auto-denies everything else with no confirmation queue — built for locked-down CI and scripts. acceptEdits still gates other shell commands via prompts, bypassPermissions approves everything, and plan blocks all writes.

**Q45: D** — bypassPermissions silences all confirmation prompts and, unlike the other modes, also removes the protected-path guard, so a deny rule on sensitive directories must be set before switching (or a classifier-gated mode like auto used instead). acceptEdits auto-approves common filesystem commands including `rm` inside the working directory, so option A is false.

**Q46: B** — An enterprise-level deny rule in managed-settings.json is the most durable governance control: it cannot be removed by any individual developer, deny always wins over allow, and it applies even when a bypass mode is set. CLAUDE.md is a convention the model may not follow, and user/project settings can be overridden.

**Q47: A** — CLAUDE.md is a working set of session-critical rules, not an append log: every added line reduces the weight of every other line. Path-specific rules belong in scoped rules files, historical context in on-demand reference documents, and the one rule you cannot afford to dilute should become a hook.

**Q48: C** — Scoping comes from the `paths` glob in YAML frontmatter, not from file placement; subdirectories of `.claude/rules/` are organizational only. A rules file without a `paths` field loads unconditionally at launch with the same priority as CLAUDE.md.

**Q49: D** — The built-in Explore and Plan subagents skip CLAUDE.md and git status to keep research fast and cheap, so project rules are not in their context. When project constraints must be respected, delegate to the general-purpose subagent or a custom subagent that explicitly loads the needed rules.

**Q50: A, C** — The module's portability rules: write the description as the matching criterion (a vague one fails to load in every runtime) and avoid assuming a local filesystem or local tools (a skill that shells out to a local command breaks in the Messages API container). Absolute paths, relying on settingSources defaults, and assuming subagents inherit skills are exactly the anti-patterns the module warns against.

**Q51: B** — Whether the Agent SDK loads filesystem settings (CLAUDE.md, skills) is controlled by settingSources; the common surprise is a skill that worked in Claude Code doing nothing under the SDK because settingSources was never set. It must be set explicitly and verified against the current SDK reference rather than left to a default.

**Q52: D** — On the Messages API the skill is sent with the request, requires the code-execution and skills beta headers, and runs inside Anthropic's code execution container — not your environment — so it must not assume local files. Claude Code uses filesystem discovery (no beta headers), the SDK requires settingSources, and Managed Agents load skills server-side from the agent resource definition.

**Q53: C** — The defect is the absolute path into the author's home directory, which resolves on no teammate's machine. Referencing the script from the project root via `$CLAUDE_PROJECT_DIR` makes it resolve wherever the project is cloned; another absolute path or a `~` shortcut still depends on one machine's layout.

**Q54: B** — The managed marketplace allowlist gates which sources users are permitted to add but does not register marketplaces automatically. To push a marketplace to all users without them running the add command, the admin pairs the allowlist with `extraKnownMarketplaces` in managed settings.

**Q55: C** — A remotely hosted service accessed by the whole team requires HTTP transport, and project scope (`.mcp.json` committed at the repo root) makes the configuration travel with the code to everyone who clones. A stdio server in `.mcp.json` is a configuration that looks shareable but is not, since stdio runs as a subprocess on one machine.

**Q56: A** — Permission rules can name an individual MCP tool as `mcp__server__tool`: an allow rule on `mcp__github__create_issue` lets that one tool run without a prompt, and a deny rule on a write-capable tool blocks it (deny on a tool overrides an allow on the server) while other tools still prompt. The `mcp_toolset` enabled flag is a visibility/context control, not the per-tool run-permission mechanism described here.

**Q57: B** — A resource is read-only data the server exposes for the client to fetch by address and place directly into context, without a tool call — a direct resource has a fixed address, and a templated resource takes a parameter such as a document identifier. Prompts are vetted instruction templates; tools are actions the model calls.

**Q58: A, C** — A credential committed to a repository enters history, where overwriting the file in a later commit does not remove it, so the key must be treated as compromised and rotated; the configuration must then reference the value through an environment variable so the file no longer carries the secret. Overwriting alone, changing transport, or relocating the config leaves the exposure in place.

**Q59: D** — OAuth redirect URIs are registered per host, so a working staging flow says nothing about production: the provider rejects the unregistered production URI. The fix is adding the production redirect URI to the app registration and checking whether the customer requires separate OAuth app registrations per environment — the failure is configuration, not code or credentials.

**Q60: B** — The trace shows two stacked problems: the 401 on both attempts means the key itself is rejected and must be rotated, and the plaintext credential file at a known path is the secret-handling defect. Fix B resolves both; rotating alone writes the new key back into the same insecure file, OAuth mismatches a service-account identity model, and retries cannot fix a rejected key.

---


## Module 4: Production Engineering, Evals & Security (Q61–Q80)

#### Q61 · Domain 4 — Eval, Testing, and Debugging
A team ships a feature that extracts structured fields from customer messages after manually reviewing about a dozen sample outputs that all looked correct. Input validation confirms each extracted date is well-formed. Two weeks later, a message containing two dates ("I placed my order on March 3 but did not receive it until April 12") causes the feature to extract the wrong date, and every validation check passes. What was the root cause?

A. The input validation was too weak and should have rejected messages containing more than one date
B. The model was not capable enough for extraction and should have been upgraded to a larger tier
C. Success was never written down as a graded eval set, so the two-date edge case was never defined as an expected behavior and there was no signal it existed
D. The prompt lacked step-by-step reasoning instructions, which is why the extraction was inaccurate

#### Q62 · Domain 4 — Eval, Testing, and Debugging
A developer must grade an eval case where the feature should return the three capital cities of a region as a JSON array. One run returns all three correct cities, but in a different order than the reference output. Which grading method should the developer use?

A. Exact string match against a reference answer
B. A code-graded check that parses the JSON and verifies all three cities are present
C. An LLM-as-judge call with a quality rubric
D. Manual human review of every run

#### Q63 · Domain 4 — Eval, Testing, and Debugging
A developer builds an LLM-as-judge with a rubric to score open-ended summaries. Before relying on the judge's scores in a review, what must the developer do to make the scores defensible?

A. Run the judge on cases a human has already labeled, measure how often it agrees with the human, and tighten the rubric if agreement is low
B. Run the judge twice on each case and average the two scores to reduce noise
C. Switch the judge to the most capable model tier so its scores can be trusted without further work
D. Ask the judge to return only the numeric score, since extra text makes results inconsistent

#### Q64 · Domain 4 — Eval, Testing, and Debugging
An eval dataset for a summarization feature includes the input case "Meeting transcript where three action items are assigned," but its `expected_behavior` field is blank. Which value should the developer write?

A. "Summarize the transcript accurately and completely"
B. "A summary that lists all three action items with their owners"
C. "Any output that the judge scores 8 or higher"
D. "A well-written summary of no more than 100 words"

#### Q65 · Domain 4 — Eval, Testing, and Debugging
A team's trace shows the retrieval unit test passing (returns 3 chunk dicts), the model-call functional test passing, but the end-to-end test failing: `build_prompt()` places the chunks into the prompt without reading their `content` field, and the model answers from memory instead of the documents. What should the team do?

A. Fix the parser, since date parsing is a common source of end-to-end failures
B. Reword the prompt to "Answer carefully and cite the policy"
C. Align the handoff by extracting the `content` field, and add an integration test that drives retrieve() into build_prompt() with real retrieved data
D. Add more end-to-end tests to increase coverage of the full flow

#### Q66 · Domain 4 — Eval, Testing, and Debugging
An eval run reports that a case failed with a score of zero, but the developer cannot tell what went wrong. What does adding a trace to the system provide?

A. It automatically retries the failed case until it passes, then records the passing run
B. It records each step of the run — the prompt, tool calls, intermediate outputs, and timing — so the failure is localized to the step that produced the bad result
C. It grades the failing output more accurately than an LLM-as-judge would
D. It removes the need for integration tests, since every seam is already recorded

#### Q67 · Domain 4 — Eval, Testing, and Debugging
A developer is iterating on a prompt to raise an eval score. Which TWO practices follow the module's guidance? (Select TWO.)

A. Change one component at a time and re-run the eval, so you know which change caused any movement
B. Rewrite the prompt, add examples, and switch the model in one pass to save iteration cycles
C. Read the per-case breakdown, because a steady average can hide a change that fixed three cases and broke three others
D. Prefer a small set of hand-polished cases over a larger set with slightly noisier automated grading
E. Keep any change that feels qualitatively better, even when the score does not move

#### Q68 · Domain 4 — Eval, Testing, and Debugging
A team reviews this retry wrapper:

```
def call_with_retry(make_call, max_attempts=5):
    for attempt in range(max_attempts):
        try:
            return make_call()
        except Exception:
            time.sleep(0)
    raise RetryBudgetExhausted()
```

Which statement correctly identifies the defect and the fix?

A. The attempt cap is too low; raising max_attempts to 10 would let the loop outlast most rate limits
B. There is no backoff between attempts and every exception is retried, including terminal statuses; the fix is exponential backoff with jitter and a cap, honoring retry-after when present, and failing fast on terminal errors like 400 and 401
C. The sleep call belongs inside the try block so that interruptions during the wait are also retried
D. The loop should catch only RateLimitError and retry it immediately, since the retry-after header already paces the requests

#### Q69 · Domain 2 — Applications and Integration
During an agent's tool-use loop, a tool raises an exception. The developer's code catches it and returns an empty result block to Claude. What is the consequence, and what is the correct handling?

A. The empty result safely stops the loop; correct handling is to also log the exception server-side
B. The model treats the empty result as valid data and continues reasoning on a false premise, producing a confident but wrong answer; correct handling is to return a tool_result with is_error set to true and the error message so the model can react
C. The API rejects the empty block with a 400 error; correct handling is to retry the tool call with backoff
D. The model automatically re-invokes the failed tool; correct handling is to strip the failed call from history first

#### Q70 · Domain 2 — Applications and Integration
A developer's retry wrapper retries every failed API call with backoff. After an API key expires, logs show the same request receiving a 401 five times in a row before finally raising. What should change?

A. Nothing — authentication failures often clear on their own, so retrying with backoff is the safe default
B. The wrapper should classify 401 as terminal and fail fast, because retrying an identical bad request changes nothing and wastes the retry budget while hiding the real problem
C. The wrapper should increase the wait interval for 401 responses, since auth systems need more time to recover than rate limits
D. The wrapper should swallow the 401 and return a cached response so the user experience is unaffected

#### Q71 · Domain 2 — Applications and Integration
A production integration receives an HTTP 200 response, but the message's stop_reason is "refusal". How should the application handle it?

A. Retry the identical request with exponential backoff, since a refusal is transient
B. Treat the response text as valid output, since the HTTP status indicates success
C. Raise the refusal to the caller and log it, without silently retrying — the model made a content decision, not a transient error, and the retriable-status classifier will not catch it because the HTTP layer returned 200
D. Automatically rewrite the prompt and resubmit until the model complies

#### Q72 · Domain 5 — Model Selection and Optimization
A high-volume classification step labels millions of short messages per day, and an eval shows Haiku holding the quality bar. Which model choice is best, and what is the deciding constraint?

A. Opus — the deciding constraint is reasoning depth on ambiguous messages
B. Sonnet — the deciding constraint is balancing quality and speed across volume
C. Haiku — the deciding constraint is cost-at-volume, since the eval confirms the quality bar still holds
D. Opus — the deciding constraint is consistency across millions of requests

#### Q73 · Domain 5 — Model Selection and Optimization
A multi-step agent plans a dependent refactor where a wrong early step is expensive, and an eval shows Sonnet missing the bar on the hardest cases. Which model choice is best, and what is the deciding constraint?

A. Sonnet — the deciding constraint is cost efficiency on a long agent run
B. Opus — the deciding constraint is quality on hard reasoning where the cost of a wrong answer is high
C. Haiku — the deciding constraint is speed across many sequential steps
D. Sonnet — the deciding constraint is latency on dependent steps

#### Q74 · Domain 5 — Model Selection and Optimization
A team serves mixed traffic: most requests are simple lookups, while a few are complex synthesis. Which approach is best?

A. Opus for everything — the deciding constraint is guaranteeing quality on the complex requests
B. Haiku for everything — the deciding constraint is minimizing cost across all traffic
C. Sonnet for everything — the deciding constraint is a single balanced model for mixed needs
D. Route: a Sonnet (or Haiku) default with an Opus override on the complex requests — the deciding constraint is that traffic is mixed

#### Q75 · Domain 5 — Model Selection and Optimization
A developer wants prompt caching to reduce the cost of a high-volume feature. Which TWO conditions must hold for the caching to pay off? (Select TWO.)

A. The content before the cache breakpoint must be exactly identical across requests — adding even a single word invalidates the cache and forces a full reprocess
B. The same prefix must recur within the cache lifetime (five minutes by default, refreshed on each hit), so reads outnumber the premium-priced writes
C. Cache reads are billed at a premium over base input tokens, so caching only helps on short prompts
D. The dynamic per-user message should be placed before the cache breakpoint so it is also cached
E. Caching benefits any prompt regardless of length, so no minimum threshold applies

#### Q76 · Domain 5 — Model Selection and Optimization
A team runs an overnight classification backfill over a large dataset. No user is waiting on the results, and every request carries the same long, fixed system prompt. Which configuration best fits the workload?

A. Stream every response so results arrive as fast as possible
B. Submit the work through the Message Batches API for roughly a 50% cost reduction, and add prompt caching on the stable prefix so the two savings compound
C. Fan the dataset out across parallel subagents so the job finishes within the hour
D. Move the job to the most capable model tier so fewer retries are needed

#### Q77 · Domain 5 — Model Selection and Optimization
A developer splits a tightly coupled coding task across a lead agent and five parallel subagents. Latency drops slightly, the bill roughly triples, and answer quality barely moves. What explains the outcome?

A. The subagents' prompts were not cached; enabling prompt caching would make the fan-out cost-neutral
B. Every subagent spends its own tokens against its own context — roughly fifteen times a normal chat in Anthropic's reported case — and the multiplier only pays off on tasks that split into independent parts, which a tightly coupled coding task does not
C. The subagent count was too low; parallel patterns only show gains at ten or more workers
D. The lead model was too small to coordinate; upgrading the lead alone would recover the quality

#### Q78 · Domain 7 — Security and Safety
A reviewer audits this line in an agent that summarizes web pages:

```
page = fetch(page_url)              # untrusted content
write_file(page.suggested_path, summarize(page))
```

What is the security defect, and what is the fix?

A. The write is not wrapped in a retry loop, so a transient disk failure will crash the flow
B. The destination path comes from untrusted fetched content, with no enforced write boundary; the fix is a fixed path under /workspace/output plus a PreToolUse hook that denies and audits writes outside it
C. The summarize call should run before the fetch so the content can be validated
D. The page content should be HTML-escaped before it is written to disk

#### Q79 · Domain 7 — Security and Safety
A team skips validating the pages its agent fetches because all users are internal and trusted. The agent then writes a file nobody asked for after summarizing a page that contained a hidden instruction near the bottom. Why did trusting the users fail, and what is the primary control?

A. Internal users should be re-authenticated per request; the control is stronger session management
B. The hostile instruction arrived through the fetched content, not the user; the control is to treat fetched content as data and enforce the action boundary with a hook before the tool runs
C. The model was outdated; the control is upgrading to a tier trained to ignore all injected text, which makes the application immune
D. The prompt was too vague; the control is a firmer system-prompt sentence telling the model to ignore instructions found in pages

#### Q80 · Domain 7 — Security and Safety
A developer must assemble the minimal secure configuration for an agent that fetches untrusted web content and writes to a single protected path under a scoped identity. Which TWO pieces belong in that configuration? (Select TWO.)

A. A PreToolUse hook that runs before write_file executes, denies any write outside /workspace/output, and logs the attempt
B. An API key pulled from an environment variable or secret manager rather than committed configuration
C. A system-prompt line instructing the model to ignore any instructions found in fetched pages, relied on as the enforcement layer
D. A retry wrapper with exponential backoff around the write call
E. Broad write access for the agent, with a weekly review of the audit log to catch misuse

### Answer key — Module 4

**Q61: C** — Success was judged by impression instead of a graded set; validation confirms a value is the right shape, not the right one. The missing eval was the root cause — it would have surfaced the two-date case, documented the expected behavior as a checkable case, and guarded against regression.

**Q62: B** — A code grader that parses the JSON and checks membership scores the reordered-but-correct answer well. Exact match fails on reordering even when the answer is correct, and a judge adds cost and noise for a purely structural check.

**Q63: A** — Calibration is what turns the judge from a guess into evidence: run it on human-labeled cases, measure agreement, and if agreement is low, tighten the rubric and add examples of good and bad answers, then re-measure. A judge that disagrees with humans half the time produces a rigorous-looking number with no value.

**Q64: B** — The expected_behavior must name the specific output the feature should produce ("a summary that lists all three action items with their owners"), not restate the input ("summarize the transcript") or defer to the grader. A vague goal cannot be checked; a concrete one, paired with an anchored score scale (1–3 misses required content, 4–7 partial, 8–10 complete and faithful), makes the score comparable across runs and defensible.

**Q65: C** — Both components pass in isolation, so the failure can only live in the handoff: retrieve() returns chunk dicts and build_prompt() never reads the content field, so the model got malformed context. Option C extracts the content and adds a test on that exact seam — the integration level, where most silent failures hide.

**Q66: B** — A failed eval tells you something is wrong but not where. A trace records the prompt, tool calls, intermediate outputs, and timing for each step, turning "the case failed" into "step four raised a KeyError" — the difference between a five-minute fix and a day of manual investigation.

**Q67: A, C** — Move one lever at a time so you learn which change drove the score, and read the per-case breakdown because a steady average conceals a change that fixed three cases and broke three others. Bundled changes teach you nothing, and coverage from a larger, slightly noisier set beats a few hand-polished cases.

**Q68: B** — time.sleep(0) fires retries immediately with no backoff, and the bare except retries every exception including terminal statuses a retry cannot fix. The corrected version honors retry-after, grows the wait with exponential backoff plus jitter under a cap, and fails fast on terminal statuses like 400 and 401.

**Q69: B** — A tool that drops its error and returns nothing makes the model treat the empty result as valid data and reason on a false premise. Returning the tool_result with is_error: true and the message lets Claude react — try another approach, ask for clarification, or stop — and a visible failure is far easier to catch than a confident wrong answer.

**Q70: B** — A 401 is terminal: the cause is in the request itself (an expired key), so each retry produces an identical failure, wastes the retry budget, and hides the real problem behind a wall of retries. Terminal statuses (400, 401, 403, 404) should fail fast and be surfaced.

**Q71: C** — A refusal is a 200 at the HTTP layer, so status-based retry classification will not catch it, and it reflects a content decision, not a transient fault. The module's guidance: raise it to the caller and log it; do not silently retry or treat it as valid output.

**Q72: C** — The deciding constraint is cost-at-volume, and the eval confirms the quality bar still holds, so paying for a larger model buys nothing. This follows the default: step down to Haiku only when an eval shows the quality drop is acceptable.

**Q73: B** — The deciding constraint is quality on hard reasoning where the cost of a wrong answer is high, and the eval shows the step up from Sonnet is needed. Model changes are promoted on a measured eval score, not on assumption.

**Q74: D** — Traffic is mixed, so a single model either overpays on the simple requests or underperforms on the complex ones. A default model with an Opus override on a cheap task signal pays for the capable model only where it is needed.

**Q75: A, B** — The cache matches on an exact prefix, so any change before the breakpoint (even one word) invalidates it, and the saving only lands when the same prefix recurs within the TTL so cheap reads (0.1x) outnumber premium writes (1.25x–2x). Dynamic content before the breakpoint defeats the cache, and prompts below the per-model minimum length see no benefit.

**Q76: B** — A non-urgent, no-user-waiting job is exactly what the Message Batches API is for (~50% cost reduction for asynchronous processing), and prompt caching compounds the saving because the long fixed system prompt recurs across requests. Streaming optimizes perceived latency for a user in the loop, which this job has none of.

**Q77: B** — Each subagent consumes its own tokens in its own context window — roughly 15x a normal chat in Anthropic's reported case — and the multiplier only buys something when the task decomposes into independent parts explored in parallel. A tightly coupled task leaves subagents waiting on each other, so you pay the fan-out cost without the parallel benefit; a single agent with good context is the right shape.

**Q78: B** — The write destination is taken from untrusted fetched content (page.suggested_path) with no PreToolUse hook enforcing a write boundary — this is the security-layer defect from the cumulative task. The fix is a fixed path under /workspace/output with a hook that denies and audits any write outside it, so an injected write hits a block and a log entry instead of the disk.

**Q79: B** — The injection arrives through the content the agent reads, not from the user, so trusting the user does nothing. The defense is to treat anything the agent did not author as data and enforce the action boundary with a hook before the tool runs; prompt wording is a soft boundary and model-level defenses are probabilistic, not guaranteed.

**Q80: A, B** — The PreToolUse hook is enforcement, not convention: it blocks the write before execution and logs it, and the environment-variable secret keeps the credential out of repository history where it could never be cleanly rotated. A prompt instruction is not a security control, a retry wrapper is error handling rather than a boundary, and broad access with after-the-fact log review violates least privilege.

---


## Module 5: Accelerators & IP Contribution (Q81–Q100)

#### Q81 · Domain 2 — Applications and Integration
A second team picks up an agent template labeled "reusable" from a prior engagement. The constructor contains `repo_path="/home/acme/checkout-service"` baked into the code, and the team cannot adapt the template without editing the loop itself. Which change correctly packages the template for reuse?

A. Move the repository path into a constants block at the top of the same file
B. Accept the repository path as a function parameter so each engagement configures the value instead of editing the code
C. Remove the repository path entirely and have the agent detect the repository at runtime
D. Fork the template per customer so each copy carries its own hardcoded path

#### Q82 · Domain 2 — Applications and Integration
A team finishes a working agent under deadline and shares it as a set of loose scripts rather than a parameterized template. The scripts run correctly in the original environment. According to the module, what is the most likely outcome when other teams try to reuse this work?

A. The scripts fail immediately because loose scripts cannot execute outside their original repository
B. Other teams adopt the scripts unchanged, since running code is by definition reusable
C. The scripts pass a security review but fail functional testing in the new environment
D. Each team copies and diverges the scripts, because every customer-specific value is buried in a different file instead of exposed as configuration

#### Q83 · Domain 8 — Tools and MCPs
A developer must package a working MCP server as a reusable accelerator so other teams can install it in new environments. What does correct packaging require?

A. Hardcode the scopes the original engagement used so the server behaves identically everywhere
B. Ship only the server binary, since MCP tool behavior is self-describing at runtime
C. Document each tool input and let the installing team set the scope, so the server installs into a new environment without code edits
D. Bundle the original customer's credentials so the server works out of the box

#### Q84 · Domain 2 — Applications and Integration
A developer is writing documentation for a packaged accelerator and wants to avoid duplicating what the source code already communicates. According to the module, what should the documentation cover?

A. What a future builder cannot reliably infer from the source: environment assumptions, expected inputs, handled failure modes, and the eval that defines whether the asset still works
B. A line-by-line narrative of the code so readers never need to open the source
C. Only the installation command, since everything else is visible in the repository
D. The full commit history of the engagement that produced the asset

#### Q85 · Domain 2 — Applications and Integration
A developer wants to contribute a full customer-service application — including its UI and deployment scripts — to the Claude Cookbook. What should the developer do for the contribution to be accepted?

A. Submit the whole application with extra documentation explaining each component
B. Strip out the reusable pattern and contribute it as a focused, self-contained example, because the Cookbook reviews one focused pattern rather than an entire application
C. Split the application into several simultaneous pull requests, one per component
D. Submit the application to the Cookbook but mark it as a draft so reviewers can take their time

#### Q86 · Domain 2 — Applications and Integration
A developer prepares a one-line fix to an existing Cookbook example. The corrected line was carried in from a customer engagement. Which gate must the contribution clear before any technical review?

A. A performance benchmark comparing the fix against the original line
B. A regression run across every other example in the Cookbook
C. Sign-off from the customer's procurement team
D. The rights check, because engagement code can carry a licensing constraint that blocks the merge regardless of code quality

#### Q87 · Domain 2 — Applications and Integration
A developer's pull request to an open-source tool repository has sat unreviewed for three weeks. The code is correct and the developer uses it daily. The maintainer explains they cannot tell whether it works. Which TWO additions would move this contribution to a fast review? (Select TWO.)

A. More detailed commit messages describing the development history
B. A runnable example that shows the behavior without the reviewer building a harness
C. A refactor that improves the code's performance
D. Broadening the PR to cover additional related use cases
E. A test that proves the behavior so the maintainer can verify the result without reproducing the reasoning

#### Q88 · Domain 2 — Applications and Integration
While preparing a contribution, a developer discovers that code carried in from a customer engagement has a licensing constraint the developer cannot clear. What does the module say to do?

A. Contribute the code anyway and note the constraint in the PR description for the maintainer to evaluate
B. Rewrite the code from memory so the constraint no longer applies
C. Do not contribute the code; escalate to the owner instead
D. Contribute it to a personal repository first, then link it from the shared channel

#### Q89 · Domain 2 — Applications and Integration
A regulated EU bank wants an agent that summarizes customer call transcripts for its support team. Which of the following is a valid functional requirement?

A. The agent should be fast and accurate.
B. The agent produces a summary that a human approves before it is stored.
C. The system must be built using an approved cloud provider.
D. Transcript data must not leave the EU.

#### Q90 · Domain 2 — Applications and Integration
From the same EU bank scenario, which of the following is a valid infrastructure requirement?

A. The agent must produce summaries quickly enough for support staff to act on them.
B. The agent summarizes transcripts using a pre-approved prompt template.
C. Transcript data is processed in the EU.
D. A human reviews each summary before it is stored.

#### Q91 · Domain 2 — Applications and Integration
A team is placing its engineering work into the systems lifecycle phases for a Claude application. Which TWO activities belong in the deploy phase? (Select TWO.)

A. Pinning the full model ID and keeping the prior version available
B. Deciding that data must be processed in a specific region
C. Gating promotion on the eval result before a version goes to production
D. Instrumenting token cost and latency per call in production
E. Choosing Amazon Bedrock because the customer holds its compliance posture there

#### Q92 · Domain 2 — Applications and Integration
A team on a regulated engagement is applying lifecycle gates to a Claude application. Which statement correctly describes how a gate works?

A. Gates apply only at the final production release, after all engineering work is complete
B. A gate is an optional documentation checkpoint a team may skip under deadline pressure
C. A gate is the point in the operate phase where guardrails are first added
D. The team does not move from design to build until the platform satisfies the residency requirement, and does not move toward full production until the new version clears the eval against the pinned baseline

#### Q93 · Domain 2 — Applications and Integration
A customer runs on AWS, has a data-residency requirement, and must be able to roll back a model update. Which minimal deployment configuration satisfies both constraints?

A. Amazon Bedrock, an AWS identity reference, a pinned full model ID, and retention of the prior pinned version
B. First-party Claude API, an Anthropic API key, a pinned full model ID, and retention of the prior pinned version
C. Amazon Bedrock, an AWS identity reference, a moving alias, and retention of the prior pinned version
D. Google Vertex AI, an AWS identity reference, a pinned full model ID, and no retention

#### Q94 · Domain 2 — Applications and Integration
A production application suddenly throws `KeyError "summary"` in its response parser. The application code has not changed, the log shows the model alias advanced to a new version overnight, and a rollback attempt fails because no prior version was retained. What is the root cause?

A. The parser was written against an undocumented response field
B. The deployment followed a moving alias instead of a pinned full model ID, and no pinned prior version was retained as a rollback target
C. The platform silently migrated the workload to a different region
D. The eval suite was run against the wrong baseline score

#### Q95 · Domain 2 — Applications and Integration
A customer on AWS assumes that every way of running Claude "on AWS" keeps inference inside their AWS boundary. Which statement is accurate?

A. Both Claude Platform on AWS and Claude in Amazon Bedrock run inference entirely inside the customer's AWS boundary
B. Claude in Amazon Bedrock routes inference to Anthropic-operated infrastructure outside AWS
C. Neither offering touches the customer's AWS account; both are Anthropic-hosted
D. Claude Platform on AWS is accessed through the customer's AWS account but inference is Anthropic-operated outside the AWS boundary, while Claude in Amazon Bedrock keeps data inside the customer's configured AWS boundary

#### Q96 · Domain 2 — Applications and Integration
A platform chosen on team familiarity is rejected with `reason="data processed outside EU on selected platform"`. The comparison trace shows latency of 180ms measured from a dev laptop, and the customer requires EU-only residency from eu-west. What is the targeted fix?

A. Optimize the parser to cut the 180ms latency measured on the laptop
B. Remeasure latency from eu-west and select the platform whose region satisfies EU-only residency
C. Add a caching layer to reduce per-call cost on the selected platform
D. Keep the selected platform and encrypt payloads in transit to satisfy the residency rule

#### Q97 · Domain 2 — Applications and Integration
A team compares deployment platforms by token price alone and recommends the platform with the cheapest per-token rate. According to the module, why can this recommendation be wrong?

A. Per-token rates are broadly aligned across platforms; total cost moves on data egress, platform fees, and integration effort, so the team should instrument total cost per call
B. Token prices change daily, so any comparison is stale by the time it is reviewed
C. Cheaper tokens always indicate an older model snapshot
D. Cost is irrelevant because compliance always determines the platform

#### Q98 · Domain 1 — Agents and Workflows
A multi-component application wires an API entry point to a Claude Code task, which fetches content from a customer web page and passes it into the next component's call. Each component passed its own tests. What control is required at the seam that receives the fetched content?

A. A retry wrapper so transient fetch failures do not break the workflow
B. A schema validator that confirms the fetched page is well-formed HTML
C. Wrap the fetched content so the receiving component treats it as data rather than instructions, because content fetched by one component is untrusted when it reaches the next
D. No control is needed, since both components already passed their own tests

#### Q99 · Domain 8 — Tools and MCPs
In a multi-component application, an MCP server reaches the customer's database and is the most privileged component. Every other component is already correctly scoped. Why must the MCP server itself be scoped to least privilege (for example, read-only)?

A. Read-only scopes reduce token consumption on database-backed tool calls
B. The application is only as contained as its most privileged seam, so a single over-scoped component becomes the weak point a steered action can exploit even when everything else is properly scoped
C. Platform billing rates are lower for read-only MCP connections
D. Least privilege is only required when the other components are unscoped

#### Q100 · Domain 2 — Applications and Integration
An excerpt from a packaged accelerator deployed for a regulated AWS customer reads:

`model="opus"` ... `deploy(platform="amazon_bedrock", identity=aws_role_arn)` ... `fetched = code_task.run(fetch_url=customer_page)` ... `next_call(input=fetched)`

Which TWO defects appear in this excerpt? (Select TWO.)

A. `model="opus"` is a moving alias rather than a pinned full model ID, so an upstream model change becomes a silent production change
B. `identity=aws_role_arn` is wrong; the deployment should authenticate with an Anthropic API key
C. Fetched content is passed directly into `next_call` as if it were trusted instructions, instead of being wrapped so the next component treats it as data
D. Amazon Bedrock is the wrong platform for a customer running on AWS
E. The `code_task.run` fetch step should be removed, since agents must never fetch external content

### Answer key — Module 5

**Q81: B** — The hardcoded repo_path is the defect; a reusable template takes the customer-specific value as a parameter so the next team configures the asset instead of editing the code. That is the difference between a template that runs and a template that reuses.

**Q82: D** — Loose scripts are the most common wrong packaging: they run, so they look reusable, but every customer-specific value is buried in a different file, and the next team copies and diverges them instead of configuring one asset.

**Q83: C** — Correct MCP server packaging documents each tool input and lets the installing team set the scope, so the server installs into a new environment without code edits. Hardcoded scopes or bundled credentials tie the package to the original engagement.

**Q84: A** — Code describes behavior; documentation covers what a future builder cannot reliably infer from the source — environment assumptions, expected inputs, handled failure modes, and the eval that defines "working." Without it, the next team treats the asset as a black box and rebuilds it.

**Q85: B** — The Cookbook is built to review one focused, self-contained pattern, not an entire application; a whole application stalls regardless of code quality. Only the extracted reusable pattern goes to the Cookbook as a focused example.

**Q86: D** — Engagement code can carry a licensing constraint that blocks the merge before any technical review, so rights and attribution are the gate the contribution must pass first. Skipping it turns the contribution into a problem legal must unwind later.

**Q87: B, E** — A maintainer accepts what they can verify: a runnable example shows the behavior without the reviewer building a harness, and a test proves it without the reviewer reproducing the reasoning. Those leave nothing to reverse-engineer, which moves the PR from the back of the queue to a fast review.

**Q88: C** — When code carries an engagement licensing constraint you cannot clear, the module is explicit: do not contribute it — escalate to the owner instead.

**Q89: B** — B is checkable and tied to a specific business-process constraint (human-in-the-loop review). A is not checkable, and C and D are infrastructure requirements, not functional ones.

**Q90: C** — C is checkable and tied to a specific regulatory constraint (data residency). A is not checkable, B is a design choice, and D is a functional requirement rather than an infrastructure one.

**Q91: A, C** — Pinning the full model ID with a retained prior version and gating promotion on the eval result are both deploy decisions. Residency is requirements, the platform choice is design, and production instrumentation is operate.

**Q92: D** — A gate is a decision to move from one phase to the next, and it is where a regulated engagement keeps control: no design-to-build move until the platform satisfies residency, and no promotion to production until the eval clears the pinned baseline.

**Q93: A** — Bedrock keeps identity and data inside the AWS boundary the customer already cleared, the pinned full model ID makes an upstream change something you adopt deliberately, and retaining the prior version gives you a rollback target. An Anthropic key or the first-party API moves data outside the required boundary, and an alias or no retention leaves nothing to roll back to.

**Q94: B** — The application never changed, but the alias did: an alias resolves to a moving target, and with no pinned prior version retained there was nothing to roll back to. The parser hotfix treated the symptom; the root cause was the unpinned deployment.

**Q95: D** — Claude Platform on AWS is accessed through the customer's AWS account using Anthropic's model IDs and lifecycle, but inference is Anthropic-operated outside the AWS boundary; Claude in Amazon Bedrock keeps data inside the customer's configured AWS boundary.

**Q96: B** — The mechanism is a residency mismatch that the laptop latency number hid. The rejection names data residency, not speed or cost, so the fix is to measure latency from the customer's region and choose the platform that meets EU-only residency; parser optimization, caching, or in-transit encryption treat dimensions that were never the problem.

**Q97: A** — Per-token rates are broadly aligned across platforms; total cost moves on egress, platform fees, and integration effort, so a lower token price can cost more in total. The module says to instrument total cost per call per platform.

**Q98: C** — Content fetched by a Claude Code task is untrusted when it reaches the next component; the seam must be marked as a trust boundary and the fetched content wrapped so the receiver treats it as data, not instructions. Components passing their own tests says nothing about the seam between them.

**Q99: B** — The application is only as contained as its most privileged seam: one component scoped too broadly becomes the weak point even when every other component is properly scoped. Least-privilege scoping keeps a steered component from reaching beyond its intended task.

**Q100: A, C** — `model="opus"` is the deployment/versioning defect: a moving alias with no pinned snapshot makes upstream updates silent production changes. Passing `fetched` straight into `next_call` is the boundary defect: untrusted fetched content crosses as instructions instead of being wrapped with `treat_as_data()`. Bedrock with an AWS role is correct for this customer, not a defect.

---
