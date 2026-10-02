#!/usr/bin/env python3
"""
fetch_sources.py
Downloads open-source CCDV-F developer question sources into data/raw/
"""
import urllib.request
import json
import os
import re

RAW_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
os.makedirs(RAW_DIR, exist_ok=True)

SOURCES = {
    # 1. srinipusuluri/CCDV-F-SET1 (9 Udemy-format CSV practice exams)
    "srinipusuluri": [
        f"https://raw.githubusercontent.com/srinipusuluri/CCDV-F-SET1/main/udemy-import/practice-exam-{i}.csv"
        for i in range(1, 10)
    ],
    # 2. hbacheller-tribe/CCDV-F-Exam (85 scenario questions in HTML)
    "hbacheller": [
        "https://raw.githubusercontent.com/hbacheller-tribe/CCDV-F-Exam/main/CCDV-F_Practice_Exam_v1.html"
    ],
    # 3. natsh/claude-developer-foundations-prep
    "natsh": [
        "https://raw.githubusercontent.com/natsh/claude-developer-foundations-prep/main/hard-prep-exam.md",
        "https://raw.githubusercontent.com/natsh/claude-developer-foundations-prep/main/practice-exam-quiz.md"
    ],
    # 4. Amey-Thakur/CLAUDE-CERTIFICATIONS
    "amey_thakur": [
        "https://raw.githubusercontent.com/Amey-Thakur/CLAUDE-CERTIFICATIONS/main/question-bank.json",
        "https://raw.githubusercontent.com/Amey-Thakur/CLAUDE-CERTIFICATIONS/main/developer-foundations/mock-exam-1.md",
        "https://raw.githubusercontent.com/Amey-Thakur/CLAUDE-CERTIFICATIONS/main/developer-foundations/mock-exam-2.md",
        "https://raw.githubusercontent.com/Amey-Thakur/CLAUDE-CERTIFICATIONS/main/developer-foundations/mock-exam-3.md",
        "https://raw.githubusercontent.com/Amey-Thakur/CLAUDE-CERTIFICATIONS/main/developer-foundations/practice-questions.md"
    ]
}

def fetch_file(url, dest_path):
    print(f"Fetching {url} -> {dest_path}")
    req = urllib.request.Request(url, headers={"User-Agent": "CCDV-F-Curation-Bot/1.0"})
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
    with open(dest_path, "wb") as f:
        f.write(content)
    print(f"Saved {dest_path} ({len(content)} bytes)")

def main():
    for source_name, urls in SOURCES.items():
        source_dir = os.path.join(RAW_DIR, source_name)
        os.makedirs(source_dir, exist_ok=True)
        for url in urls:
            filename = os.path.basename(url)
            dest = os.path.join(source_dir, filename)
            if not os.path.exists(dest) or os.path.getsize(dest) == 0:
                try:
                    fetch_file(url, dest)
                except Exception as e:
                    print(f"Error fetching {url}: {e}")
            else:
                print(f"Already exists: {dest} ({os.path.getsize(dest)} bytes)")

if __name__ == "__main__":
    main()
