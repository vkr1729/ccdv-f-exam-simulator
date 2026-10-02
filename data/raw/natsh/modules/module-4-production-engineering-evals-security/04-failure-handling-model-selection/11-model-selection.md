# Production Engineering, Evals & Security — Failure Handling & Model Selection — Model Selection

_Module 4, screen S10A_

TeachingModel Selection·10 min

# Model selection in production

The previous screens kept a system inside its cost budget once the model was chosen. This screen handles the choice that sets that budget in the first place: which Claude model runs the workload.

Cost management optimizes spend within a model. Model selection determines the baseline that optimization works from.

## The model family and its capability tiers

Claude is a family of models that trade cost, latency, and capability against each other: Fable is the most capable for the most demanding reasoning, coding, and agentic work; Opus handles demanding work above the Sonnet envelope; Sonnet is the balanced default for most production workloads; Haiku is built for speed and cost efficiency on tasks that fit its envelope. The same prompt runs on any of them, so model choice is a lever you set per workload and can change without rewriting the application. Confirm the current lineup and model IDs against platform.claude.com at build time.

## The latency, cost, and quality trade-off

Upgrading model tier trades quality at the price of higher per-token cost and usually higher latency. Downgrading the model tier buys speed and lower cost at the risk of a quality drop. A higher-tier model can also process a request faster and cheaper if it reaches a conclusion in fewer tokens than a lower-tier model would. The cost of a mistake belongs in that calculation: saving a few dollars a day on a lower-tier model is not a sound trade if the quality drop introduces errors that carry significant downstream cost. There is no globally correct choice, only the right choice for a task at a quality standard. The discipline is to make the trade-off measurable rather than reaching for the most capable model by default. This is the most common and most expensive model-selection mistake in production. The default is to start with Sonnet, move up to Opus only when an eval shows Sonnet missing the quality bar, and move down to Haiku only when an eval shows the quality drop is acceptable for the task.

## Routing: a default model plus an override on a task signal

A system does not have to use one model for everything. A common production pattern is a default model with an override: route the bulk of traffic to a balanced default, and send specific request types to a larger or smaller model based on a cheap signal read from the request, such as task type, input length, or a difficulty classification. This is the same routing idea used for retrieval, applied to model choice: you pay for the more capable model only on the requests that need it. Where every request is the same shape, skip the router and pin one model.

## When to step up and when to step down

Step up a tier when an eval shows the current model failing on the hardest cases your traffic contains and the cost of a wrong answer is high. Step down a tier when an eval shows a cheaper model holding the quality bar on the bulk of traffic, freeing budget and latency. In both directions the eval is the instrument: a model change is promoted on a measured score against your cases. This is why the eval you built earlier is also the gate for a model decision.

Handles well
Matching each workload to the cheapest model that meets its quality bar, measured on an eval rather than assumed.

Adds cost or complexity
Routing adds a classification step and a second model path to maintain.

Use a different approach
For uniform traffic at one quality bar, pin a single model and skip the router.
