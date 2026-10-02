#!/usr/bin/env python3
"""
scripts/bundle_client_data.py

Compiles all available exam forms in data/exams/ (supporting 10 or 12 exams)
into data/all_questions.json and js/exam-data.js, and updates UI count badges.

Usage:
    python3 scripts/bundle_client_data.py
"""

import sys
import os
import glob
import json
import re
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMS_DIR = os.path.join(BASE_DIR, "data", "exams")
DATA_DIR = os.path.join(BASE_DIR, "data")
JS_DIR = os.path.join(BASE_DIR, "js")
INDEX_PATH = os.path.join(BASE_DIR, "index.html")

EXPECTED_BLUEPRINT = {
    "D1": 18, "D2": 9, "D3": 8, "D4": 6, "D5": 6, "D6": 4, "D7": 1, "D8": 1
}

def bundle():
    # P2-1: Match only standard two-digit exam filenames, ignoring stray drafts
    exam_files = sorted(glob.glob(os.path.join(EXAMS_DIR, "exam_[0-9][0-9].json")))
    if not exam_files:
        print(f"Error: No valid exam files found matching 'exam_[0-9][0-9].json' in {EXAMS_DIR}", file=sys.stderr)
        return False

    print(f"Found {len(exam_files)} exam files in {EXAMS_DIR}")

    all_exams = []
    all_questions = []
    seen_ids = set()
    seen_prompts = set()

    for path in exam_files:
        try:
            with open(path, "r", encoding="utf-8") as f:
                exam_data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error: Corrupted JSON in {path}: {e}", file=sys.stderr)
            return False

        eid = exam_data.get("exam_id")
        questions = exam_data.get("questions", [])

        # P1-4: Basic sanity checks before bundling
        if len(questions) != 53:
            print(f"Error in {os.path.basename(path)}: Expected 53 questions, got {len(questions)}", file=sys.stderr)
            return False

        # Verify blueprint counts
        domain_counts = Counter(q.get("domain_id") for q in questions)
        for d_code, exp_c in EXPECTED_BLUEPRINT.items():
            if domain_counts.get(d_code, 0) != exp_c:
                print(f"Error in {os.path.basename(path)}: Domain {d_code} has {domain_counts.get(d_code, 0)} questions, expected {exp_c}", file=sys.stderr)
                return False

        # Check intra-exam and cross-exam ID/prompt collisions
        for q in questions:
            qid = q.get("id")
            if not qid or qid in seen_ids:
                print(f"Error: Duplicate or missing question ID '{qid}' in {os.path.basename(path)}", file=sys.stderr)
                return False
            seen_ids.add(qid)

            p_norm = re.sub(r'[^a-z0-9]', '', q.get("prompt", "").lower())[:80]
            if p_norm in seen_prompts:
                print(f"Error: Duplicate prompt detected: '{q.get('prompt')[:60]}...' in {os.path.basename(path)}", file=sys.stderr)
                return False
            seen_prompts.add(p_norm)

        all_exams.append(exam_data)
        all_questions.extend(questions)
        print(f"  • Validated & Loaded Exam #{eid}: '{exam_data.get('title')}' (53 questions)")

    # Load or generate sources metadata
    sources_meta_path = os.path.join(DATA_DIR, "sources_metadata.json")
    if os.path.exists(sources_meta_path):
        with open(sources_meta_path, "r", encoding="utf-8") as f:
            sources_meta = json.load(f)
    else:
        sources_meta = {}

    # Write data/all_questions.json
    all_q_path = os.path.join(DATA_DIR, "all_questions.json")
    with open(all_q_path, "w", encoding="utf-8") as f:
        json.dump(all_questions, f, indent=2, ensure_ascii=False)
    print(f"\n✔ Written {len(all_questions)} questions to {all_q_path}")

    # Write js/exam-data.js
    bundle_js_path = os.path.join(JS_DIR, "exam-data.js")
    bundle_content = f"""/**
 * Auto-generated CCDV-F Exam Data Bundle
 * Bundles {len(all_exams)} exams ({len(all_questions)} total questions).
 */
window.EXAM_DATA = {{
  exams: {json.dumps(all_exams, ensure_ascii=False)},
  all_questions: {json.dumps(all_questions, ensure_ascii=False)},
  sources_metadata: {json.dumps(sources_meta, ensure_ascii=False)}
}};
"""
    with open(bundle_js_path, "w", encoding="utf-8") as f:
        f.write(bundle_content)
    print(f"✔ Generated client bundle: {bundle_js_path} ({os.path.getsize(bundle_js_path):,} bytes)")

    # P1-2: Narrow regex targeting ONLY the badge count text, preserving HTML tag attributes
    if os.path.exists(INDEX_PATH):
        with open(INDEX_PATH, "r", encoding="utf-8") as f:
            html = f.read()

        new_html, count = re.subn(r'Exams \(\d+\)', f'Exams ({len(all_exams)})', html)
        if count == 0:
            print("Warning: Could not find 'Exams (N)' badge text in index.html to update", file=sys.stderr)
        else:
            with open(INDEX_PATH, "w", encoding="utf-8") as f:
                f.write(new_html)
            print(f"✔ Updated index.html nav badge text to 'Exams ({len(all_exams)})'")

    return True

if __name__ == "__main__":
    # P1-3: Exit non-zero on failure
    success = bundle()
    sys.exit(0 if success else 1)
