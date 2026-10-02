# MSO Foundations — Models & Reasoning — Teaching

_Module 1, screen S03_

TeachingModels & Reasoning·10 min

# Model options and reasoning modes

The Model Family
Reasoning Modes
How They Work Together

### The Claude model family

Claude is a family of models that currently spans four tiers: Fable, Opus, Sonnet, and Haiku. Each model represents a different tradeoff across cost, latency, and capability. Sonnet is the balanced default for most production workloads. Haiku is built for speed and cost efficiency on tasks that fit its capability envelope. Opus handles demanding work above the Sonnet envelope, and Fable is the most capable tier, built for the most demanding reasoning, coding, and agentic work where maximum intelligence is the priority. The practical default is to start with Sonnet, move up a tier only when an eval shows the current tier missing your quality bar, and move down to Haiku only when an eval shows the quality drop is acceptable for the task. Confirm the current model lineup and identifiers against platform.claude.com/docs at build time, since the Claude family is evolving.

### Reasoning modes are a separate setting from model choice

Choosing which model to run is one decision. Whether the model reasons before answering is a separate decision you make per call. On current models the reasoning mode is adaptive thinking: the model decides when and how much to think, and you tune depth with an effort setting rather than a fixed token budget (the older budget_tokens control is deprecated and, on the newest model generations, returns a 400 error). Thinking content is omitted from responses by default on the newest models. Request summarized display when you need to show it. Reasoning earns its cost on hard, multi-step problems and is wasted on lookups and classification. The key point for this module is that the two levers compose: model choice picks the family member, while the reasoning mode is configured per request. Per-model defaults differ (some of the newest models think adaptively by default or always), so confirm the current thinking defaults for your model at build time.

### How the two work together

Because model choice and reasoning mode are independent, each can be set separately. A capable model with reasoning off is fast and direct, while a smaller model with reasoning on spends more tokens to think. The most demanding tasks pair a capable model with a higher effort setting. Module 2 teaches the mechanics of enabling reasoning and handling the thinking blocks it returns. The decision of which model to run, weighed against cost, latency, and quality, is taken up in Module 4.
