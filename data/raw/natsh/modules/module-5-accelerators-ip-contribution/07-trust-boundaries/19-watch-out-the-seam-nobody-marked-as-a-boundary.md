# Accelerators & IP Contribution — Trust Boundaries — Watch Out: the seam nobody marked as a boundary

_Module 5, screen S15_

Watch OutTrust Boundaries·2 min

## The seam nobody marked as a boundary

Setup

You connected the components that each passed their own tests. The parts were already checked and connecting verified parts feels safe. Each one was trusted in isolation. The gap was that a seam between two trusted parts cannot automatically be trusted itself.

This is a short transcript from a pairing session, the kind of back-and-forth that ends at the moment the unmarked seam gets identified.

### The session

Dev A: All three components pass their own tests. I just wired them up.
Dev B: Where does the Claude Code task send what it fetched?
Dev A: Straight into the next call as part of the prompt. It is just the content we pulled from the customer page.
Dev B: That content is untrusted. If it carries instructions, the next component runs them, because we never mark that seam as a boundary.
Dev A: But each component was trusted on its own.
Dev B: Right, and the seam between them was not. That is the one nobody treated as a boundary, so fetched content crosses as instructions.

Why it broke

Each component having passed its own tests said nothing about the seam between them. The fetched content was untrusted the moment it left the Claude Code task. It arrived from a component that worked in isolation and it was passed into the next call as if it were trusted instructions. The boundary existed in the data flow. It just was not marked, so no control checked it. A component that passes its own tests has no seam-level controls. Every point where data crosses between deployment environments requires an explicit boundary control regardless of how each component behaves independently.

What to Watch Out for

A component that is trusted in isolation does not automatically make the seam leaving it trustworthy. Mark every place data or instructions cross from one deployment environment to another as a boundary. Put a control there that treats fetched content as data rather than instructions, exactly as the security work taught. The seam nobody identifies is the one a steered action crosses.
