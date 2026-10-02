# Production Engineering, Evals & Security — Failure Handling & Model Selection — Checkpoint

_Module 4, screen S10B_

CheckpointModel Selection·2 min

# Choose the model and name the deciding constraint

For each scenario, pick the model tier (Opus, Sonnet, or Haiku) and identify the one constraint that drives the decision.

Scenario 1. A high-volume classification step labels millions of short messages per day; an eval shows Haiku holding the quality bar. Which choice is best?

AOpus, the deciding constraint is reasoning depth on ambiguous messages

BSonnet, the deciding constraint is balancing quality and speed across volume

CHaiku, the deciding constraint is cost-at-volume, since the eval confirms the quality bar still holds

DOpus, the deciding constraint is consistency across millions of requests

Scenario 2. A multi-step agent plans a dependent refactor where a wrong early step is expensive; an eval shows Sonnet missing the bar on the hardest cases. Which choice is best?

ASonnet, the deciding constraint is cost efficiency on a long agent run

BOpus, the deciding constraint is quality on hard reasoning where the cost of a wrong answer is high

CHaiku, the deciding constraint is speed across many sequential steps

DSonnet, the deciding constraint is latency on dependent steps

Scenario 3. Mixed traffic: most requests are simple lookups, a few are complex synthesis. Which approach is best?

AOpus for everything, the deciding constraint is guaranteeing quality on the complex requests

BHaiku for everything, the deciding constraint is minimizing cost across all traffic

CSonnet for everything, the deciding constraint is a single balanced model for mixed needs

DRoute: a Sonnet (or Haiku) default with an Opus override on the complex requests, the deciding constraint is that traffic is mixed

Submit
Skip for now
