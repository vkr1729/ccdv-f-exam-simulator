# Accelerators & IP Contribution — Requirements & Lifecycle — From business requirements to requirements

_Module 5, screen S07A_

TeachingRequirements & Lifecycle·8 min

# From business requirements to functional and infrastructure requirements

The deployment-platform decisions that follow all assume the requirements already exist: the residency rule, the latency target, the identity model. This screen is where those requirements come from: turning a business problem into the functional and infrastructure requirements a deployment decision can be defended against.

## Capturing functional requirements from a business problem

A functional requirement names what the system must do, stated with enough detail to check. A business problem (e.g. "help support agents answer faster") is not yet a requirement; the functional requirements derive from it (e.g. "classify each ticket into one of four queues; draft a reply citing the relevant policy; never auto-send without human approval"). The discipline is to write each as a checkable statement of behavior. A vague goal cannot be designed against or verified, while a specific one becomes a line in an eval and a criterion at review.

## Deriving infrastructure requirements

Infrastructure requirements are the non-functional constraints the deployment must satisfy. Most of them are not stated in the business problem; instead, you derive them by asking the questions the business problem implies. Latency: how fast does a response need to be, measured where the user is? Scale: how many requests, and at what peak? Residency: where must the data be processed, and under which regulation? Identity: who acts, under what credentials, and what must be auditable? Latency, scale, residency, and identity are the infrastructure requirements that most often decide the deployment platform, and they are easiest to capture at the start, before a platform is chosen for other reasons.

## Documenting requirements so a decision can be defended

Requirements are written down because the deployment decision will be reviewed by people who did not gather them. A short requirements record covering the functional behaviors, the infrastructure constraints, and the regulation each constraint comes from lets you defend a platform choice as following from the requirements rather than from familiarity. This record is the input the next screen's deployment decision reads from.

Handles well

Turning a business problem into checkable functional and infrastructure requirements before any platform is chosen.

Adds cost or complexity

Eliciting infrastructure constraints up front takes a scoping conversation the team is tempted to skip.

Use a different approach

For a throwaway prototype with no review and no regulated data, lightweight notes are enough.
