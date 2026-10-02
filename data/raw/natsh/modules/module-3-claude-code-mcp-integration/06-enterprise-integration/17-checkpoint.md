# Claude Code, MCP & Integration — Enterprise Integration — Checkpoint

_Module 3, screen S17_

CheckpointEnterprise Integration·3 min

# Checkpoint 6: diagnose the authentication failure from a trace

Try it now: read the connection trace below.

Name the authentication failure mechanism, then select the correct targeted fix from three options.

Connection trace

[MCP Client] Connecting to https://data-api.internal/mcp ...
[MCP Client] GET /auth/token, 401 Unauthorized
[MCP Client] Reading credential from: /home/jenkins/.config/mcp-credentials.json
[MCP Client] Credential value: WAREHOUSE_TOKEN= sk-****[redacted]
[MCP Client] Retrying with credential, 401 Unauthorized
[MCP Client] Connection failed after 3 attempts

AFix A: Rotate the API key and update /home/jenkins/.config/mcp-credentials.json with the new value.

BFix B: Rotate the rejected key, then move the credential out of the file and inject it as an environment variable in the CI pipeline runner configuration. Update the MCP configuration to reference the variable.

CFix C: Switch from API key authentication to OAuth for this service.

Submit
Skip for now
