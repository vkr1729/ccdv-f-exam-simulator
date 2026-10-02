# Production Engineering, Evals & Security — Evals & Judges — Watch Out

_Module 4, screen S03_

Watch Out
Evals & Judges
7 min

## The demo that passed and the edge case that did not

Setup

You watched the agent answer correctly a dozen times, so you concluded it was done. The problem was that dozen attempts all used inputs that looked like the ones you had in mind when you built it.

## Postmortem: the feature passed every check it had, and still extracted the wrong value

A team shipped a feature that extracted structured fields from customer messages. Before launch, they ran it through roughly a dozen example messages, read the outputs, agreed they looked right, and moved into deployment. The feature had input validation in place: it confirmed each message was non-empty text, checked that a date field came back populated, and rejected extractions that returned a malformed or impossible date. For two weeks it appeared to work as expected.

Then a customer sent a message that put two dates in one sentence: "I placed my order on March 3 but did not receive it until April 12." The feature extracted April 12 as the order date. Every validation check passed, because both dates are well-formed and the field came back populated. Validation confirms that a value is the right shape. It cannot confirm the value is the right one. Downstream logic acted on the wrong date and a batch of records was updated incorrectly.

The review found no bug in the model or in the prompt. The feature had never been measured against a message containing two dates, because nobody had defined the expected behavior for that case as a graded example. The dozen manual checks all used single-date messages, which is the input the builder pictured. There was no holdout set, so there was no signal that the two-date input existed in the population.

The missing graded set was the root cause. Some behavior change, most likely a prompt change naming which date to extract, corrected the output. The eval did not fix the extraction; it detected the failure, documented the expected behavior as a checkable case, and guarded against the same regression on every future change. The two-date message became case one in that set.

One way to find inputs like this before a customer does: ask the model to enumerate edge cases that could break the current implementation. Two dates in one sentence, no date at all, a relative date like "next Tuesday." Turn the plausible ones into graded cases with a human-checked expected output. This is the same case-generation move the eval-building section covers, applied before launch rather than after.

Why this broke

Success was judged by impression instead of a graded set. The eval is what surfaces failures and guards against regression. The prompt is what changes the output. Write the expected behavior down as graded cases before you ship, and use the model to help you find the edge inputs you did not think to test.
