# MSO Foundations — Module Wrap-up — Exercise

_Module 1, screen S07_

ExercisePredict the Behavior·6 min

# Exercise: predict the behavior

Try it now. Each scenario below presents a configuration drawn from one of this module’s four foundations, sampling, prompting mode, request shape, and the context budget. For each one, select the answer that predicts the correct behavior and identifies the reason why. Partial credit is available when you answer three of four correctly.

Scenario 1

Consider a classification task run at temperature 0 versus the same task run at a high temperature. Predict how the outputs differ across repeated runs.

AAt a low temperature, the model concentrates probability on the most likely tokens, so repeated runs return the same label far more consistently, though never with guaranteed determinism, even at temperature 0. At a high temperature, the distribution spreads out, so wording and even the chosen label can vary. For a classifier you want the low-temperature, repeatable behavior.

BBoth configurations return identical output every run, because temperature only affects response length, not which tokens are chosen.

CThe high-temperature run is more accurate, because spreading the distribution lets the model consider more of the correct answers.

DTemperature has no effect on a classification task, because classification always returns a fixed label regardless of sampling.

Scenario 2

Consider a task that keeps returning output in the wrong structure under a zero-shot prompt. Predict what changes if you switch to multi-shot.

ASwitching to multi-shot retrains the model on the new structure, so the change is permanent across every future call once the examples are sent.

BAdding two or three correct input-output examples shows the model the exact structure to match, which usually fixes a structure problem that more instruction text did not. The cost is extra tokens on every call, so add the fewest examples that make the output reliable.

CMulti-shot will not help a structure problem; only raising the temperature changes the shape of the output.

DMulti-shot lowers the token cost per call, because examples let the model produce shorter responses.

Scenario 3

Consider a pipeline that must process 50,000 documents overnight with no user waiting. Predict which request shape fits and why.

AA synchronous loop fits best, because calling the API once per document is the simplest pattern and avoids the overhead of submitting a batch.

BStreaming fits best, because sending the response in pieces lets the pipeline start processing each document sooner.

CThe batch pattern fits: submit the requests in a batch and poll for completion, accepting longer latency for a lower per-token cost. A synchronous loop would hit rate limits and tie up the application, and streaming buys nothing because no user is watching.

DA larger context window fits best, because fitting all 50,000 documents into one request avoids making repeated calls.

Scenario 4

Consider a long multi-turn agent session whose context window keeps filling. Predict the symptoms and name the budget at fault.

AThe model silently drops the oldest turns to make room, so the session continues but quietly loses early context without any error.

BThe context window is a fixed token budget; as history and tool results accumulate it fills. An input that is already oversized is rejected with an error before generation, while a request that fits on input but reaches the ceiling mid-generation comes back with truncated output and a model_context_window_exceeded stop reason. The symptom is a session that ran fine in testing failing once inputs grow, which is why the application must trim or summarize history.

CThe symptom is slower sampling, and the budget at fault is the temperature setting, which must be lowered as the session grows.

DThere is no fixed budget; the window expands automatically to hold whatever history accumulates, so a long session never fails for this reason.

Submit
Skip for now
