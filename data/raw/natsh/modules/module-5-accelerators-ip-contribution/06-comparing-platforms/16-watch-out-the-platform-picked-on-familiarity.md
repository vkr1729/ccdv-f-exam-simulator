# Accelerators & IP Contribution — Comparing Platforms — Watch Out: the platform picked on familiarity

_Module 5, screen S12_

Watch OutComparing Platforms·2 min

## The platform picked on familiarity that failed residency

Setup

You picked the platform your team was already familiar with, because the migration looked easy and the deadline was approaching rapidly. It built just fine; the trouble was that easy-to-build and allowed-to-ship are different criteria.

The following anecdote is the kind a developer tells a teammate after a review goes sideways. It lets you see the familiar platform trap before anyone calls it a mistake.

### What happened

A developer building for a regulated customer chose the platform the team had shipped on before. The integration came together quickly because the team knew the tools and resources. The build passed its functional tests. At the customer's security review, the reviewer asked where data was being processed. The selected platform did not satisfy the customer's residency requirements. A different platform, one the team knew less well, would have satisfied the requirement through regional deployment options the customer had already cleared. The placement was rejected, and the integration had to be rebuilt on the platform that met the residency constraint.

Why it broke

Familiarity optimized for the wrong test. The easy migration answered whether the team could build quickly. It never answered whether the deployment would pass the customer's residency review, which was the test that determined whether it could ship. Because the compliance requirement was not fulfilled during scoping, it arrived at the go-no-go review instead. This is the most expensive place to discover it, because the build was already complete.

What to Watch Out for

A platform that is easy for your team to build on is not necessarily a platform the customer is allowed to run. When the customer is regulated, the residency and compliance constraint is often pass-or-fail, rather than tradeoffs. Identify them early during scoping and let them influence the placement before familiarity does. Checking early costs a scoping conversation, while checking late costs an entire rebuild.
