# Accelerators & IP Contribution — Trust Boundaries — Checkpoint 7

_Module 5, screen S16_

CheckpointMulti-component app and trust boundaries·3 min

# Checkpoint 7: Complete the multi-component boundary configuration

Try it now. The multi-component app below is wired, with two blanks left. Drag the correct control onto the seam that receives untrusted fetched content and drag the correct identity scope onto the most privileged component.

The partial app

# components wired: API -> Claude Code task -> MCP server
fetched = code_task.run(fetch_url=customer_page)

# BLANK 1: control on the seam receiving untrusted fetched content
next_call(input=drop here(fetched))

# MCP server reaches the customer system (most privileged component)
mcp_server = MCPServer(
system=customer_db,
scope=drop here, # BLANK 2: identity scope
)

Drag tokens (shared bank, two are distractors)

treat_as_dataleast_privilege_read_onlyrun_as_instructionsfull_access

Submit
Skip for now
