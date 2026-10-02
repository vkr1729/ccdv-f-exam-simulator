# Accelerators & IP Contribution — Deployment & Versioning — Watch Out: the deployment that broke

_Module 5, screen S09_

Watch OutDeployment & Versioning·3 min

## The deployment that broke when the model alias moved

Setup

You shipped against the alias that pointed at the recommended version, because that was the convenient default and it gave you the latest model for free. It worked. Then the alias advanced, and what was free turned out to have a price.

This is a trace excerpt from a production log, the kind you would scroll back through after an incident. It shows the day the output shape changed and why there was nothing to roll back to.

The log

--: deploy: model="opus" status=ok
--: alias advanced -> new opus version (no app change)
--: parser: KeyError "summary" in response payload
--: Error: output shape changed; downstream parse failed
--: rollback attempted -> no pinned prior version retained
--: incident: hotfix parser; root cause = unpinned deployment

Why it broke

The application never changed, but the alias did. No pinned prior version had been retained, so there was nothing to roll back to. The hotfix repaired the parser but left the unpinned deployment in place.

What to Watch Out for

An alias resolves to a moving target; a pinned full model ID is a fixed snapshot. Pin the full model ID so an upstream update is something you adopt on purpose. Keep the prior pinned version available so a regression is a rollback rather than a hotfix. Gate the new version through your eval before you promote it, so the output-shape change shows up in a test run instead of in production.
