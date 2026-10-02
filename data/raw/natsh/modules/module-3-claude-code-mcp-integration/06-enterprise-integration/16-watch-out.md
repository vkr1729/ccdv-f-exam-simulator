# Claude Code, MCP & Integration — Enterprise Integration — Watch Out

_Module 3, screen S16_

Watch OutEnterprise Integration·3 min

## The OAuth connection that worked in staging and failed in production

Setup

The OAuth connection worked end to end in staging, so moving it to production felt like a routine cutover. What the team missed was that OAuth redirect URIs are registered per host and often governed per environment, so success in staging did not mean the production host was authorized to complete the sign-in flow.

## The conversation that surfaced the missing step

The following exchange occurred in a post-deployment review after MCP integration failed in production. The integration had passed all staging tests.

Security reviewer: "Every production sign-in attempt through the MCP connection is failing. The error is a redirect URI mismatch. Where was the OAuth app registered?"

Developer: "I registered it for staging.mycompany.com during development. We moved to production last week. The connection worked all through staging."

Security reviewer: "That's the issue. The OAuth provider only accepts redirect URIs you've explicitly registered, and production.mycompany.com is not on the allowed list. Every sign-in attempt hits the check, fails the URI match, and loops back to the sign-in screen."

Developer: "So I just need to add the production URI to the app registration?"

Security reviewer: "Yes, and before you do, check whether your staging app registration should be a separate app from production. Most enterprise customers require separate OAuth app registrations for each environment as part of their security policy, so using the same app registration across environments is the second issue I'd flag."

The developer had tested the OAuth flow end to end in staging and confirmed it worked, meaning the production failure was not a code defect. Instead, it was a configuration step that applies per host and per environment, and the developer had not known to do it for production.

What to Watch Out for

OAuth redirect URIs are registered per host, so a working staging OAuth connection does not mean the production connection is configured. Before moving any OAuth-authenticated MCP integration into a new environment, add the new host’s redirect URI to the OAuth app registration. For regulated enterprise customers, verify whether separate OAuth app registrations are required for staging and production. Include the registration step in the deployment checklist so it is not discovered at the first production sign-in attempt.
