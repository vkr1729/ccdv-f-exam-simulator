# Accelerators & IP Contribution — Packaging for Reuse — Packaging a working build

_Module 5, screen S02_

TeachingPackaging for Reuse·16 min

# Packaging a working build so the next engagement starts from an asset

You finished the prior modules with a build that runs: an agent loop, a configured MCP server, an eval that proves that the prompt works. The most time-consuming and expensive thing on a team is the engineering time that gets spent rebuilding the same thing for the next customer.

## What an accelerator does: keep the reusable parts and separate out the rest

An accelerator is a solution packaged so future engagements start from a working foundation rather than from a blank repository. In blueprint terms, this is packaging for reuse: separating engagement-specific code from the reusable core and parameterizing the rest. Take a working build, separate the parts that are customer-specific, and expose them as parameters with documented defaults. The asset then configures rather than gets entirely rewritten. Packaging for reuse while the build is fresh is cheaper than reconstructing the intent months later, when the person who knew why a value was hardcoded has moved on.

### Most reusable work falls into different asset types, and each one packages differently

Most reusable work falls into one of three categories used throughout this module: a template, a configurable server, or a portable eval. Each type holds a different kind of work and needs to be packaged in its own way. Reaching for the wrong type can make an asset look reusable while still making it difficult to apply.

| Asset type | What it bundles | What correct packaging requires

| Agent Template | The system prompt, the tool schemas, and the loop structure from a working agent. | Pull the domain-specific values into configuration with documented defaults, so a new team sets the values rather than editing the loop.

| MCP Server Package | The tools the server exposes, with their inputs and the scope the installing team controls. | Document each tool input and let the installing team set the scope, so the server installs into a new environment without code edits.

| Eval Suite | The graded test set and the judge rubric that prove the asset works. | Ship the dataset and rubric together so a new team can run them in their own context and confirm the asset still works there. The same eval suite also acts as the gate at deployment. When you promote a new model version to production, run it against a pinned baseline score before the version goes live.

Shipping an agent as a set of loose scripts instead of a template is the most common version of the wrong approach. The scripts run, so they look reusable, but every customer-specific value is buried in a different file, and the next team copies and diverges them instead of configuring one asset.

### Document both the code and the assumptions

Code describes behavior. Documentation covers what a future builder cannot reliably infer from reading the source: the assumptions the asset makes about its environment, the inputs it expects, the failure modes it already handles, and the eval that defines whether it still works. Without this, the next team treats the asset as a black box and rebuilds it.

### Bundle the audit log as part of the package

A regulated customer's reviewer asks what data the asset touches, what identity it acts under, and what log it leaves. An accelerator without these passes a demo and stalls at the first security review. Treat the audit log as part of the package.

### The packaging checklist

Keep this checklist next to the build while you package it. Each column is a decision you make once per asset.

| Asset type | What to parameterize | What to document | What to bundle for audit

| Agent template | Every value that changes per customer: prompts, paths, scopes, credentials by reference, and thresholds. | Environment assumptions, expected inputs, handled failure modes, and the eval that defines working. | The data touched, the identity acted under, and the log of what the asset did.

| MCP Server | Scopes, credentials by reference, and per-customer paths. | Expected inputs per tool, scope boundaries, and handled failure modes. | The data touched, the identity acted under, and the log of what the asset did.

| Eval Suite | Thresholds and dataset paths that change per customer or environment. | The rubric logic, what the scores mean, and the baseline the asset is pinned to. | The data touched, the identity acted under, and the log of what the asset did.

Handles well

Parameterizing while the build is fresh turns one delivery into an asset the next engagement configures in hours.

Adds cost or complexity

Separating generalizable from customer-specific parts and documenting assumptions adds real time to the first build.

Use a different approach

For a one-off a customer will never reuse, packaging overhead is not worth it: ship the build and move on.
