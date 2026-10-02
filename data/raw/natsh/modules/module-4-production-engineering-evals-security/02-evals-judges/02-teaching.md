# Production Engineering, Evals & Security — Evals & Judges — Teaching

_Module 4, screen S02_

TeachingEvals & Judges·20 min

# Defining done before you ship: evals and a calibrated judge

Your success metric is simple: the code works correctly. The agents and tools you built in the prior modules answer correctly when you try them by hand. The gap is that "I tried it a few times and it looked right" is not a signal you can track.

The first thing production hardening needs is a way to turn that intuition into a measurable number that you can track as the prompt, the tools, or the model change. That is what an eval gives you, and the rest of this module leans on it.

## Write the design document that states what's done, safe, and affordable

Before you write any production code, write down what you are going to build and how you will know it is right. A design document is that written record. It is a short file, usually a single markdown page, that states the success criteria for the features, the failures the system must survive, the cost and latency the system must stay inside, and the trust boundary the system must defend. It is the planning step that comes before implementation, and it exists so that you define what is correct instead of rationalizing whatever the model produces later.

The reason the document comes first is that every production layer in this module is based on it. The success criteria become the cases against which your eval is graded. The failures you listed become the retriable and terminal cases your error handling must cover. The cost and latency numbers become the budget you instrument against and the floor you refuse to optimize below. The trust boundary becomes the input you treat as data and the action you gate with a hook. Writing those four decisions down once, before you build, is what keeps the layers consistent with each other instead of each one solving a different problem.

A useful design document holds four decisions, each stated concretely enough that someone could check the built system against it:

- 1Success criteria name what the feature must produce. State the output for representative cases in terms specific enough to grade, because a vague goal like "summarize the thread" cannot be checked while "a two-sentence summary that lists every action item and its owner" can. These criteria are what your eval set is built from, so writing them first is what makes the eval possible.

- 2Failure handling names the failures the system must survive and what it does for each. List the errors production will throw, mark each one retriable or terminal, and say what the user gets when a failure cannot be recovered. Deciding this on paper is what stops the first real rate-limit response from being the moment you discover you have no error path.

- 3Cost and latency budget names the ceiling the system must stay under and the reliability floor it cannot trade away. Set hard cost and latency budgets before architecture is determined. Write the per-request budget, the monthly cost ceiling, and the latency target, along with the minimum reliability the design must hold. Setting these numbers before you build is what lets you check the architecture against the budget before a line of code is written.

- 4Trust boundary names which inputs are untrusted and what the system is allowed to do. Write down which content the agent reads that someone else can write, and the smallest set of actions and access the feature needs to do its job. Naming the boundary on paper is what turns least privilege into a design decision you can enforce with a hook rather than a setting you remember to add later.

If you build an agentic coding tool, this document is also what you hand in before it writes anything. Plan the work first and capture the result as a written artifact, then implement against it. A tool given clear success criteria and explicit constraints makes fewer assumptions and produces code you can check against the document you already agreed on. The rest of this module teaches each of the four decisions in turn, and the cumulative task at the end asks you to harden a system against all four at once.

## An eval is the test set that defines what a feature must do before it ships

An eval works the way a thermometer does. It does not make the patient healthier. It just gives you a number you can trust. Before you have one, "done" is a feeling. After, it is a score on a fixed set of cases.

You collect a set of input cases. For each one you write down the behavior you expect. You run the feature on every case and grade the output against that expected behavior. The collection of cases, expectations, and grades is the eval. "Done" stops being a feeling after a few manual tries and becomes a score. You write the eval before the feature because it forces you to define success before implementation begins. Otherwise, you may find yourself rationalizing whatever output the model produces later.

The pipeline is small and requires the same framework every time: load a dataset of cases, run each case through the feature, grade each result, and average the scores. A minimal version is only a few functions. The first runs the feature on one case, the second grades that output, and the third loops over the dataset and averages.

def run_test_case(test_case):
"""Run one case through the feature, then grade the result."""
output = run_prompt(test_case)
score = grade(test_case, output) # grading covered below
return {"output": output, "test_case": test_case, "score": score}

def run_eval(dataset):
"""Run every case and report the average score."""
results = [run_test_case(c) for c in dataset]
average = sum(r["score"] for r in results) / len(results)
print(f"Average score: {average}")
return results

The score on its own is not inherently good or bad. The first attempt scoring two or three out of ten is normal. What matters is whether the number increases as you change the prompt, the tools, or the model. Change one of these at a time, so that you know which caused the improvement. The eval is the instrument that makes that change measurable instead of a matter of opinion.

## Matching the grading method to the shape of the output

The grader is the part that turns an output into a measurable signal, usually a number between one and ten. There are three ways to produce that signal, and choosing the wrong one is where eval effort gets wasted.

- 1Exact or string match works when the output has one correct form. A classifier that must return one label, or a function that must return a known value, can be checked character by character. It is the cheapest grader and the most brittle: any acceptable paraphrase of an open-ended answer fails it. It is the wrong tool anytime the output can be phrased more than one way.

- 2Code-graded checks work when a function can validate the output. Valid JSON, parseable Python, a number inside a range, a response that contains a required field: each of these is a check you can write in code that returns a pass or a fail. The output does not have to match a fixed string, only satisfy a rule. This method catches format and syntax failures a string match would miss, and a human would find tedious to check by hand.

- 3LLM-as-judge works for open-ended outputs where quality matters but cannot be evaluated through pattern matching. You give a second model the output and a rubric, and it returns a score with reasoning. This is the only method that scales questions like "is this summary faithful?" or "did this answer follow the instructions?" because no code rule captures those. It is also the most expensive and the noisiest, so using it when a code check would suffice adds cost and variance for no gain.

A code grader is often just a parse attempt. If the output parses into the required format, it scores well, while if it throws an error, it scores zero. That is enough to catch a whole class of format failures cheaply.

import json, ast

def validate_json(text):
try:
json.loads(text.strip())
return 10 # parses as JSON
except json.JSONDecodeError:
return 0 # malformed, fail the case

def validate_python(text):
try:
ast.parse(text.strip())
return 10
except SyntaxError:
return 0

Comparing how the same output scores under each method often makes the right choice clear. Imagine a feature that should return the three capital cities of a region as a JSON array. One run returns the array in a different order than your reference string. An exact match scores as zero, because the characters do not line up, even though the answer is correct. A code grader that parses the JSON and checks membership scores it well, because all three cities are present and the structure is valid.

Now imagine the feature should return a one-paragraph rationale for a recommendation. The code grader can confirm it is a non-empty string, which is nearly worthless here, and the exact match is hopeless, because no two good rationales are worded the same. Only a judge can say whether the rationale is faithful and complete. The method follows from the output structure: one correct form takes a match, a structural rule takes a code check, and open-ended quality takes a judge. There is also a cost dimension that the table understates. An exact match and a code check run locally and effectively cost nothing per case, so you can run thousands of them on every change.

A judge is a second model call per case, so a thousand-case eval graded by a judge is a thousand extra API calls every time you run it. That is reasonable for a periodic full evaluation but wasteful as a tight inner loop. Many teams grade format and structure with code on every commit and reserve the judge for a slower, scheduled quality pass. Matching the grader to the task is partially about signal and partially about how often you can afford to run it.

## The grader-selection table you can keep open while you build

Of the three methods listed below, the judge is the only one you must build and tune, so it gets its own treatment here.

| Task type | Grading method | What it catches | Where it is unreliable

| Single correct label or value | Exact or string match | A wrong answer when there is exactly one correct answer, with zero ambiguity and near-zero cost. | Fails every valid paraphrase or reordering, so it is wrong for anything open-ended.

| Structured or code output | Code-graded check | Invalid JSON, unparseable code, out-of-range numbers, and missing required fields. | Says nothing about whether the content is good, only that it is well-formed.

| Open-ended quality | LLM-as-judge | Faithfulness, instruction following, completeness, and tone that no code rule expresses. | Noisy and costly and produces a confident-looking number that means nothing until it is calibrated.

## Building and calibrating the judge so its scores are defensible

A judge is a second model call guided by a clear rubric. What makes it usable is asking it to provide strengths, weaknesses, and reasoning alongside the score, rather than returning the score alone. Without that, models drift toward a safe middle number, usually around six, regardless of the output's actual quality. Asking the judge for reasoning first is what anchors the score to something specific.

def grade_by_model(task, solution):
eval_prompt = f"""
You are an expert reviewer. Evaluate the solution for the task.
Task: {task}
Solution: {solution}
Return JSON with:
"strengths": array of 1-3 points
"weaknesses": array of 1-3 points
"reasoning": a one to two sentence explanation, 50 words maximum
"score": a number from 1 to 10
"""
messages = [{"role": "user", "content": eval_prompt}]
result = chat(messages) # returns the JSON above
return json.loads(result)

Most people skip calibration, which is what makes the judge untrustworthy until they do it. Start with a set of cases a human has already labeled, run the judge on the same cases, and measure how often the judge agrees with the human. A judge that disagrees with human labels half the time produces a number that looks rigorous but provides no value. Measuring agreement before relying on the scores is what turns the judge from a guess into evidence you can defend. If agreement is low, you fix the rubric: tighten what each score means, add an example of a good and a bad answer, and re-measure.

## Coverage matters more than perfection

A larger evaluation set with slightly noisier automated grading usually reveals more than a small set of hand-graded cases. The point of an eval is to provide enough coverage to catch a regression, not to create the perfect rubric. Twenty cases that include irregular and edge inputs will catch a break that three carefully chosen cases never exercise. When you need more cases, you can have Claude generate additional ones from a small, labeled starting set. You can then spot-check the generated cases so the set stays honest. Coverage is the thing that catches edge cases, and coverage comes from volume.

Put the three pieces together and the workflow is a loop: set a goal, write an initial prompt, run the eval, read where it failed, apply one prompt-engineering change, and run the eval again. You repeat the last two steps until the score holds where you need it. The eval is what tells you a change helped instead of just feeling different.

The strategy that makes the loop work is changing one component at a time. If you rewrite the prompt, add two examples, and switch the model all in one pass, and the score moves, you have learned nothing about which change caused it. Move one lever, re-run, read the per-case results, and keep the change only if the score goes up. This approach is slower for a single iteration, but far faster than the life of the feature, because it teaches you what drives the score. The per-case breakdown matters as much as the average. A steady average can hide a change that fixed three cases and broke three others. The per-case view shows that immediately, while the average conceals it.

A low score is information to act on. When a case fails, the important question is not whether it failed, but why. A formatting failure points at the prompt's output instructions. A factual failure on retrieved content points at the retrieval step. A failure that only appears on long input points at context handling. The eval tells you a case failed, and the per-case output tells you the category, which is what turns the next iteration into a targeted fix rather than a guess.

Handles well
Turns "looks right" into a tracked score you can defend and move one deliberate change at a time.

Adds cost or complexity
Authoring cases and calibrating a judge is real up-front work before any feature ships.

Use a different approach
For a single fixed-format output, a code check alone is enough. Skip the judge entirely.
