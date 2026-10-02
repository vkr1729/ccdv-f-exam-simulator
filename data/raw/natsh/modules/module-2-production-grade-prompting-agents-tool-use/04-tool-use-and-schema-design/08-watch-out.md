# Production-Grade Prompting, Agents & Tool Use — Tool-use and Schema Design — Watch Out

_Module 2, screen S08_

Watch OutTool-use and Schema Design·5 min

## The description that sent Claude to the wrong tool

Setup

A schema can look correct and still fail. Typed parameters and passing happy-path tests tell you the structure is valid, but they do not tell you whether Claude can reliably choose between your tools when an input sits near the boundary of two overlapping descriptions. That is the failure mode that initial testing misses and the one most likely to surface during production.

### A Developer is three hours into a code review when they paste an internal channel conversation into a debug session.

This is a composite exchange based on common patterns in developer debugging conversations. The dialogue is constructed to illustrate the diagnostic moment when description overlap gets named, not transcribed from a specific code review.

Let’s look at the exchange below that happens after a Developer has been debugging incorrect tool selections since morning. The Senior Developer asks one question that reframes the whole problem:

Developer: "Why does Claude keep calling search_docs when the answer is already in the context? I've re-run this four times, and it keeps going to the wrong tool."

Senior Developer: "What does the description for search_docs say?"

Developer: "'Use this to find information about the product.'"

Senior Developer: "And what does get_context_summary say?"

Developer: "'Use this to retrieve relevant information from the current session.'"

Senior Developer: "Those descriptions are the same thing from Claude's perspective. Both say, 'find information.' One of them needs to say when not to call it."

Developer: "So, I need to add an exclusion?"

Senior Developer: "Right. Try using search_docs ‘when the user asks a question that requires looking up content not already present in this conversation. Do not call this if the answer is available in the current session context.' Then get_context_summary handles the in-context case. You will want to tighten get_context_summary's description the same way: add 'Only use this if the answer is already present in the current session. Do not use this to look up new information.' Both tools need the boundary, not just one."

Developer: "That's two sentences."

Senior Developer: "Right. One to say when to use it, one to say when not to. That's the whole fix."

What to Watch Out for

Claude selects a tool by reasoning over all registered descriptions in the context of the full conversation. When two descriptions look similar, that reasoning has no reliable signal to distinguish them so Claude picks based on small surface differences that may not correspond to the distinction you intended.

When the failure is overlapping descriptions, the fix is consistent: add one sentence naming when not to call the tool to give Claude a decision boundary. If the descriptions cannot be cleanly separated even with exclusion conditions, the tools may need to be merged into one with a type parameter instead.
