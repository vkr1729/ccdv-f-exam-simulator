# Production-Grade Prompting, Agents & Tool Use — Extended Thinking — Extended Thinking

_Module 2, screen S05_

TeachingExtended Thinking·12 min

# Extended Thinking: Turning reasoning on, calibrating effort, and reading it back correctly

The prompting techniques shape what Claude produces. Extended thinking shapes how much work Claude does before it answers. Turn it on, and the model writes out its step-by-step reasoning first, then gives you the final answer. Your job is to decide when that extra work is worth the cost and to handle the reasoning it sends back.

## What extended thinking does

When you turn on extended thinking, the model "thinks out loud" before it responds. You’ll see this reasoning come back as its own thinking block in the API response, positioned just ahead of the block that holds the actual answer. On the newest models, the thinking block's content is omitted by default; you must request a readable summary through the display setting to see it.

On current models reasoning is adaptive: you enable it with the `thinking` parameter where it is not already on by default, and the model decides how much reasoning each request needs. You tune depth with the effort setting rather than a fixed token budget. The older `budget_tokens` control is deprecated and, on the newest model generations, returns a 400 error.

That reasoning isn’t free; thinking tokens cost the same as output tokens, so running a simple task at high effort means paying for accuracy you don’t need. The choice here mirrors the one you have already made: match the tool to the task. Don’t reach for extended thinking by default, apply it strategically where needed.

## When to use extended thinking

| Task shape | Extended thinking call | Reason

| Multi-step reasoning where the model has to hold several constraints at once: a math derivation, a multi-hop logic problem, planning a sequence of dependent actions. | Enable it, with the effort level matched to the depth of the problem. | The reasoning pass is where the model works through dependencies it would otherwise skip.

| Mechanical or lookup tasks: classification, format conversion, extracting a field, short factual answers. | Leave it off. | Extended thinking will not improve the answer, and you will be paying more tokens for something you didn’t need. A bare prompt with an output constraint is the right tool.

| Agentic loops where the model plans across several tool calls. | Enable it and budget for the planning step rather than per call. | Reasoning before a plan reduces wrong-tool selection downstream. Note the carry-back rule below, which applies in every tool-use loop.

## The carry-back rule: thinking blocks must return to the API unchanged

When extended thinking is on and your conversation uses tools, there’s one rule you can’t skip: every thinking block you get back has to go back to the API exactly as it arrived on the next turn. Each block comes with a signature that confirms the reasoning wasn’t tampered with. If you edit it, summarize it, or drop it, the signature stops matching and the API rejects the request.

Redacted thinking blocks work the same way. Their contents are encrypted and not meant to be read by humans, but they still have to be returned untouched.

This is a structural requirement, not a prompting choice you get to make. The most common slip-up is stripping out the thinking block to save context, which ends up breaking your next request. If the real worry is how much context piles up from accumulated reasoning, the fix is the context-engineering work we’ll cover in this module.

Forward pointer

This lesson enables reasoning and calibrates its effort setting; it does not cover model selection. Choosing which model to run, as distinct from whether to enable reasoning, is taught in the MSO Foundations module that precedes this one.

##

Handles well
Hard reasoning and planning tasks where a wrong answer is expensive and the extra tokens buy accuracy.

Adds cost or complexity
The carry-back requirement in tool-use loops, and an effort setting you now must calibrate.

Use a different approach
For classification, extraction, and format tasks, a well-constrained prompt is cheaper and just as accurate.
