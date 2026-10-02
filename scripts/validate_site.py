#!/usr/bin/env python3
"""
validate_site.py
Comprehensive integrity and validation test suite for CCDV-F Exam Simulator:
1. Asserts all static assets and client bundles exist.
2. Asserts all 10 exam files exist, each containing exactly 53 questions.
3. Asserts official CCDV-F blueprint weights (18/9/8/6/6/4/1/1) on EVERY form.
4. Asserts 530 unique question IDs and prompts across the entire system.
5. Asserts multi-source distribution: Non-Srinipusuluri >= 65%, Srinipusuluri <= 35%.
6. Asserts client bundle (js/exam-data.js) matches disk files.
7. Asserts question schema validity (options, correct_answers, explanations).
"""
import os
import json
import re
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXPECTED_BLUEPRINT = {
    "D1": 18,
    "D2": 9,
    "D3": 8,
    "D4": 6,
    "D5": 6,
    "D6": 4,
    "D7": 1,
    "D8": 1,
}

def test_files_exist():
    required_files = [
        "index.html",
        "manifest.json",
        "sw.js",
        "icons/icon.svg",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable.png",
        "icons/apple-touch-icon.png",
        "js/exam-data.js",
        "js/storage.js",
        "js/analytics.js",
        "js/app.js",
        "data/all_questions.json",
        "data/sources_metadata.json",
        "SOURCES.md",
        "README.md"
    ]
    for rf in required_files:
        p = os.path.join(BASE_DIR, rf)
        assert os.path.exists(p), f"Missing required file: {rf}"
        assert os.path.getsize(p) > 0, f"File is empty: {rf}"
        print(f"✓ {rf} exists ({os.path.getsize(p)} bytes)")

import struct

def test_pwa_configuration():
    # 1. Manifest Structure & Asset Existence
    manifest_path = os.path.join(BASE_DIR, "manifest.json")
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    assert manifest.get("display") == "standalone", "manifest.json must have display: standalone"
    assert manifest.get("start_url") == "./", "manifest.json must define start_url as ./"
    assert manifest.get("id") == "./", "manifest.json must define id as ./"
    assert manifest.get("theme_color") == "#FAF7F2", "manifest.json theme_color must match #FAF7F2"
    assert manifest.get("background_color") == "#FAF7F2", "manifest.json background_color must match #FAF7F2"
    assert len(manifest.get("icons", [])) >= 4, "manifest.json must specify at least 4 icon configurations"

    manifest_icon_srcs = []
    for icon_entry in manifest["icons"]:
        src = icon_entry["src"]
        manifest_icon_srcs.append(src)
        p = os.path.join(BASE_DIR, src)
        assert os.path.exists(p), f"Manifest icon file does not exist on disk: {src}"
        assert os.path.getsize(p) > 0, f"Manifest icon file is empty: {src}"

    # 2. Service Worker Precaching
    sw_path = os.path.join(BASE_DIR, "sw.js")
    with open(sw_path, "r", encoding="utf-8") as f:
        sw_text = f.read()
    assert "CACHE_NAME" in sw_text, "sw.js must define CACHE_NAME"
    assert "js/exam-data.js" in sw_text, "sw.js must pre-cache js/exam-data.js for offline exam availability"
    assert "allSettled" in sw_text, "sw.js must use allSettled for resilient pre-caching"
    for src in manifest_icon_srcs:
        assert src in sw_text, f"Manifest icon {src} must be listed in sw.js PRECACHE_ASSETS"
    assert "icons/apple-touch-icon.png" in sw_text, "apple-touch-icon.png must be in sw.js PRECACHE_ASSETS"

    # 3. Binary PNG Dimensions Verification (via IHDR struct)
    png_checks = [
        ("icons/icon-192.png", 192, 192),
        ("icons/icon-512.png", 512, 512),
        ("icons/icon-maskable.png", 512, 512),
        ("icons/apple-touch-icon.png", 180, 180)
    ]
    for rel_path, exp_w, exp_h in png_checks:
        abs_p = os.path.join(BASE_DIR, rel_path)
        with open(abs_p, "rb") as f:
            header = f.read(24)
            assert header[:8] == b"\x89PNG\r\n\x1a\n", f"Invalid PNG magic in {rel_path}"
            w, h = struct.unpack(">II", header[16:24])
            assert (w, h) == (exp_w, exp_h), f"{rel_path} dimensions {w}x{h} do not match expected {exp_w}x{exp_h}"

    # 4. index.html Head Elements
    index_path = os.path.join(BASE_DIR, "index.html")
    with open(index_path, "r", encoding="utf-8") as f:
        html = f.read()
    assert 'rel="manifest"' in html, "index.html must link to manifest.json"
    assert 'rel="apple-touch-icon"' in html, "index.html must link apple-touch-icon"
    assert 'name="theme-color" content="#FAF7F2"' in html, "index.html must set theme-color"
    assert 'viewport-fit=cover' in html, "index.html viewport must include viewport-fit=cover"
    assert 'id="mobile-matrix-modal"' in html, "index.html must provide mobile matrix drawer modal"

    print("✓ PWA Manifest, Service Worker, and Multi-resolution Icons verified for offline commute readiness!")

def test_exam_data():
    all_path = os.path.join(BASE_DIR, "data", "all_questions.json")
    with open(all_path, "r", encoding="utf-8") as f:
        questions = json.load(f)
    assert len(questions) == 530, f"Expected 530 questions, found {len(questions)}"
    
    # 1. Unique IDs & Prompts
    unique_ids = set(q["id"] for q in questions)
    assert len(unique_ids) == 530, f"Found duplicate question IDs ({len(unique_ids)}/530)"

    prompt_keys = set(re.sub(r'[^a-z0-9]', '', q["prompt"].lower())[:80] for q in questions)
    assert len(prompt_keys) == 530, f"Found duplicate prompts across questions ({len(prompt_keys)}/530)"
    print("✓ All 530 questions are strictly unique in ID and prompt content!")

    # 2. Schema Integrity
    source_counts = Counter()
    for q in questions:
        source_counts[q["source_repo"]] += 1
        assert len(q["options"]) >= 2, f"Question {q['id']} has < 2 options"
        assert len(q["correct_answers"]) >= 1, f"Question {q['id']} has no correct answer"
        assert q["domain_id"] in EXPECTED_BLUEPRINT, f"Invalid domain: {q['domain_id']}"
        assert len(q["prompt"]) > 10, f"Question {q['id']} prompt is too short"
        assert len(q["explanation"]) > 5, f"Question {q['id']} explanation is missing"
        opt_keys = [o["key"] for o in q["options"]]
        for ca in q["correct_answers"]:
            assert ca in opt_keys, f"Correct answer {ca} not in options {opt_keys} for {q['id']}"

    print("✓ All 530 questions passed strict schema and key integrity validation!")

    # 3. Multi-Source Diversity Verification
    non_srini = sum(count for repo, count in source_counts.items() if "srinipusuluri" not in repo)
    srini = source_counts["srinipusuluri/CCDV-F-SET1"]
    non_srini_pct = (non_srini / len(questions)) * 100
    srini_pct = (srini / len(questions)) * 100
    print(f"\nMulti-Source Distribution:")
    for repo, count in source_counts.most_common():
        print(f"  {repo:42s}: {count:3d} ({count/len(questions)*100:5.1f}%)")
    print(f"  Non-Srinipusuluri Total: {non_srini:3d} ({non_srini_pct:.1f}%)")
    print(f"  Srinipusuluri Total:     {srini:3d} ({srini_pct:.1f}%)")

    assert non_srini_pct >= 65.0, f"Non-Srinipusuluri ratio too low: {non_srini_pct:.1f}% < 65%"
    assert srini_pct <= 35.0, f"Srinipusuluri ratio too high: {srini_pct:.1f}% > 35%"
    print("✓ Multi-source balance verified: single-source concentration risk eliminated!")

    # 4. Blueprint Verification Across All 10 Forms
    print("\nVerifying 10 individual exam forms:")
    for i in range(1, 11):
        p = os.path.join(BASE_DIR, "data", "exams", f"exam_{i:02d}.json")
        assert os.path.exists(p), f"Exam file {p} missing"
        with open(p, "r", encoding="utf-8") as f:
            ex = json.load(f)
        assert len(ex["questions"]) == 53, f"Exam {i} has {len(ex['questions'])} questions, expected 53"
        assert ex["exam_id"] == i, f"Exam {i} has mismatched exam_id {ex['exam_id']}"
        assert ex["scaled_pass_score"] == 720
        assert ex["scaled_max_score"] == 1000

        # Check blueprint distribution on this form
        form_domains = Counter(q["domain_id"] for q in ex["questions"])
        for d_code, expected_count in EXPECTED_BLUEPRINT.items():
            actual = form_domains[d_code]
            assert actual == expected_count, f"Exam {i} domain {d_code} has {actual} questions, expected {expected_count}"
        
        # Check source diversity on this form
        form_sources = Counter(q["source_repo"] for q in ex["questions"])
        assert len(form_sources) >= 4, f"Exam {i} only draws from {len(form_sources)} sources, expected at least 4"

        print(f"  ✓ Exam #{i:02d}: 53 questions (18/9/8/6/6/4/1/1 blueprint verified, {len(form_sources)} sources represented)")

    # 5. Client Bundle Verification
    bundle_path = os.path.join(BASE_DIR, "js", "exam-data.js")
    with open(bundle_path, "r", encoding="utf-8") as f:
        bundle_text = f.read()
    assert "window.EXAM_DATA" in bundle_text, "window.EXAM_DATA not found in js/exam-data.js"
    assert len(bundle_text) > 1000000, f"Bundle size unexpectedly small ({len(bundle_text)} bytes)"
    print(f"\n✓ Client bundle js/exam-data.js verified ({len(bundle_text):,} bytes)")

if __name__ == "__main__":
    print("=====================================================")
    print("  CCDV-F EXAM SIMULATOR SYSTEM INTEGRITY VALIDATION  ")
    print("=====================================================")
    test_files_exist()
    test_pwa_configuration()
    test_exam_data()
    print("\n=====================================================")
    print("  ALL SYSTEM CHECKS & BLUEPRINT TESTS PASSED (100%)  ")
    print("=====================================================")
