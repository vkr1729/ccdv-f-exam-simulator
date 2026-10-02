# Production-Grade Prompting, Agents & Tool Use — Streaming Responses — Checkpoint 4

_Module 2, screen S12_

CheckpointStreaming Responses·4 min

# Checkpoint 4 · Repair the broken stream handler

The handler below streams a response and appends the assistant turn to conversation history. It contains one defect that only surfaces when a stream is interrupted. Identify the defect and write the corrected version.

Broken handler

blocks = {}
stop_seen = False
with client.messages.stream(model=model, max_tokens=4096, messages=messages, tools=tools) as stream:
for event in stream:
if event.type == "content_block_start":
blocks[event.index] = init_block(event)
elif event.type == "content_block_delta":
apply_delta(blocks[event.index], event.delta)
elif event.type == "message_stop":
stop_seen = True
messages.append({"role": "assistant", "content": assemble(blocks)})

Reveal model answer
Skip for now
