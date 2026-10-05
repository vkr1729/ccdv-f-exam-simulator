#!/usr/bin/env python3
"""
scripts/validate_hard_exams.py

Validates the structure, schema, domain balance, distractor completeness,
and cross-exam collision safety for high-difficulty CCDV-F practice exams (Exam 11 and Exam 12).

Usage:
    python3 scripts/validate_hard_exams.py
    python3 scripts/validate_hard_exams.py --exam-ids 11 12
    python3 scripts/validate_hard_exams.py --dry-run
"""

import sys
import os
import glob
import json
import re
import argparse

EXPECTED_DOMAINS = {
    "D1": ("Applications & Integration", 18),
    "D2": ("Model Selection & Optimization", 9),
    "D3": ("Agents & Workflows", 8),
    "D4": ("Prompt & Context Engineering", 6),
    "D5": ("Tools & MCPs", 6),
    "D6": ("Security & Safety", 4),
    "D7": ("Claude Code", 1),
    "D8": ("Eval, Testing & Debugging", 1),
}
EXPECTED_TOTAL_QUESTIONS = 53
DOMAIN_ORDER = ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"]

GLOBAL_ID_RANGES = {
    11: (531, 583),
    12: (584, 636),
    13: (637, 689),
    14: (690, 742),
    15: (743, 795),
    16: (796, 848),
    17: (849, 901),
    18: (902, 954),
    19: (955, 1007),
    20: (1008, 1060)
}

def load_existing_prompts(exams_dir, exclude_exam_ids):
    """Load normalized prompts from existing base exams to prevent duplication."""
    existing = {}
    for p in sorted(glob.glob(os.path.join(exams_dir, "exam_[0-9][0-9].json"))):
        try:
            with open(p, "r", encoding="utf-8") as f:
                d = json.load(f)
            eid = d.get("exam_id")
            if eid in exclude_exam_ids:
                continue
            for q in d.get("questions", []):
                norm = re.sub(r'[^a-z0-9]', '', q.get("prompt", "").lower())[:80]
                if norm:
                    existing[norm] = f"Exam {eid} Q{q.get('exam_question_num')}"
        except Exception:
            pass
    return existing

def validate_exam_file(filepath, expected_exam_id=None, existing_prompts=None, is_dry_run=False):
    errors = []
    warnings = []

    if not os.path.exists(filepath):
        return [f"File not found: {filepath}"], []

    try:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        return [f"JSON syntax error in {filepath}: {e}"], []

    # Check top-level metadata
    exam_id = data.get("exam_id")
    if expected_exam_id is not None and exam_id != expected_exam_id:
        errors.append(f"Expected exam_id={expected_exam_id}, but got {exam_id}")

    req_keys = [
        "exam_id", "title", "description", "time_limit_minutes",
        "passing_score_percentage", "scaled_pass_score", "scaled_max_score",
        "question_count", "domains", "questions"
    ]
    for req_key in req_keys:
        if req_key not in data:
            errors.append(f"Missing required top-level key '{req_key}'")

    if data.get("time_limit_minutes") != 120:
        errors.append(f"Expected time_limit_minutes=120, got {data.get('time_limit_minutes')}")
    if data.get("scaled_pass_score") != 720:
        errors.append(f"Expected scaled_pass_score=720, got {data.get('scaled_pass_score')}")
    if data.get("scaled_max_score") != 1000:
        errors.append(f"Expected scaled_max_score=1000, got {data.get('scaled_max_score')}")
    if data.get("question_count") != EXPECTED_TOTAL_QUESTIONS:
        errors.append(f"Expected question_count=53, got {data.get('question_count')}")

    # Validate domains metadata array
    domains_meta = data.get("domains", [])
    if not isinstance(domains_meta, list) or len(domains_meta) != len(EXPECTED_DOMAINS):
        errors.append(f"'domains' top-level list must contain exactly {len(EXPECTED_DOMAINS)} domain objects")
    else:
        for d_obj in domains_meta:
            did = d_obj.get("id")
            if did in EXPECTED_DOMAINS:
                exp_name, exp_cnt = EXPECTED_DOMAINS[did]
                if d_obj.get("count") != exp_cnt:
                    errors.append(f"domains metadata count for {did} is {d_obj.get('count')}, expected {exp_cnt}")

    questions = data.get("questions", [])
    if len(questions) != EXPECTED_TOTAL_QUESTIONS:
        errors.append(f"Exam contains {len(questions)} questions, expected exactly {EXPECTED_TOTAL_QUESTIONS}")

    # Domain counters and state
    domain_counts = {d: 0 for d in EXPECTED_DOMAINS}
    domain_question_types = {d: {"single": 0, "multiple": 0} for d in EXPECTED_DOMAINS}
    question_types = {"single": 0, "multiple": 0}
    seen_ids = set()
    seen_global_ids = set()
    seen_prompts = set()
    current_domain_idx = 0

    for idx, q in enumerate(questions, 1):
        q_label = f"Q{idx} (id={q.get('id', 'MISSING')})"

        # ID checks
        qid = q.get("id")
        if not qid:
            errors.append(f"{q_label}: missing 'id'")
        elif qid in seen_ids:
            errors.append(f"{q_label}: duplicate id '{qid}'")
        else:
            seen_ids.add(qid)

        if expected_exam_id and not is_dry_run:
            exp_id_pattern = f"CCDV-E{expected_exam_id:02d}-Q{idx:02d}"
            if qid != exp_id_pattern:
                errors.append(f"{q_label}: id '{qid}' does not match expected pattern '{exp_id_pattern}'")

            # exam_question_num check
            if q.get("exam_question_num") != idx:
                errors.append(f"{q_label}: exam_question_num is {q.get('exam_question_num')}, expected {idx}")

            # global_id range check
            gid = q.get("global_id", "")
            m = re.match(r"^CCDV-Q(\d{4})$", gid)
            if not m:
                errors.append(f"{q_label}: global_id '{gid}' must match format 'CCDV-Qxxxx'")
            else:
                gnum = int(m.group(1))
                if gid in seen_global_ids:
                    errors.append(f"{q_label}: duplicate global_id '{gid}'")
                seen_global_ids.add(gid)

                if expected_exam_id in GLOBAL_ID_RANGES:
                    low, high = GLOBAL_ID_RANGES[expected_exam_id]
                    if not (low <= gnum <= high):
                        errors.append(f"{q_label}: global_id {gid} out of assigned range Q{low:04d}–Q{high:04d}")

        # Prompt
        prompt = q.get("prompt", "")
        if not prompt or len(prompt.strip()) < 40:
            errors.append(f"{q_label}: prompt too short or missing (<40 chars)")
        p_norm = re.sub(r'[^a-z0-9]', '', prompt.lower())[:80]
        if p_norm in seen_prompts:
            errors.append(f"{q_label}: duplicate prompt detected within exam")
        seen_prompts.add(p_norm)

        # Cross-exam prompt check
        if existing_prompts and p_norm in existing_prompts:
            errors.append(f"{q_label}: prompt duplicates earlier question in {existing_prompts[p_norm]}")

        # Domain
        d_id = q.get("domain_id")
        if d_id not in EXPECTED_DOMAINS:
            errors.append(f"{q_label}: invalid domain_id '{d_id}'")
        else:
            domain_counts[d_id] += 1
            # Check domain ordering (D1 -> D2 -> ... -> D8)
            expected_cur_domain = DOMAIN_ORDER[current_domain_idx]
            if d_id != expected_cur_domain:
                if d_id in DOMAIN_ORDER[current_domain_idx:]:
                    current_domain_idx = DOMAIN_ORDER.index(d_id)
                else:
                    errors.append(f"{q_label}: domain out of sequence (found {d_id} after {expected_cur_domain})")

        # Type & Correct Answers
        qtype = q.get("type", "single")
        if qtype not in ["single", "multiple"]:
            errors.append(f"{q_label}: invalid type '{qtype}'")
        else:
            question_types[qtype] = question_types.get(qtype, 0) + 1
            if d_id in domain_question_types:
                domain_question_types[d_id][qtype] += 1

        correct = q.get("correct_answers", [])
        if not isinstance(correct, list) or len(correct) == 0:
            errors.append(f"{q_label}: 'correct_answers' must be a non-empty list")
        elif qtype == "single" and len(correct) != 1:
            errors.append(f"{q_label}: type is 'single' but has {len(correct)} correct answers (expected 1)")
        elif qtype == "multiple" and len(correct) != 2:
            errors.append(f"{q_label}: type is 'multiple' but has {len(correct)} correct answers (expected 2)")

        # Options
        options = q.get("options", [])
        if not isinstance(options, list) or len(options) < 4:
            errors.append(f"{q_label}: 'options' must be a list with at least 4 items")
        else:
            opt_keys = []
            for opt in options:
                k = opt.get("key")
                t = opt.get("text", "")
                if k in opt_keys:
                    errors.append(f"{q_label}: duplicate option key '{k}'")
                opt_keys.append(k)
                if not t or len(t.strip()) < 10:
                    errors.append(f"{q_label}: option '{k}' text is empty or too brief (<10 chars)")
            for c in correct:
                if c not in opt_keys:
                    errors.append(f"{q_label}: correct answer '{c}' is not among option keys {opt_keys}")

        # Explanation
        explanation = q.get("explanation", "")
        if not explanation or len(explanation.strip()) < 25:
            errors.append(f"{q_label}: 'explanation' is missing or too brief (<25 chars)")

        # P0-1: Distractor Explanations Enforcement (mandatory for hard-tier exams)
        if not is_dry_run:
            distractors = q.get("distractor_explanations")
            if not isinstance(distractors, dict):
                errors.append(f"{q_label}: 'distractor_explanations' must be an object/dict")
            else:
                incorrect_keys = set(opt_keys) - set(correct)
                missing_keys = incorrect_keys - set(distractors.keys())
                if missing_keys:
                    errors.append(f"{q_label}: 'distractor_explanations' missing entries for wrong keys: {sorted(missing_keys)}")
                for dk, dv in distractors.items():
                    if dk not in opt_keys:
                        errors.append(f"{q_label}: distractor key '{dk}' is not a valid option key")
                    elif not isinstance(dv, str) or len(dv.strip()) < 15:
                        errors.append(f"{q_label}: distractor rationale for '{dk}' is too brief (<15 chars)")

    # Domain balance check
    for d_id, (d_name, expected_count) in EXPECTED_DOMAINS.items():
        actual_count = domain_counts.get(d_id, 0)
        if actual_count != expected_count:
            errors.append(f"Domain {d_id} ({d_name}) has {actual_count} questions, expected exactly {expected_count}")

    # Multiple-choice check (expected ~8–10 'Select TWO')
    num_multiple = question_types.get("multiple", 0)
    if not is_dry_run:
        if not (8 <= num_multiple <= 10):
            warnings.append(f"Exam has {num_multiple} 'Select TWO' questions; target is exactly 8–10 (typically 9)")

    return errors, warnings

def main():
    parser = argparse.ArgumentParser(description="Validate CCDV-F Hard Practice Exams")
    parser.add_argument("--exam-ids", nargs="+", type=int, default=[11, 12], help="Exam IDs to validate (default: 11 12)")
    parser.add_argument("--dry-run", action="store_true", help="Validate existing exam_01.json as a sanity check")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    exams_dir = os.path.join(base_dir, "data", "exams")

    if args.dry_run:
        target_files = [(1, os.path.join(exams_dir, "exam_01.json"))]
        existing_prompts = {}
        print("Running DRY-RUN validation against data/exams/exam_01.json...\n")
    else:
        target_files = [(eid, os.path.join(exams_dir, f"exam_{eid:02d}.json")) for eid in args.exam_ids]
        existing_prompts = load_existing_prompts(exams_dir, exclude_exam_ids=args.exam_ids)
        print(f"Loaded {len(existing_prompts)} existing prompts from base exams for collision prevention.\n")

    all_passed = True
    for eid, path in target_files:
        print(f"==================================================")
        print(f"Validating Exam #{eid}: {os.path.basename(path)}")
        print(f"Path: {path}")
        print(f"==================================================")
        errors, warnings = validate_exam_file(path, expected_exam_id=eid, existing_prompts=existing_prompts, is_dry_run=args.dry_run)

        if warnings:
            print(f"\n[WARNINGS] ({len(warnings)}):")
            for w in warnings:
                print(f"  • {w}")

        if errors:
            print(f"\n[FAILED] Found {len(errors)} error(s):")
            for e in errors:
                print(f"  ✖ {e}")
            all_passed = False
        else:
            print(f"\n✔ PASSED: Exam #{eid} satisfies all 53-question blueprint, domain, distractor, and schema criteria.")
        print()

    if not all_passed:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    main()
