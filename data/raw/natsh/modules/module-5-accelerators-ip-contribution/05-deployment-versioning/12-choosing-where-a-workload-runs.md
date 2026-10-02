# Accelerators & IP Contribution — Deployment & Versioning — Choosing where a workload runs

_Module 5, screen S08_

TeachingDeployment & Versioning·15 min

# Choosing where a Claude workload runs and versioning what ships

A packaged asset and a contributed one are both merely code until something runs them. The asset now faces a different question: where it runs and how to lock its version, so an upstream change does not become an untracked change in production. That platform decision is rarely about technical merit alone. In practice, it is usually shaped by where the customer already has cloud infrastructure, identity management, and compliance agreements in place. The first question is usually about which platform the customer already trusts and operates on.

## The customer's cloud usually determines the platform

The deployment platform is the environment where the Claude workload runs. The same model can run in several deployment environments, and the customer's existing cloud usually determines which one. The first-party Claude API is Anthropic's own environment and typically receives new features first. Claude Platform on AWS is accessed through the customer's AWS account using Anthropic's own model IDs and lifecycle; inference is Anthropic-operated, outside the AWS boundary. Amazon Bedrock offers two integrations: Claude in Amazon Bedrock uses the Messages API at /anthropic/v1/messages with broad feature parity; confirm any feature-specific requirements against the Bedrock documentation, as a features-not-supported list exists, while Claude on Amazon Bedrock (legacy) uses the InvokeModel/Converse APIs with ARN-versioned identifiers. Google Vertex AI does the same inside Google Cloud. Third-party platforms, such as Microsoft Foundry, embed Claude inside a product the customer already uses. Microsoft Foundry offers Claude in two hosting forms: Hosted on Azure (currently Claude Opus 4.8, Claude Sonnet 5, and Claude Haiku 4.5, with inference running end-to-end on Azure infrastructure, generally available) and Hosted on Anthropic (all other Foundry Claude models, with inference on Anthropic-operated infrastructure). Residency assumptions for regulated customers depend on the hosting form of the specific model. Confirm the hosting form and the current model split with Microsoft at build time.

### Identity and data residency are important for security

Identity and data location are answered by the platform, not your code. Bedrock uses AWS identity and keeps data inside the customer's AWS boundary; Vertex uses Google Cloud identity and boundary. Both offer regional routing when residency is a constraint. Matching the platform to the customer's existing compliance agreement avoids a data-residency review from scratch.

### Pin the version so an upstream model change is not a silent production change

Versioning is what keeps a model or prompt change from becoming a silent change in production. Every Claude model ID points to a specific model snapshot. Aliases such as Opus and Sonnet are convenient, but they evolve over time and may resolve to different versions across deployment platforms. A pinned full model ID resolves to a fixed snapshot. Pin the specific model version rather than the alias, so an upstream model update is a deliberate choice rather than a silent production change. Then version the prompt and the asset alongside the code. Finally, keep the prior version available so the regression can be rolled back. An unpinned deployment makes every upstream model update an untracked change to your output.

The first line follows a moving alias. The second pins the snapshot.

# Pre-4.6 example: a convenience alias can resolve to a new
# version without you knowing
model = "claude-haiku-4-5"

# Pre-4.6 pinned snapshot: the version is fixed until you change this line
model = "claude-haiku-4-5-20251001"

For Claude 4.6 and later, the model ID alone pins to a specific snapshot; for earlier models, the ID plus a date suffix is required. Verify the current convention at platform.claude.com at build time.

### Promote a version through the eval

Gate promotion on the eval suite. Send a new version to a portion of traffic, compare against the pinned baseline, and promote or roll back on the result. This is where the eval stops being a one-time test and becomes the deployment gate.

### The deployment-platform decision table

| Platform | Identity and data model | When to choose it | How versioning is pinned

| First-party Claude API | Anthropic identity and terms. | The customer has no binding cloud or residency constraint and wants the newest capabilities. | Pin the full model ID and keep the prior snapshot.

| Claude Platform on AWS | Anthropic identity and terms, accessed through the customer's AWS account; inference is Anthropic-operated outside the AWS boundary. Model lifecycle follows Anthropic's deprecation schedule. | The customer is on AWS but wants Anthropic model IDs, lifecycle, and feature parity with the first-party API. | Pin using the same model ID format as the Claude API (for example, claude-opus-4-8). Lifecycle follows Anthropic's schedule. (Confirm at publish time.)

| Claude in Amazon Bedrock | Messages API at /anthropic/v1/messages, broad feature parity with the first-party API; confirm feature-specific requirements against the Bedrock documentation. Data stays inside the customer's configured AWS boundary. | The customer is on AWS, wants broad feature parity with the first-party API (confirm feature-specific requirements), and holds a compliance posture there. | Pin the full model ID using the anthropic. prefix format. Partner retirement dates differ from Anthropic's schedule. Confirm at publish time.

| Claude on Amazon Bedrock (legacy) | AWS identity and billing, InvokeModel/Converse APIs with ARN-versioned model identifiers. | The customer is on an existing Bedrock integration using InvokeModel or Converse and has not migrated to the Messages API. | Pin via ARN-versioned model identifiers per Bedrock's versioning controls.

| Google Vertex AI | Google Cloud identity, Identity and Access Management (IAM), and billing, with regional or global endpoints for residency. | The customer is on Google Cloud and holds a compliance posture there. | Pin the full model ID before rollout using Vertex's model ID format. Partner retirement dates differ from Anthropic's schedule.

| Third-party platform | The wrapping product's identity and billing model. Note: Claude in Microsoft Foundry offers two hosting forms: Hosted on Azure (currently Opus 4.8, Sonnet 5, and Haiku 4.5; inference end-to-end on Azure) and Hosted on Anthropic (all other Foundry Claude models). Confirm residency and compliance terms with Microsoft before selecting this path for a regulated customer. | The customer already runs the platform that embeds Claude. | Pin per the platform's versioning controls.

Handles well

Matching the platform to the customer cloud and pinning the version keeps a migration reviewable and a rollback possible.

Adds cost or complexity

Pinning, retaining prior versions, and gating promotion on the eval add release-process overhead to every deployment.

Use a different approach

For a throwaway prototype that never touches production, a moving alias is fine: pinning is for what ships.
