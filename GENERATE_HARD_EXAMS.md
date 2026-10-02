# Task: Generate High-Difficulty CCDV-F Practice Exams 11 & 12

> **INSTRUCTION FOR CLAUDE CODE DESKTOP:**
> You are acting as an expert Anthropic Certification Item Writer and Senior AI Systems Architect.
> Your task is to generate **two brand-new, full-length, high-difficulty 53-question practice exams**:
> 1. `data/exams/exam_11.json`
> 2. `data/exams/exam_12.json`
>
> ⚠️ **CRITICAL REPOSITORY RULES:**
> - **DO NOT COMMIT OR PUSH TO GIT.** Leave the generated files locally on disk. The user will manually transfer them to their primary build environment.
> - **DO NOT DISTURB EXISTING EXAMS.** Do not modify `data/exams/exam_01.json` through `exam_10.json`.
> - **STRICT SCHEMA & DOMAIN ADHERENCE:** You must run `python3 scripts/validate_hard_exams.py --exam-ids 11 12` before concluding and resolve any validation failures.

---

## 1. Background & Context Materials

All relevant official Anthropic course and reference materials are stored locally in this repository. Read and ground your questions in these files:

1. **Official Skilljar Course Modules (Extracted Offline):**
   - `data/raw/natsh/modules/module-1-mso-foundations/` (Model selection, sampling, pricing, token windows, latency/cost tradeoffs)
   - `data/raw/natsh/modules/module-2-production-grade-prompting-agents-tool-use/` (Messages API, streaming SSE, prompt caching, tool-use loop, agent patterns, Agent SDK, managed agents)
   - `data/raw/natsh/modules/module-3-claude-code-mcp-integration/` (MCP servers/transports, stdio vs SSE, Claude Code architecture, CLAUDE.md hierarchy, settings scopes, subagents, skills, hooks)
   - `data/raw/natsh/modules/module-4-production-engineering-evals-security/` (Security, prompt injection, jailbreaks, PII, deterministic guardrails, evals, assertions, retries, error taxonomy)
   - `data/raw/natsh/modules/module-5-accelerators-ip-contribution/` (Batch API, cookbook patterns, cloud platforms: Bedrock/Vertex differences, licensing)
2. **Hard Reference Questions & Traps:**
   - `data/raw/natsh/hard-prep-exam.md`
   - `data/raw/natsh/practice-exam-quiz.md`
3. **Reference Exam Format:**
   - `data/exams/exam_01.json`

---

## 2. The "Hard Distractor" Rubric (The Anti-Elimination Standard)

Candidates report that on standard practice exams, 2 out of 4 options are often trivial "strawmen" that can be dismissed in seconds. **In Exams 11 and 12, every question must be genuinely difficult, with all 4 options sounding plausible to an engineer who understands 80% of the Claude API.**

### Rules for Distractor Authoring:
1. **Zero Strawman Options**: No obviously absurd parameters, comical code, or impossible HTTP status codes. Every option must read like something a real developer might write or believe.
2. **Plausible Near-Miss Misconceptions**:
   - **Parameter Traps**: Confusing `thinking: {"type": "enabled", "budget_tokens": 2048}` with `max_tokens`; confusing Claude's `tool_choice: {"type": "tool", "name": "..."}` with OpenAI's `function_call`; confusing `client.messages.count_tokens` with external tokenizers.
   - **Mechanics & Boundaries**: Believing prompt caching matches token-for-token dynamically instead of requiring an exact identical prefix; misunderstanding the 5-minute TTL refresh on cache read; confusing cache minimums (1024 tokens for Sonnet/Opus, 2048 for Haiku).
   - **Streaming Event Order**: Confusing SSE event sequence (`message_start` &rarr; `content_block_start` &rarr; `content_block_delta` [input_json_delta] &rarr; `content_block_stop` &rarr; `message_delta` &rarr; `message_stop`). Believing tool input is parseable JSON before `content_block_stop`.
   - **Architectural Anti-Patterns**: Believing an open-ended autonomous agent is superior to a deterministic coded workflow when steps and branches are fixed and known in advance; believing adding more text to the system prompt will guarantee safety against prompt injection instead of using deterministic validation/hooks.
   - **Precedence & Scopes**: Confusing project-level `CLAUDE.md`, user-level `~/.claude/CLAUDE.md`, enterprise managed policy, and `.claude/settings.local.json`.
   - **Batch API Mechanics**: Thinking batch results maintain submission order (they are unordered and require `custom_id` mapping); thinking batch requests can share state or be chained synchronously.
   - **Platform Differences**: Confusing Anthropic direct API with Bedrock/Vertex constraints (e.g. prompt caching availability, model ID naming, authentication headers).
3. **Distractor Rationales**:
   In addition to `explanation`, provide `distractor_explanations` mapping each incorrect option key (`A`, `B`, etc.) to a clear 1–2 sentence explanation of *why* it fails and what misconception it tests.

---

## 3. Exam Blueprint & Structure (Exactly 53 Questions Each)

Each exam file must contain exactly 53 questions in order of domain:

| Range | Domain ID | Domain Name | Count | Target Question Mix |
|---|---|---|---|---|
| Q1 – Q18 | `D1` | Applications & Integration | 18 | 15 Single, 3 Multiple ("Select TWO") |
| Q19 – Q27 | `D2` | Model Selection & Optimization | 9 | 7 Single, 2 Multiple ("Select TWO") |
| Q28 – Q35 | `D3` | Agents & Workflows | 8 | 6 Single, 2 Multiple ("Select TWO") |
| Q36 – Q41 | `D4` | Prompt & Context Engineering | 6 | 5 Single, 1 Multiple ("Select TWO") |
| Q42 – Q47 | `D5` | Tools & MCPs | 6 | 5 Single, 1 Multiple ("Select TWO") |
| Q48 – Q51 | `D6` | Security & Safety | 4 | 4 Single |
| Q52 | `D7` | Claude Code | 1 | 1 Single |
| Q53 | `D8` | Eval, Testing & Debugging | 1 | 1 Single |
| **Total** | | | **53** | **44 Single, 9 Multiple** |

### ID & Numbering Conventions:
- **Exam 11**:
  - `exam_id`: `11`
  - `title`: `"CCDV-F Mock Exam #11 (Hard Tier)"`
  - Question `id`: `"CCDV-E11-Q01"` to `"CCDV-E11-Q53"`
  - `global_id`: `"CCDV-Q0531"` to `"CCDV-Q0583"`
  - `source_file`: `"hard-tier-exam-11.json"`
- **Exam 12**:
  - `exam_id`: `12`
  - `title`: `"CCDV-F Mock Exam #12 (Hard Tier)"`
  - Question `id`: `"CCDV-E12-Q01"` to `"CCDV-E12-Q53"`
  - `global_id`: `"CCDV-Q0584"` to `"CCDV-Q0636"`
  - `source_file`: `"hard-tier-exam-12.json"`

---

## 4. Exact JSON Schema

Each exam file must match this JSON structure:

```json
{
  "exam_id": 11,
  "title": "CCDV-F Mock Exam #11 (Hard Tier)",
  "description": "Full-length 53-question high-difficulty simulation for Claude Certified Developer - Foundations (120 minutes). Elevated distractor plausibility and edge-case testing.",
  "time_limit_minutes": 120,
  "passing_score_percentage": 72,
  "scaled_pass_score": 720,
  "scaled_max_score": 1000,
  "question_count": 53,
  "domains": [
    { "id": "D1", "name": "Applications & Integration", "count": 18, "weight": 33.1 },
    { "id": "D2", "name": "Model Selection & Optimization", "count": 9, "weight": 16.8 },
    { "id": "D3", "name": "Agents & Workflows", "count": 8, "weight": 14.7 },
    { "id": "D4", "name": "Prompt & Context Engineering", "count": 6, "weight": 11.0 },
    { "id": "D5", "name": "Tools & MCPs", "count": 6, "weight": 10.6 },
    { "id": "D6", "name": "Security & Safety", "count": 4, "weight": 8.1 },
    { "id": "D7", "name": "Claude Code", "count": 1, "weight": 3.1 },
    { "id": "D8", "name": "Eval, Testing & Debugging", "count": 1, "weight": 2.6 }
  ],
  "questions": [
    {
      "source_repo": "Anthropic Partner Academy / CCDV-F Official Prep (Hard Tier)",
      "source_file": "hard-tier-exam-11.json",
      "source_id": 1,
      "prompt": "A payment processing gateway receives streaming SSE responses from the Claude Messages API using tool use for transaction validation. During high load, the client backend receives a `content_block_start` event with `type: 'tool_use'` followed by several `content_block_delta` chunks with `input_json_delta`. When should the application dispatch the transaction to the database for authorization?",
      "type": "single",
      "options": [
        {
          "key": "A",
          "text": "Immediately after the `content_block_start` event fires, using the tool name and initial parameters to reserve database locks early."
        },
        {
          "key": "B",
          "text": "As soon as the accumulated string in `input_json_delta` ends with a closing brace `}`, since that indicates the JSON payload is complete."
        },
        {
          "key": "C",
          "text": "Only upon receiving the `content_block_stop` event for that block, because tool input arrives in partial non-validated fragments and is only guaranteed valid JSON once the block closes."
        },
        {
          "key": "D",
          "text": "After the `message_delta` event signals `stop_reason: 'end_turn'`, because Claude cannot trigger multiple tool uses within the same turn."
        }
      ],
      "correct_answers": ["C"],
      "explanation": "In streaming tool use, input JSON arrives in partial string deltas across multiple content_block_delta events. The payload is not guaranteed to be syntactically valid JSON until the content_block_stop event terminates the block. Closing braces can appear within nested JSON values or strings prior to block termination, making option B unsafe. Option A risks executing empty or partial inputs, and option D is incorrect because Claude emits stop_reason: 'tool_use', not 'end_turn', and can emit parallel tool uses before the message terminates.",
      "distractor_explanations": {
        "A": "content_block_start only provides tool metadata (id and name); input is empty at this stage.",
        "B": "A trailing brace may be inside a nested string or object; only content_block_stop guarantees the stream for that block has closed.",
        "D": "The stop_reason when a tool is called is 'tool_use' (or 'max_tokens' if truncated), not 'end_turn', and execution must not wait for message_stop if multiple blocks stream sequentially."
      },
      "domain_id": "D1",
      "domain_name": "Applications & Integration",
      "topic": "Streaming & Messages API",
      "id": "CCDV-E11-Q01",
      "exam_id": 11,
      "exam_question_num": 1,
      "global_id": "CCDV-Q0531"
    }
  ]
}
```

---

## 5. Execution Workflow for Claude Code Desktop

1. **Review Reference Files:**
   Inspect the modules in `data/raw/natsh/modules/` and `data/raw/natsh/hard-prep-exam.md` to collect specific nuances and edge cases.
2. **Draft Exam 11 (`data/exams/exam_11.json`):**
   - Write all 53 questions following the exact blueprint domain ordering.
   - Include exactly 9 'Select TWO' questions per the blueprint table (D1: 3, D2: 2, D3: 2, D4: 1, D5: 1).
   - Ensure every question includes `explanation` and `distractor_explanations`.
3. **Draft Exam 12 (`data/exams/exam_12.json`):**
   - Write all 53 questions ensuring no prompt duplication with Exam 11 or earlier exams.
   - Maintain the identical domain order and distractor standards.
4. **Run Validation Script:**
   Execute:
   ```bash
   python3 scripts/validate_hard_exams.py --exam-ids 11 12
   ```
   Fix any reported schema, count, or formatting errors until output reports `✔ PASSED` for both exams.
5. **DO NOT COMMIT TO GIT:**
   Leave the created files in `data/exams/`. Report completion to the user.
