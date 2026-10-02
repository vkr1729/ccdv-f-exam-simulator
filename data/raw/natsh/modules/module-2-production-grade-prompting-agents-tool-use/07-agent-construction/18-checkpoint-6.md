# Production-Grade Prompting, Agents & Tool Use — Agent Construction — Checkpoint 6

_Module 2, screen S18_

CheckpointAgent Construction·4 min

# Checkpoint 6 · Complete the agent wiring

The partial agent implementation below has two gaps. Write the missing content for each gap: (1) the description for update_record, and (2) the HITL checkpoint code.

Partial implementation

tools = [
{
"name": "read_record",
"description": "Use this to read a customer record by customer_id.",
"input_schema": {
"type": "object",
"properties": {
"customer_id": {"type": "string"}
},
"required": ["customer_id"]
}
},
{
"name": "update_record",
"description": [BLANK, write the description for this tool],
"input_schema": {
"type": "object",
"properties": {
"customer_id": {"type": "string"},
"field": {"type": "string"},
"new_value": {"type": "string"}
},
"required": ["customer_id", "field", "new_value"]
}
}
]

def run_agent_loop(user_request):
messages = [{"role": "user", "content": user_request}]

while True:
response = client.messages.create(
model=model, max_tokens=4096,
tools=tools,
messages=messages
)

if response.stop_reason == "end_turn":
return response

if response.stop_reason == "tool_use":
messages.append({"role": "assistant", "content": response.content})

tool_results = []
for block in response.content:
if block.type == "tool_use":

[BLANK, insert HITL checkpoint before executing update_record]

result = execute_tool(block.name, block.input)
tool_results.append({
"type": "tool_result",
"tool_use_id": block.id,
"content": result
})

messages.append({"role": "user", "content": tool_results})

### Gap 1: Write the description for update_record

### Gap 2: Write the HITL checkpoint code

Reveal model answers
Skip for now
