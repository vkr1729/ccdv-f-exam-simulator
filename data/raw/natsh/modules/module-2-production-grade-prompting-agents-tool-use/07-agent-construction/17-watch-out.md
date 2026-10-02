# Production-Grade Prompting, Agents & Tool Use — Agent Construction — Watch Out

_Module 2, screen S17_

Watch OutAgent Construction·5 min

## The agent that edited a production file

Setup

The agent works end-to-end in testing because your test environment is forgiving, but production is not. The agent has the same tools, the same loop, and the same system prompt, but the HITL checkpoint is missing because testing never surfaced a use case where it was needed.

### A file-editing agent, tested in a scratch directory, deployed to a customer environment

A developer built an agent that could read, modify, and write configuration files. The system prompt gave it access to three tools, including read_file, write_file, and validate_config. The agent's loop was straightforward. After each write, it would re-run validate_config, and if the config still failed validation, the agent would adjust its edit and write again, up to a cap of ten iterations before stopping. The agent was tested against a scratch directory with a copy of the target config. It worked correctly on every test case, typically converging on a valid config in two or three iterations.

When deployed to a customer environment, the agent correctly identified that a configuration parameter was out of range. It proposed a correction, called write_file, re-ran validate_config, and got back a pass. The loop terminated cleanly after a single iteration, exactly as designed. The ten-iteration cap was never reached because it was never needed. The loop design was correct, but the exit condition was the problem.

The parameter the agent corrected was a rate limit that the customer's application relied on. validate_config checked that the value was within the schema's allowed range, which it now was. What validate_config did not check, and was never designed to check, was whether downstream systems depended on the old value. Within minutes of the write, the customer's application started failing because requests were being throttled at a rate it was not built to handle.

The agent's loop did exactly what the developer asked it to do. It edited, validated, and exited when validation passed. The failure was not in the loop. The failure was that the loop's exit condition (validate_config returns pass) was scoped to the file the agent was editing, and there was no checkpoint between "validation passed on this file" and "write committed to the customer environment." The missing piece was a checkpoint in the loop design: before the first write_file call hit the live customer config, pause and surface the proposed change for human review. In practice this means the loop needs an explicit branch between 'proposed change ready' and 'write committed', a state the developer never added because tests never produced a case that required it.

What to Watch Out for

The pattern this incident illustrates is a permissions question that never got asked during design. The agent had write access because the task involved file editing, and the task itself was legitimate. What the team missed was the gap between an agent that proposes a change and one that commits it. In a disposable test environment, that gap never surfaces because nothing a "wrong write" touches matters in testing, but production is different.

The design question that was never asked: "What is the worst outcome if write_file runs without a human check?" The answer to that question determines whether a human-in-the-loop checkpoint is required before the tool can execute.

If a tool can take an irreversible action in production, it needs a checkpoint before it runs. Register that constraint during design, when you're scoping the tool surface, not after the first incident occurs.
