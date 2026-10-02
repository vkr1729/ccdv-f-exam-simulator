#!/usr/bin/env python3
"""
validate_site.py
Verifies file existence, JSON validity, exam count, question completeness,
and ensures no missing assets exist.
"""
import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def test_files_exist():
    required_files = [
        "index.html",
        "preview/index.html",
        "js/exam-data.js",
        "js/storage.js",
        "js/analytics.js",
        "js/app.js",
        "data/all_questions.json",
        "data/sources_metadata.json",
        "SOURCES.md"
    ]
    for rf in required_files:
        p = os.path.join(BASE_DIR, rf)
        assert os.path.exists(p), f"Missing required file: {rf}"
        assert os.path.getsize(p) > 0, f"File is empty: {rf}"
        print(f"✓ {rf} exists ({os.path.getsize(p)} bytes)")

def test_exam_data():
    with open(os.path.join(BASE_DIR, "data", "all_questions.json"), "r", encoding="utf-8") as f:
        questions = json.load(f)
    assert len(questions) == 530, f"Expected 530 questions, found {len(questions)}"
    
    unique_ids = set(q["id"] for q in questions)
    assert len(unique_ids) == 530, "Found duplicate question IDs!"

    # Verify options and answers for all questions
    for q in questions:
        assert len(q["options"]) >= 2, f"Question {q['id']} has < 2 options"
        assert len(q["correct_answers"]) >= 1, f"Question {q['id']} has no correct answer"
        assert q["domain_id"] in ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"], f"Invalid domain: {q['domain_id']}"
        assert len(q["prompt"]) > 10, f"Question {q['id']} prompt is too short"
        assert len(q["explanation"]) > 5, f"Question {q['id']} explanation is missing"

    print("✓ All 530 questions passed schema validation!")

    # Verify 10 individual exam files
    for i in range(1, 11):
        p = os.path.join(BASE_DIR, "data", "exams", f"exam_{i:02d}.json")
        assert os.path.exists(p), f"Exam file {p} missing"
        with open(p, "r", encoding="utf-8") as f:
            ex = json.load(f)
        assert len(ex["questions"]) == 533 or len(ex["questions"]) == 53, f"Exam {i} has {len(ex['questions'])} questions"
        print(f"✓ Exam #{i:02d} verified: {len(ex['questions'])} questions")

if __name__ == "__main__":
    print("Running website & question bank validation...")
    test_files_exist()
    test_exam_data()
    print("\nALL AUTOMATED VALIDATION CHECKS PASSED SUCCESSFULLY!")
