# Accelerators & IP Contribution — Packaging for Reuse — Watch Out: the template that could not be reused

_Module 5, screen S03_

Watch OutPackaging for Reuse·2 min

## The template that shipped fast and could not be reused

Setup

Hardcoding ships faster and you were working under a deadline, so you hardcoded the values that made the demo. The template worked. That is exactly why nobody looked at it again until the next team tried to reuse it.

This is a postmortem, written the way a team writes one after the reuse attempt fails, so you can see the failure form before anyone labels it as a mistake.

### What happened

A team built an agent template for a customer engagement and shipped it on time. To hit the due date, the customer-specific values went straight into the code: the repository path, the model name, the review thresholds, and a handful of prompt fragments specific to that customer's domain. The template ran, the engagement closed, and the build went into the shared repository labeled as reusable.

Months later a second team picked it up for a similar engagement. They could not configure it, because there was nothing to configure. Every value that needed to change was baked into the loop where the second team could not see it without reading the whole file. There was no document saying which values were customer-specific and which were load-bearing. There was also no bundled eval, so even after they guessed at the edits, nothing confirmed the template still worked in the new context. They had to rewrite it from scratch.

Why it broke

The build was treated as finished the moment it ran rather than at the moment it could be reused. Hardcoding was the reasonable call under a deadline, and it was never revisited. A working template does not announce that it cannot be reused. The cost appeared only when a second team paid for the rebuild that packaging was supposed to prevent, along with the time they lost discovering the template was a dead end.

What to Watch Out for

A template that runs has not been packaged for reuse. These are different finishing states. The warning signs are the absence of three things: no parameters where customer-specific values belong, no documentation describing the assumptions, and no bundled eval proving the asset still works in a different context. Package the asset while the build is fresh. The knowledge of what is customer-specific is most expensive to reconstruct after the people who had it have moved on.
