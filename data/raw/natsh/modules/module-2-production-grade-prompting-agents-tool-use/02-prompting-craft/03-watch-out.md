# Production-Grade Prompting, Agents & Tool Use — Prompting Craft — Watch Out

_Module 2, screen S03_

Watch OutPrompting Craft·5 min

## The prompt that grew longer instead of better

Setup

Even though a prompt looks ready for production, it can still produce quiet failures. Sometimes edge cases cause fields to go missing or constraints to be ignored; when this happens, it’s often because constraints weren’t specified precisely enough.

### Six revision passes, each one longer than the last

The prompt that we used in the previous example is given below: a developer needs Claude to classify support tickets into three categories: Billing, technical, and escalation. The first prompt is a bare instruction:

System: "You are a support classifier. Classify the ticket."
User: <ticket>I was charged twice for the same month.</ticket>

The trace below shows a developer iterating on a classification prompt, and although each pass adds more words, the output keeps drifting. This pattern emerges when a developer adds to their prompt without regard to constraint specifications.

| Pass | What was added | Output behavior

| 1 | "Classify this ticket as billing, technical, or escalation." | Returns full sentences: "This appears to be a billing issue." Parser breaks.

| 2 | Added "Be concise." and "Use only the category name." | Returns "Billing" capitalized sometimes, "billing" lowercase other times. Router breaks on case mismatch.

| 3 | Added three paragraphs describing each category in detail. | Output correct on simple tickets. For ambiguous tickets, returns 'billing/technical' instead of a single label. Parser breaks on the slash.

| 4 | Added "Never return two categories." and "If ambiguous, choose the most likely one." | Works on 80% of tickets. Fails on tickets that could reasonably fit two categories (e.g., 'I was charged but the feature also stopped working'). Here it returns a full explanation instead of a label.

| 5 | Added two more paragraphs about edge cases and a reminder to be precise. | The verbose prompt is now producing verbose output, over 2,000 characters per call, as long, unfocused prompts tend to produce long, unfocused outputs. The model calibrates response length and style to match the input. Latency has increased significantly due to output length, but accuracy has not improved.

| 6 | Replaced all instructions with a JSON schema and two few-shot examples showing exact input/output pairs | Returns {"category": "billing"} on every ticket. Parser works. Latency drops. Accuracy on ambiguous tickets matches Pass 4.

Two things went wrong across these six passes and they are worth identifying separately. Pass 4 is the diagnostic failure: the developer identified the wrong problem, added description instead of a constraint, and the output stayed broken. Pass 5 is the engineering failure: the prompt became verbose enough to induce a latency regression, and the model calibrates response length to match the input, generating over 2,000 characters per call, with no accuracy gain. The fix for both is the same structural move: an output constraint and two few-shot examples but recognizing that these are two different failures matters because the second one can appear even when the first one has been resolved. Here is the prompt with the output constraint and few-shot examples applied:

System: "You are a support classifier. Classify each ticket into exactly one of: BILLING, TECHNICAL, ESCALATION. Return only the label. No other text."

<sample_input>My account shows two charges for April.</sample_input>
<ideal_output>BILLING</ideal_output>

<sample_input>The API keeps returning a 429 error.</sample_input>
<ideal_output>TECHNICAL</ideal_output>

User: <ticket>I was charged twice for the same month.</ticket>

What to Watch Out for

Every pass made the prompt longer and none of them added the missing output constraint. The developer was describing the problem more precisely with each iteration, but Claude does not need a detailed description of what a billing ticket looks like, instead it needs to know that the only acceptable response is one word in all capital letters.

The fix is two lines: an output constraint specifying the exact format and a few-shot example covering the ambiguous case. The six-pass trace is a pattern to recognize early: if three re-prompts in a row have not worked, stop adding text and diagnose which technique is missing.
