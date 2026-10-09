# Claude Certified Developer Foundations (CCDV-F) — 22 Mock Exam Simulator
*(Unofficial Community Study & Practice Platform)*

> **Disclaimer:** This is an independent, open-source community preparation project. It is **not** affiliated with, endorsed by, sponsored by, or certified by Anthropic PBC. Claude and CCDV-F are trademarks or service marks of Anthropic PBC.

A standalone, production-grade practice exam platform for candidates preparing for the **Claude Certified Developer – Foundations (CCDV-F)** certification.

Hosted live on GitHub Pages: **[https://vkr1729.github.io/ccdv-f-exam-simulator/](https://vkr1729.github.io/ccdv-f-exam-simulator/)**

---

## 🌟 Key Features

- **22 Full-Length Exam Forms (1,166 Questions Total)**: Every form strictly simulates the real 53-item, 120-minute Pearson VUE exam structure and blueprint domain weights.
- **Moderate Tier Forms (#13–#18 · 318 Questions)**: Developed directly against official Anthropic blueprints, providing realistic moderate-difficulty simulations with balanced exam-style practice across all 8 domains (completely original and not from public dumps).
- **Hard Tier Forms (#11 & #12 · 106 Questions)**: Developed directly against official Anthropic blueprints, featuring elevated difficulty with subtle, plausible near-miss distractors to simulate tough edge cases and deep architectural reasoning. Expanded with detailed answer explanations.
- **Exam-Style Tier Forms (#19–#22 · 212 Questions)**: Developed directly against official Anthropic blueprints, featuring applied scenarios with realistic code/config snippets and subtle, plausible options.
- **Strict Developer Scope**: Rigorously curated and audited for Developer-specific scenarios (Messages API, Agent SDK, MCP, streaming, caching, hooks, security boundaries) rather than high-level Architect topologies.
- **PWA & Offline Commute Ready**: Installable as a Progressive Web App (PWA) with responsive mobile bottom-sheet ergonomics, touch optimizations (`touch-action: manipulation`), safe-area padding for notch/gesture bars, and Service Worker caching. Once loaded online initially, the entire application shell and all 1,166 questions are cached for complete offline practice on trains, subways, or flights without internet.
- **Claude Studio Design Language**: Built in a warm, editorial, distraction-free light theme inspired by Anthropic's brand aesthetic (`Newsreader` serif headlines + `Inter` body + `JetBrains Mono` code blocks).
- **Persistent Missed Questions Vault**: Incorrect answers across all attempts automatically save to local browser storage for revision. Existing user attempts and scores are strictly preserved and never overwritten by updates.
- **Lagging-Area Gap Diagnostic**: Dynamically ranks your proficiency across the 8 exam domains against the 72% (720/1000) passing threshold and provides targeted topic watch-outs.
- **Targeted Remediation Quiz**: Launch custom drills composed exclusively of your previously missed questions until mastered.
- **Zero-Dependency Architecture**: Standalone modern HTML5, Tailwind CSS, and Vanilla ES Modules with 100% offline capability and zero backend requirements.
- **Transparent Provenance**: Complete author attribution and repository citations across community developer repositories and original blueprint forms.

---

## 📊 Official CCDV-F Domain Balance (Per 53-Question Form)

| Domain Code | Official Domain Name | Blueprint Weight | Questions / Form | Total in Bank (22 Exams) |
|---|---|---|---|---|
| **D1** | **Applications & Integration** | 33.1% | 18 | 396 |
| **D2** | **Model Selection & Optimization** | 16.8% | 9 | 198 |
| **D3** | **Agents & Workflows** | 14.7% | 8 | 176 |
| **D4** | **Prompt & Context Engineering** | 11.0% | 6 | 132 |
| **D5** | **Tools & MCPs** | 10.6% | 6 | 132 |
| **D6** | **Security & Safety** | 8.1% | 4 | 88 |
| **D7** | **Claude Code** | 3.1% | 1 | 22 |
| **D8** | **Eval, Testing & Debugging** | 2.6% | 1 | 22 |
| **TOTAL** | | **100%** | **53** | **1,166** |

---

## 🚀 Running Locally

No build step or Node.js environment is required. You can serve the static directory using any local web server:

```bash
# Using Python 3
python3 -m http.server 8000

# Open in your browser:
# http://localhost:8000/
```

Or open `preview/index.html` to view the 3 UI/UX design variants explored during development.

---

## 📁 Repository Structure

```
.
├── index.html                  # Standalone SPA application
├── preview/
│   └── index.html              # 3 UI/UX Pro Max design variants preview
├── js/
│   ├── app.js                  # Main SPA view controller and router
│   ├── storage.js              # LocalStorage persistent state engine
│   ├── analytics.js            # Scoring engine, gap diagnostic & export tools
│   └── exam-data.js            # Bundled 1,166 questions across 22 exams
├── data/
│   ├── all_questions.json      # Complete curated question bank (1,166 questions)
│   ├── sources_metadata.json   # Upstream provenance metadata
│   └── exams/                  # Individual exam JSON files (exam_01 to exam_22)
├── scripts/
│   ├── bundle_client_data.py   # Compiles exams into client bundles
│   ├── validate_hard_exams.py  # Blueprint & distractor validation for hard forms
│   └── validate_site.py        # Automated test and validation suite
├── SOURCES.md                  # Comprehensive attribution & citations
└── README.md                   # Project documentation
```

---

## 📜 Attributions & Provenance

This educational study project incorporates authentic scenario items from vetted community developer repositories as well as Blueprint Originals across Moderate, Hard, and Exam-Style Tiers:
- **Exams #13–#18 (Moderate Tier · Blueprint Originals)**: Developed directly against official Anthropic CCDV-F blueprints providing realistic moderate-difficulty full-length simulations.
- **Exams #11 & #12 (Hard Tier · Blueprint Originals)**: Developed directly against official Anthropic CCDV-F blueprints with elevated distractor plausibility and deep answer explanations.
- **Exams #19–#22 (Exam-Style Tier · Blueprint Originals)**: Developed directly against official Anthropic CCDV-F blueprints featuring applied scenarios with realistic code/config snippets.
- **[srinipusuluri/CCDV-F-SET1](https://github.com/srinipusuluri/CCDV-F-SET1)** by Srinivas Pusuluri
- **[natsh/claude-developer-foundations-prep](https://github.com/natsh/claude-developer-foundations-prep)** by Nat Sh.
- **[turjoy-real/CCDV-F](https://github.com/turjoy-real/CCDV-F)** by Turjoy
- **[hbacheller-tribe/CCDV-F-Exam](https://github.com/hbacheller-tribe/CCDV-F-Exam)** by H. Bacheller
- **[Amey-Thakur/CLAUDE-CERTIFICATIONS](https://github.com/Amey-Thakur/CLAUDE-CERTIFICATIONS)** by Amey Thakur

See [SOURCES.md](SOURCES.md) for full provenance and licensing details.
