# Production-Grade Prompting, Agents & Tool Use — Cumulative Debug Task — Debug: Fix

_Module 2, screen S23_

CumulativeDebug Task·10 min

# Cumulative debug task · Write the corrected version

Stage 2: write the corrected version of each bug identified on the previous screen. For each one, show the fixed code and name what it changes.

Buggy implementation (for reference)

# --- TOOL DEFINITIONS ---
tools = [
{
"name": "get_customer_data",
"description": "Gets data.",
"input_schema": { "type": "object", "properties": { "id": {"type":"string"} }, "required": ["id"] }
}
]

# --- AGENT LOOP ---
def run_agent(user_request, session_history):
messages = session_history + [{"role":"user","content":user_request}]
while True:
blocks = {}
stop_seen = False
with client.messages.stream(
model=model, max_tokens=4096, tools=tools, messages=messages,
thinking={"type": "adaptive"}
) as stream:
for event in stream:
if event.type == "content_block_start":
blocks[event.index] = init_block(event)
elif event.type == "content_block_delta":
apply_delta(blocks[event.index], event.delta)
elif event.type == "message_stop":
stop_seen = True
assistant_content = [b for b in assemble(blocks) if b["type"] != "thinking"]
messages.append({"role": "assistant", "content": assistant_content})
response = finalize(blocks)
if response.stop_reason == "end_turn":
return response
for block in response.content:
if block.type == "tool_use":
result = execute_tool(block.name, block.input)
messages.append({"role":"user","content":[{"type":"tool_result",
"tool_use_id":block.id,"content":result}]})

# --- MEMORY ---
def build_session_history(prior_sessions):
# Concatenating all prior session transcripts in-context
full_history = []
for session in prior_sessions:
full_history.extend(session["messages"])
return full_history

Reveal model answer
Skip for now
