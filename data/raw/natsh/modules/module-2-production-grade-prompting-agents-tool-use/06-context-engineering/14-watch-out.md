# Production-Grade Prompting, Agents & Tool Use — Context Engineering — Watch Out

_Module 2, screen S14_

Watch OutContext Engineering·5 min

## The session that ran fine in development, then hit a ceiling in production

Setup

Tool outputs consume context the same way prompts and file reads do. The context window is a fixed budget that holds everything Claude needs to see on a given turn: the system prompt, the conversation history, and every tool call and tool result accumulated so far. When tool outputs are short, each turn adds a small amount to that running total and the budget lasts a long time. When tool outputs grow larger, each turn adds more to the same running total, and the budget runs down faster. The window itself has not changed; what changed is how much of it each turn now spends. A session that handles twenty turns cleanly in development can start failing at turn eight in production for exactly this reason.

### Postmortem: Context budget never measured against production tool outputs

An agent was built to process sales receipts under a 40k context window token budget, a cap the team set as a cost control on the agent's context rather than the model's ceiling. The model itself offered far more room. Current Claude API models carry at least a 200k-token context window, and the newest flagship models, Fable included, serve 1M tokens by default, so the 40k figure was a deliberate budget the team imposed, not a limit the model forced on them. Development used a test fixture set of twenty receipts, each returning a tool result of roughly 800 tokens. The full twenty-turn session consumed about 18,000 tokens, well within the team's 40k token budget limit.

In production, receipts contained supporting documentation, including transaction records, and correspondence. Average tool output grew to approximately 3,200 tokens per call. Eight turns of tool output alone added up to roughly 25,600 tokens, and once the system prompt, user messages, and assistant messages were added on top, the running total reached the team's 40k budget cap. The agent hit that cap at turn eight, before it could complete its analysis. The failure looked like degraded tool selection because the agent started choosing the wrong tools and returning incomplete analyses. However, the underlying cause was different. The system prompt and early instructions had been crowded out by accumulated tool outputs that were never pruned after use, and the agent was making decisions on a context window that no longer contained the guidance it had started with.

| | Development | Production

| Context window available | 200k standard, 1M on current Opus and Sonnet | 200k standard, 1M on current Opus and Sonnet

| Team budget cap | 40k tokens | 40k tokens

| Avg. tool output | ~800 tokens per call | ~3,200 tokens per call

| Turns before window fills | Sessions completed without reaching the cap | Cap reached at turn 8

| Observed symptom | None. Sessions complete cleanly | Wrong tool selections and incomplete outputs starting turn 8

| Root cause identified by | Not applicable | Token usage audit, two days after deployment

| Fix | Not applicable | Prune tool outputs after use, and apply compaction proactively before the cap is reached

What to Watch Out for

The development test fixtures were shorter than production data. This is true for almost every agent built against a fixture set. The fix is to measure the actual token cost of a tool result against the largest input you can find in your target data before the agent ships.

The symptom of context overflow is often misread as a tool selection failure, because the output looks similar. If you see tool selection degrade after a fixed number of turns, check whether the context window is filling before you start debugging the schema.
