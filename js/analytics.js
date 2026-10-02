/**
 * analytics.js
 * Scoring engine, domain performance weighting, gap diagnostic, and export tools.
 */

export const DOMAIN_METADATA = {
  D1: { id: "D1", name: "Applications & Integration", weight: 33.1, expected: 18 },
  D2: { id: "D2", name: "Model Selection & Optimization", weight: 16.8, expected: 9 },
  D3: { id: "D3", name: "Agents & Workflows", weight: 14.7, expected: 8 },
  D4: { id: "D4", name: "Prompt & Context Engineering", weight: 11.0, expected: 6 },
  D5: { id: "D5", name: "Tools & MCPs", weight: 10.6, expected: 6 },
  D6: { id: "D6", name: "Security & Safety", weight: 8.1, expected: 4 },
  D7: { id: "D7", name: "Claude Code", weight: 3.1, expected: 1 },
  D8: { id: "D8", name: "Eval, Testing & Debugging", weight: 2.6, expected: 1 }
};

export const TOPIC_STUDY_GUIDES = {
  "Prompt Caching & Cost": {
    domain: "D1",
    summary: "Cache breakpoints use cache_control: {'type': 'ephemeral'}. The static prefix must be placed first. Caching cuts TTFT and gives 90% read discounts.",
    traps: "Placing dynamic turns before cached system prompts breaks prefix alignment. Don't cache rapidly changing text."
  },
  "Streaming & Messages API": {
    domain: "D1",
    summary: "The Messages API uses SSE (content_block_start, content_block_delta, message_stop). Use AsyncAnthropic for concurrency.",
    traps: "Refusals or stop_reason 'max_tokens' vs 'end_turn' require distinct handling; stop_reason 'tool_use' means your client must run the tool."
  },
  "Batch Processing API": {
    domain: "D1",
    summary: "50% discount on inputs and outputs for latency-tolerant jobs with a 24-hour turnaround processing window.",
    traps: "Do not use Batch API for interactive or synchronous user flows."
  },
  "Extended Thinking": {
    domain: "D2",
    summary: "Allocates additional reasoning token budget before generating output. Appropriate for complex math, logic, and planning.",
    traps: "Don't use extended thinking for simple lookups or classifications—it adds unnecessary cost and latency."
  },
  "Sampling & Non-Determinism": {
    domain: "D2",
    summary: "Temperature controls randomness; temperature 0 for deterministic output. When extended thinking is enabled, sampling defaults must be respected.",
    traps: "Do not pass custom temperature when thinking budget is high if model constraints prohibit it."
  },
  "Model Selection & Tradeoffs": {
    domain: "D2",
    summary: "Haiku (speed/cost, simple workflows), Sonnet (balanced frontier, enterprise workhorse), Opus (deepest reasoning).",
    traps: "Right-sizing saves money: don't default to Opus for simple routing or entity extraction."
  },
  "Agent Loops & Multi-Agent": {
    domain: "D3",
    summary: "Agent loops (plan -> act -> observe -> decide) are ideal when paths cannot be hardcoded. Deterministic workflows are better when steps are fixed.",
    traps: "Autonomous agents add unpredictability: use deterministic workflows when the sequence and rules are strictly known."
  },
  "Model Context Protocol (MCP)": {
    domain: "D5",
    summary: "MCP exposes tools, resources, and prompts over stdio (local CLI) or SSE/HTTP (remote servers). Tools execute on client/host.",
    traps: "Confusing MCP resources (read-only data) with tools (executable actions). Claude does not run MCP servers—your client coordinates."
  },
  "Deterministic Hooks & Controls": {
    domain: "D6",
    summary: "Hooks execute deterministically before/after actions (similar to ServiceNow Business Rules) to enforce hard boundaries.",
    traps: "Relying on system prompts alone for security is vulnerable to prompt injection; deterministic code hooks cannot be jailbroken."
  },
  "Claude Code Configuration": {
    domain: "D7",
    summary: "CLAUDE.md hierarchy (project root > user global), settings.json, slash commands, headless mode, auto mode.",
    traps: "Putting secrets in CLAUDE.md. CLAUDE.md is committed; secrets must stay in environment variables or ignored .env."
  },
  "Evaluation & Testing": {
    domain: "D8",
    summary: "Eval suites should test precision, recall, schema conformance, and guardrail resistance with synthetic & test datasets.",
    traps: "Evaluating only happy paths; prompt changes must be tested across diverse edge-case benchmark suites."
  }
};

export const Analytics = {
  // Shared helper: Check if question expects multiple selections
  isMulti(q) {
    if (!q) return false;
    return q.type === "multiple" || (Array.isArray(q.correct_answers) && q.correct_answers.length > 1);
  },

  // Score an exam run
  evaluateExam(exam, userAnswers) {
    let rawScore = 0;
    const totalQuestions = exam.questions.length;
    const domainStats = {};
    const missedQuestions = [];

    // Initialize domain stats
    Object.keys(DOMAIN_METADATA).forEach(dId => {
      domainStats[dId] = {
        ...DOMAIN_METADATA[dId],
        total: 0,
        correct: 0,
        percentage: 0,
        status: "Untested"
      };
    });

    exam.questions.forEach((q, idx) => {
      const dId = q.domain_id || "D1";
      if (!domainStats[dId]) {
        domainStats[dId] = { id: dId, name: q.domain_name, weight: 10, expected: 5, total: 0, correct: 0, percentage: 0, status: "Untested" };
      }
      domainStats[dId].total += 1;

      const userSelection = userAnswers[q.id] || [];
      const correctAnswers = q.correct_answers || [];

      // Check correctness
      let isCorrect = false;
      if (this.isMulti(q)) {
        const sortedUser = [...userSelection].sort().join(",");
        const sortedCorrect = [...correctAnswers].sort().join(",");
        isCorrect = sortedUser.length > 0 && sortedUser === sortedCorrect;
      } else {
        isCorrect = userSelection.length === 1 && userSelection[0] === correctAnswers[0];
      }

      if (isCorrect) {
        rawScore += 1;
        domainStats[dId].correct += 1;
      } else {
        missedQuestions.push({
          ...q,
          exam_title: exam.title,
          exam_id: exam.exam_id,
          user_selected: userSelection,
          question_number: idx + 1
        });
      }
    });

    const percentage = totalQuestions > 0 ? (rawScore / totalQuestions) * 100 : 0;
    const isPassing = percentage >= 72.0;

    // Piecewise scaled score anchored at 72.0% -> 720
    let scaledScore = 100;
    if (percentage >= 72.0) {
      // Maps [72.0, 100.0] -> [720, 1000]
      scaledScore = Math.min(1000, 720 + Math.round(((percentage - 72.0) / 28.0) * 280));
    } else {
      // Maps [0.0, 71.99] -> [100, 719]
      scaledScore = Math.max(100, 100 + Math.round((percentage / 72.0) * 619));
    }

    // Calculate domain percentages and status
    Object.keys(domainStats).forEach(dId => {
      const st = domainStats[dId];
      if (st.total === 0) {
        st.percentage = 0;
        st.status = "Untested";
      } else {
        st.percentage = Math.round((st.correct / st.total) * 1000) / 10;
        if (st.percentage >= 80) st.status = "Strong";
        else if (st.percentage >= 72) st.status = "Passing";
        else st.status = "Lagging";
      }
    });

    return {
      raw_score: rawScore,
      total_questions: totalQuestions,
      percentage: Math.round(percentage * 10) / 10,
      scaled_score: scaledScore,
      is_passing: isPassing,
      domain_stats: domainStats,
      missed_questions: missedQuestions,
      user_answers: userAnswers
    };
  },

  // Perform cross-exam diagnostic gap analysis
  diagnoseGaps(attempts, missedQuestions, activeExam = null) {
    const fullExams = (attempts || []).filter(a => (a.exam_id !== undefined ? a.exam_id < 900 : true) && a.total_questions >= 50);

    // Initialize domain statistics across all 8 domains
    const domainTotals = {};
    Object.keys(DOMAIN_METADATA).forEach(dId => {
      domainTotals[dId] = { total: 0, correct: 0 };
    });

    let totalPctSum = 0;
    let totalQuestionsEvaluated = 0;
    let totalCorrectEvaluated = 0;

    // 1. Aggregate from full completed exams
    if (fullExams && fullExams.length > 0) {
      fullExams.forEach(att => {
        totalPctSum += att.percentage;
        if (att.domain_stats) {
          Object.keys(att.domain_stats).forEach(dId => {
            if (domainTotals[dId]) {
              domainTotals[dId].total += att.domain_stats[dId].total || 0;
              domainTotals[dId].correct += att.domain_stats[dId].correct || 0;
              totalQuestionsEvaluated += att.domain_stats[dId].total || 0;
              totalCorrectEvaluated += att.domain_stats[dId].correct || 0;
            }
          });
        }
      });
    }

    // 2. Aggregate from other attempts (drills, partial sessions)
    const otherAttempts = (attempts || []).filter(a => !fullExams.includes(a));
    otherAttempts.forEach(att => {
      if (att.domain_stats) {
        Object.keys(att.domain_stats).forEach(dId => {
          if (domainTotals[dId]) {
            domainTotals[dId].total += att.domain_stats[dId].total || 0;
            domainTotals[dId].correct += att.domain_stats[dId].correct || 0;
            totalQuestionsEvaluated += att.domain_stats[dId].total || 0;
            totalCorrectEvaluated += att.domain_stats[dId].correct || 0;
          }
        });
      }
    });

    // 3. Aggregate from active in-progress exam / study session
    const allMissed = [...(missedQuestions || [])];
    const missedIdSet = new Set(allMissed.map(q => q.id));

    if (activeExam) {
      const activeQuestions = activeExam.questions || (activeExam.exam && activeExam.exam.questions) || [];
      const checkedMap = activeExam.checkedQuestions || {};

      activeQuestions.forEach(q => {
        const checked = checkedMap[q.id];
        if (checked) {
          if (domainTotals[q.domain_id]) {
            domainTotals[q.domain_id].total += 1;
            totalQuestionsEvaluated += 1;
            if (checked.isCorrect) {
              domainTotals[q.domain_id].correct += 1;
              totalCorrectEvaluated += 1;
            } else {
              if (!missedIdSet.has(q.id)) {
                allMissed.push(q);
                missedIdSet.add(q.id);
              }
            }
          }
        }
      });
    }

    // 4. Ensure any missed questions in vault are reflected in domain totals if untested
    allMissed.forEach(q => {
      if (domainTotals[q.domain_id] && domainTotals[q.domain_id].total === 0) {
        domainTotals[q.domain_id].total = q.miss_count || 1;
        domainTotals[q.domain_id].correct = 0;
        totalQuestionsEvaluated += q.miss_count || 1;
      }
    });

    // Compute average score:
    // If full exams exist, use average percentage of full exams.
    // Otherwise if questions were evaluated, use ratio of correct/total.
    let avgScore = 0;
    if (fullExams.length > 0) {
      avgScore = Math.round((totalPctSum / fullExams.length) * 10) / 10;
    } else if (totalQuestionsEvaluated > 0) {
      avgScore = Math.round((totalCorrectEvaluated / totalQuestionsEvaluated) * 1000) / 10;
    }

    // Compute aggregate domain accuracy
    const domainRankings = Object.keys(DOMAIN_METADATA).map(dId => {
      const meta = DOMAIN_METADATA[dId];
      const stats = domainTotals[dId];
      const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 1000) / 10 : 0;
      return {
        id: dId,
        name: meta.name,
        weight: meta.weight,
        total: stats.total,
        correct: stats.correct,
        percentage: pct,
        is_lagging: stats.total > 0 && pct < 72.0
      };
    });

    domainRankings.sort((a, b) => {
      // Tested domains with lower accuracy first, then untested
      if (a.total > 0 && b.total > 0) return a.percentage - b.percentage;
      if (a.total > 0) return -1;
      if (b.total > 0) return 1;
      return b.weight - a.weight;
    });

    const laggingDomains = domainRankings.filter(d => d.total > 0 && d.is_lagging);
    const strongDomains = domainRankings.filter(d => d.total > 0 && d.percentage >= 80);

    // Identify topic frequency in missed questions
    const topicFrequency = {};
    allMissed.forEach(q => {
      const t = q.topic || "General";
      topicFrequency[t] = (topicFrequency[t] || 0) + (q.miss_count || 1);
    });

    const topTopicGaps = Object.entries(topicFrequency)
      .map(([topic, count]) => ({
        topic,
        count,
        guide: TOPIC_STUDY_GUIDES[topic] || null
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    let readiness = "Not Started";
    if (fullExams.length > 0) {
      if (avgScore >= 85) readiness = "Exam Ready (Very Strong)";
      else if (avgScore >= 75) readiness = "Passing Zone (Ready)";
      else if (avgScore >= 70) readiness = "Borderline Passing (Focus on Gaps)";
      else readiness = "Needs Work (<70%)";
    } else if (totalQuestionsEvaluated > 0) {
      readiness = `In Progress (${avgScore}%)`;
    }

    const recommendations = [];
    if (laggingDomains.length > 0) {
      laggingDomains.forEach(ld => {
        recommendations.push(`Prioritize **${ld.name}** (${ld.weight}% exam weight) — currently at ${ld.percentage}%.`);
      });
    } else if (fullExams.length > 0) {
      recommendations.push("All tested domains meet or exceed the 72% pass line! Keep practicing full timed exams to build stamina.");
    } else if (totalQuestionsEvaluated > 0) {
      recommendations.push(`You have evaluated ${totalQuestionsEvaluated} question${totalQuestionsEvaluated === 1 ? '' : 's'} (${totalCorrectEvaluated} correct, ${avgScore}% accuracy). Complete Mock Exam #01 to establish your formal baseline.`);
    } else {
      recommendations.push("Take Mock Exam #01 or begin Study Mode to establish your initial diagnostic baseline.");
    }

    if (topTopicGaps.length > 0) {
      recommendations.push(`Your most frequent misconception topic is **${topTopicGaps[0].topic}** (${topTopicGaps[0].count} misses). Use the Missed Questions Vault to drill these items.`);
    }

    return {
      total_attempts: (attempts ? attempts.length : 0),
      full_attempts: fullExams.length,
      total_questions_tested: totalQuestionsEvaluated,
      average_score: avgScore,
      readiness_level: readiness,
      domain_rankings: domainRankings,
      lagging_domains: laggingDomains,
      strong_domains: strongDomains,
      top_topic_gaps: topTopicGaps,
      recommendations: recommendations
    };
  },

  // Export missed questions to mistakes.md format
  generateMistakesMarkdown(missedQuestions) {
    if (!missedQuestions || missedQuestions.length === 0) {
      return "# Mistakes Log\n\nNo missed questions recorded yet! Complete a mock exam to populate this log.\n";
    }

    let md = `# CCDV-F Missed Questions Log & Misconceptions\n\n`;
    md += `Generated: ${new Date().toLocaleDateString()} · Total Missed Questions: ${missedQuestions.length}\n\n`;
    md += `Use this log to review recurring traps, understand the underlying technical facts, and reinforce your reasoning before the exam.\n\n`;
    md += `---\n\n`;

    missedQuestions.forEach((q, i) => {
      const domainName = DOMAIN_METADATA[q.domain_id]?.name || q.domain_name || "Domain";
      md += `### ${i + 1}. [${q.domain_id}] ${domainName} — ${q.topic || 'Core'}\n\n`;
      md += `**Question:** ${q.prompt}\n\n`;
      md += `**Your Answer:** ${q.user_selected && q.user_selected.length > 0 ? q.user_selected.join(', ') : 'None'}\n`;
      md += `**Correct Answer:** ${q.correct_answers.join(', ')}\n\n`;
      md += `> **Why it's correct:**\n> ${q.explanation}\n\n`;
      
      if (q.distractor_explanations && Object.keys(q.distractor_explanations).length > 0) {
        md += `**Distractor Analysis:**\n`;
        Object.entries(q.distractor_explanations).forEach(([opt, exp]) => {
          md += `- **Option ${opt}:** ${exp}\n`;
        });
        md += `\n`;
      }
      md += `---\n\n`;
    });

    return md;
  }
};
