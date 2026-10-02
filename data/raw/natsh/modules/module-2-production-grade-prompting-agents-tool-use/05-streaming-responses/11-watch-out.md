# Production-Grade Prompting, Agents & Tool Use — Streaming Responses — Watch Out

_Module 2, screen S11_

Watch OutStreaming Responses·5 min

## The stream that left a half-written tool call in the history

Setup

A streamed response can look fine on screen and still corrupt the next request. The text rendered, the user saw an answer, and the handler appended the turn to history. What the handler did not catch was that the stream dropped mid-block, so the tool_use call it stored was missing half its input. The next request fails validation, and the error points at the next turn and not the stream that caused it.

### Postmortem: partial tool_use block committed to history after a dropped stream

An agent used streaming so its operators could watch responses generate in real time. The handler accumulated content_block_delta events and appended the assistant turn to history when its read loop ended. In testing on a fast local connection, streams always ran to completion, so the loop always ended at message_stop and the stored turns were always complete.

In production, a network blip ended one stream after the tool_use block had opened and received part of its JSON input, but before content_block_stop. The read loop ended the same way it always had, so the handler appended the turn: an assistant turn containing a tool_use block whose input string was truncated JSON. The operator saw a partial answer and retried. The retry request included that corrupted turn in history, and the API rejected it with a validation error pointing at the malformed tool_use block.

The team spent an afternoon inspecting the schema and the retry logic, because the error surfaced on the retry request. However, the actual cause was upstream: the handler treated 'the read loop ended' as equivalent to 'the message is complete,' and those are not the same.

What to Watch Out for

A stream ending is not the same as a message completing. Only message_stop means the message is whole. If your handler commits a turn whenever its read loop exits, an interrupted stream writes a half-built block into history, and the failure shows up on the next request rather than the one that caused it. Gate the history append on message_stop, discard the partial turn on interruption, and retry from the last complete turn. When a tool-use error appears on a retry, check whether the prior turn was assembled from a stream before you touch the schema.
