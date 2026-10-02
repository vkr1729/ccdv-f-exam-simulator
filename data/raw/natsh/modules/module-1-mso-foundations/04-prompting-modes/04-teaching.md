# MSO Foundations — Prompting Modes — Teaching

_Module 1, screen S04_

TeachingPrompting Modes·8 min

# Prompting modes: zero-shot, one-shot, multi-shot

The Three Modes
Cost & Quality Trade-off
Mode & Model Choice

### The three modes

Separate from how you word a prompt is how many worked examples you give the model inside it. Zero-shot gives the instruction and no examples: you describe the task and ask for the result. One-shot adds one example of the input paired with the desired output. Multi-shot, also called few-shot, includes several such examples. The examples are not training data; they sit in the prompt and show the model the exact shape of the answer you want, which a description alone often fails to pin down.

### The cost and quality trade-off

Each example you add costs tokens on every call and consumes context budget, so the choice trades quality against cost. Reach for zero-shot when the task is simple and the output shape is obvious. Move to one-shot or multi-shot when the output has a specific structure, casing, or edge case that a description keeps missing. Often one or two correct examples usually fix the issue faster than another paragraph of instructions. The general discipline, which Module 2 reinforces, is to add the smallest amount of prompt that produces a reliable result.

### Mode choice interacts with model choice

Prompting mode and model choice are related levers. A more capable model often succeeds zero-shot on a task where a smaller model needs a few examples to match the structure, so adding examples can let a cheaper model do the job. The two decisions are worth making together: try the simplest model and the fewest examples that meet your eval, and add capability or examples only where the eval says you need them.
