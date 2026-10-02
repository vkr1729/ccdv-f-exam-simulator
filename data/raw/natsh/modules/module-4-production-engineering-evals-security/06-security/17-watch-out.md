# Production Engineering, Evals & Security — Security — Watch Out

_Module 4, screen S15_

Watch Out
Security
8 min

## The fetched page that gave the orders

Setup

Your agent fetches web pages and can write to a single file path. Your users are all internal, so you decided the inputs were trusted and skipped validating the pages it pulls. The reasoning felt sound: if you trust the person making the request, you trust the request. Then the agent wrote a file nobody had asked for.

## Short transcript: a pairing session where the fetched content gave the orders

Two developers, working on an agent that reads web pages and can write to a single file path:

Dev A

"Our users are internal, so I did not bother validating the pages the agent fetches. The risk is the user, and we trust them."

Dev B

"But the instruction does not come from the user. It comes from the page. Pull up the run where it wrote that unexpected file."

Dev A

"Here. The user asked it to summarize a page. The page had a line, near the bottom, telling the agent to write its summary to a different path and ignore its prior instructions. So, it followed that instruction."

Dev B

"Right there. The agent read the page as instructions, not as data. The user never asked for that write. Trusting the user doesn't help, because the hostile instruction arrived through the content the agent fetched."

The agent treated text inside the fetched content as commands. The fix was two-sided: treat fetched content as data to be examined and put a hook in front of the write tool that refuses an action triggered by untrusted input. This enforces the boundary before the tool runs rather than relying on the prompt alone. With the hook in place, the same injected line hits a denied write and an audit entry instead of a successful exfiltration.

Why this broke

Untrusted fetched content was treated as instructions. The trust placed in the user did nothing because the injection arrived through the content. Treat fetched content as data and enforce the action boundary with a hook.
