# CareerAI — Master Implementation Plan
### Agent-ready build plan: architecture, phases, risk controls, and cut lines

> **How to use this doc:** Paste this whole file into your repo root as `CLAUDE.md` (or `AGENT.md` / project instructions) before starting. Work phase by phase — give your coding agent one phase at a time, review the working result, then move on. Don't ask for the whole system in one shot.

---

## 0. Non-negotiable principles (read this first)

1. **Vertical slice over feature count.** At every point in the build, the chain `Resume upload → Gemini extraction → normalized profile → career-specific score → skill gaps → roadmap → AI Coach` should work end-to-end, even if ugly. Polish comes after the loop closes, never before.
2. **Deterministic scoring, generative explanation.** Gemini never produces the number. scikit-learn / a hand-weighted formula produces the number. Gemini explains it in language. This is your strongest technical answer to "isn't this just a ChatGPT wrapper" — don't blur this line under time pressure.
3. **Be honest about the scoring weights.** The formula below is a designed heuristic, not a trained model. Say so plainly in the demo. This is more credible than pretending it's learned.
4. **Risk-first build order, not doc order.** The phases below are sequenced by *actual risk*, which is not identical to the original plan's order. Gemini structured extraction and the scoring engine are your highest-risk items — they get resourced first, even before dashboard pages exist.
5. **Pick your cut line before you start, not when you run out of time.** See §7.

---

## 1. Time budget reality check

Sum of realistic phase estimates below: **~38–52 hours of focused work.**

- 24-hour solo hackathon → you will not finish everything. Decide your cut line now (§7).
- 36–48-hour team hackathon (2–4 people) → full scope is achievable with parallelization (see §2).
- Do not discover your time shortfall at hour 20. Re-check progress against this budget every ~6 hours.

---

## 2. Team parallelization (if more than 1 person)

| Track | Owns | Depends on |
|---|---|---|
| **A — Backend/AI core** | Gemini extraction, Pydantic schemas, scoring engine, gap engine, coach service | Nothing (can start immediately with mocked data) |
| **B — Frontend** | React shell, all pages, charts | Needs API contracts (define these on paper in Phase 0, before backend is done) |
| **C — Data/DB** | Schema, seed data, career requirements CSVs, cohort generation | Nothing (can start immediately) |

Define your API request/response shapes (Pydantic schemas) in Phase 0 as a shared contract so Track B can build against mocked JSON while Track A builds the real thing.

---

## 3. Architecture (unchanged core, tightened)

```
Student → PDF/DOCX/Form → FastAPI
   → document_parser (PyMuPDF / python-docx)
   → gemini_service (extraction, strict JSON, Pydantic-validated)
   → profile_service (normalized profile, editable by student)
   → feature_service (skills/projects/evidence → numeric features)
   → scoring.py (transparent weighted formula) + scikit-learn (normalization, cosine similarity, cohort percentile)
   → career_service (per-career fit %) + gap_service (prioritized gaps)
   → roadmap_service (gaps → 3–5 ordered actions)
   → coach_service (Gemini, given full context: profile + score + gaps + roadmap)
   → Dashboard (React)
```

**Stack:** React + TS + Vite + Tailwind + Recharts · FastAPI + Pydantic · Gemini API · scikit-learn + NumPy + pandas · PostgreSQL + pgvector · PyMuPDF + python-docx · Docker + Cloud Run.

**Why pgvector:** used for semantic evidence matching — e.g. matching "built REST APIs with Flask" against a requirement for "backend development experience" without requiring exact keyword overlap. Generate embeddings via Gemini's embedding endpoint at profile-save time; store alongside skill records.

---

## 4. Scoring formula (say this out loud in your demo)

```
readiness_score =
    0.25 × technical_skills
  + 0.25 × projects
  + 0.20 × academics
  + 0.10 × experience
  + 0.10 × assessments
  + 0.10 × achievements
```

- This is a **hand-designed weighted rubric**, calibrated by reasoning about what industry job postings emphasize — not a trained model. State this explicitly to judges; it's a feature (transparency), not a weakness, as long as you own it.
- `score → StandardScaler-normalized → percentile within cohort → rank`.
- **Stretch only, not core:** RandomForestClassifier/Regressor, *only if* `student_career_labels.csv` has enough manually reviewed labels to be trustworthy (aim for 30+ labeled examples minimum before trying this — otherwise skip it and say so).
- Per-career fit % reuses the same formula, reweighted by that career's `skill_weights` from `career_skills`.

---

## 5. Phased build plan (risk-ordered)

Each phase ends with something you can click, curl, or query — not "code exists somewhere."

### Phase 0 — Scope, contracts & data skeleton (2–3 hrs)
- Lock 4–6 careers: Software Engineer, ML Engineer, Data Scientist, Cybersecurity Analyst, Cloud Engineer, Full Stack Developer.
- Write Pydantic schemas for every API request/response **now** — this is the shared contract between frontend and backend tracks.
- Draft `career_skills` (required/important/optional skills + weights + target levels) for all 6 careers by hand — this is your ground truth, keep it deterministic.
- Write the seed-data generation script skeleton (don't run it yet — do this in Phase 1 alongside schema).
- Git repo + folder structure per §8 directory layout.

**Done when:** schemas.py compiles, career_skills draft exists as a reviewed doc, repo scaffolded.

---

### Phase 1 — Foundation + seed data (3–4 hrs)
- `schema.sql`: students, student_skills, projects, experiences, careers, career_skills, student_scores, skill_gaps, roadmaps, coach_messages.
- **Generate a realistic cohort now, not later.** Write a script producing 30–100 synthetic students with a genuine *spread* — weak/average/strong, across all 6 careers. Repeated near-identical rows will make your percentile rank look broken or suspicious live. This is a common last-minute failure — do it early.
- FastAPI `/health`, DB connection verified.
- React/Vite shell + navigation + API client stub pointed at mocked JSON (Track B can start here without waiting on Track A).

**Done when:** `/health` returns 200, DB has 30+ varied synthetic students, React shell renders with nav.

---

### Phase 2 — Student input (3–5 hrs)
- Guided form → save student (simplest path first).
- PDF/DOCX upload via PyMuPDF / python-docx.
- Validate file type/size; handle corrupt/empty files gracefully (test this now, not in Phase 11 — a coding agent should write 2–3 malformed-file test cases as this service is built).
- Store raw + parsed text.

**Done when:** you can upload a real messy resume PDF and get raw text back, with graceful errors on garbage input.

---

### Phase 3 — Gemini structured extraction (5–7 hrs) — HIGHEST RISK, resource accordingly
- Write `prompts/profile_extraction.txt` demanding strict JSON, no prose, no markdown fences.
- Pydantic-validate every response; on failure, retry once with an error-correction follow-up prompt before failing gracefully to the student.
- Normalize skill names to a canonical list (e.g. "JS", "Javascript", "JavaScript" → one entry) — build this mapping table now, it will save you pain in scoring.
- Test against **at least 5 real, differently-formatted resumes** (multi-column, table-based, non-standard fonts) — not just one clean example. This is where most hackathon teams silently break.
- Show extracted profile to student for confirmation/edit before it's used anywhere downstream — never let unverified extraction feed the score.

**Done when:** 5 varied real resumes all produce valid, Pydantic-passing structured profiles, and at least one deliberately malformed Gemini response is caught and handled without crashing.

---

### Phase 4 — Scoring & ranking engine (4–6 hrs)
- Implement the weighted formula from §4 in `ml/src/scoring.py`.
- scikit-learn: `StandardScaler` for normalization, cosine similarity / `NearestNeighbors` for evidence-to-requirement semantic matching (using pgvector embeddings from Phase 0/1).
- Cohort percentile + rank against your seeded 30–100 students.
- Return a **score breakdown object** (which sub-scores contributed what) — this is what makes the score explainable, not just a number.
- **Do not reach for RandomForest** unless you already have 30+ manually reviewed labels — default to the transparent formula and say so.

**Done when:** given a profile, you get `{score, percentile, rank, breakdown: {...}}` and it's stable across repeated runs (deterministic).

---

### Phase 5 — Career fit + gap engine (5–7 hrs)
- Per-career score using the same formula reweighted by that career's `skill_weights`.
- Rank all 6 careers per student, return top matches with reasons tied to specific evidence (not generic text).
- Gap detection: `current_level` vs `target_level` per skill → critical / developing / strong.
- Priority = `career_importance × gap_size`. Return top 3–5 gaps only — resist showing every gap.

**Done when:** selecting a career returns fit %, a reason string grounded in the student's actual evidence, and a prioritized (not exhaustive) gap list.

---

### Phase 6 — Roadmap generation (2–4 hrs)
- Convert top gaps into 3–5 **concrete, single-action items** (e.g. "Build and deploy one ML API using Docker" — never "Learn MLOps").
- Each roadmap item should map traceably back to a specific gap — check this mapping manually before demo.

**Done when:** roadmap items are specific, ordered, and each one obviously addresses a gap shown on the Skills page.

---

### Phase 7 — AI Career Coach (4–6 hrs)
- `prompts/coach_system.txt`: feed Gemini the full context — profile, score breakdown, career fit, gaps, roadmap.
- Coach must answer from that context, not generically. Explicitly instruct it to separate facts (from the student's data) from suggestions, and to avoid guaranteeing outcomes ("this system is a readiness benchmark, not an employment guarantee").
- Test with the exact question you'll ask in the demo: *"Why am I not ready yet?"*

**Done when:** the coach answer visibly references the student's actual gaps/score rather than generic career advice.

---

### Phase 8 — Dashboard assembly (5–8 hrs)
- Pages: Landing, Onboarding, Dashboard, Rank, Skills, Careers, Roadmap, Coach, Profile.
- Consistent cards/charts (Recharts) for score, radar/bar for skills, career fit list.
- Loading, empty, and error states on every page — do this as you build each page, not as a final pass.
- "What should I do next?" as a persistent, obvious CTA on the Dashboard.

**Done when:** you can walk the full student journey (upload → score → career → gaps → roadmap → coach) without a single dead-end or unhandled error state.

---

### Phase 9 — What-if simulator (2–4 hrs) — first cut candidate, see §7
- Reuse the *exact same scoring formula* for the projected score — never hardcode a "+11" for narrative effect. If it isn't grounded in the real formula, a sharp judge will catch the inconsistency.
- Label projections clearly as **estimates**, not guarantees.

**Done when:** marking 2–3 roadmap items "complete" recalculates score using the same formula as the real score, live.

---

### Phase 10 — Testing & trust pass (3–5 hrs) — compress if short on time, don't skip entirely
- Multiple resume formats + malformed inputs (should already be partly done from Phase 2/3 — this is the *consolidation* pass).
- Small manually-reviewed evaluation set: 5–10 profiles you assess by hand, compare against system output.
- Confirm irrelevant/protected attributes (name, gender-coded info, etc.) don't influence scoring — this is an easy, high-credibility check to actually run and cite.
- Measure upload-to-profile and analysis latency — know your numbers for the demo Q&A.

**Done when:** you can state, with a straight face, "we manually checked N profiles and confirmed the ranking and gaps matched our own assessment."

---

### Phase 11 — Deploy + rehearse (3–5 hrs)
- Dockerize backend + frontend, deploy to Cloud Run, managed Postgres if available.
- Seed the **stable demo cohort** (not your dev/test data — a clean, curated one).
- Rehearse the 3-minute demo (§6) at least twice, live, on the deployed version.
- **Prepare a local fallback.** Cloud Run cold-starts and live-demo Wi-Fi are the two most common hackathon failure points — have `docker-compose up` working locally as backup.

**Done when:** the deployed URL survives two full run-throughs of the demo script without a hiccup, and you have a tested local fallback ready.

---

## 6. 3-minute demo script

| Time | Beat | Say |
|---|---|---|
| 0:00–0:25 | Problem | Students know facts about themselves but not their gaps or next action. |
| 0:25–0:55 | Upload | Gemini turns a messy resume into a structured profile — show the confirm/edit step, it proves you're not black-boxing extraction. |
| 0:55–1:20 | Rank | Score, cohort percentile, and the breakdown — name the formula out loud. |
| 1:20–1:50 | Career + gaps | Select ML Engineer; show fit % and the 2–3 critical gaps, each tied to evidence. |
| 1:50–2:20 | Coach | Ask "Why am I not ready yet?" live — the answer should reference their actual gaps. |
| 2:20–2:45 | Roadmap | Show the 3 prioritized actions, each traceable to a gap shown a moment ago. |
| 2:45–3:00 | Simulate + close | Mark actions complete, show the score move using the same formula, close on the feedback-loop framing. |

**Anticipated judge questions — have answers ready:**
- *"Where do the 87%/68% numbers come from?"* → the weighted formula in §4, stated plainly.
- *"How is this different from a keyword matcher?"* → evidence-based extraction (Gemini) + deterministic scoring (scikit-learn), not one LLM call producing a number.
- *"How do you avoid bias?"* → protected/irrelevant attributes excluded from scoring, checked in Phase 10.

---

## 7. Cut line — decide now, not under pressure

**If time runs short, cut in this order (last item cut first, i.e. protect these hardest):**

1. What-if simulator (Phase 9) — cut first. Nice, not core-loop-breaking.
2. Formal evaluation set / Precision@5 metrics (part of Phase 10) — keep the bias/protected-attribute check, drop the formal scoring metrics.
3. RandomForest experiment — was always a stretch goal; drop without hesitation.
4. Progress/recalculation persistence — can demo the simulator live once without wiring it to persist.

**Never cut:** Phase 2–8 (the full vertical slice from upload through Coach). If this chain isn't complete, you don't have a demo — you have a pile of components.

---

## 8. Directory structure (reference)

```
CareerAI/
├── README.md, .env.example, .gitignore, docker-compose.yml
├── frontend/
│   ├── src/
│   │   ├── main.tsx, App.tsx
│   │   ├── api/ (client, profileApi, rankingApi, careerApi, coachApi)
│   │   ├── components/ (layout, cards, charts, forms, coach)
│   │   ├── pages/ (Landing, Onboarding, Dashboard, Rank, Skills, Careers, Roadmap, Coach, Profile)
│   │   └── hooks/, types/, utils/
├── backend/
│   ├── requirements.txt, Dockerfile
│   └── app/
│       ├── main.py, config.py
│       ├── api/ (profiles, ranking, careers, coach, upload routes)
│       ├── models/ (schemas.py, database.py)
│       ├── services/ (document_parser, gemini_service, profile_service, feature_service,
│       │              ranking_service, career_service, gap_service, roadmap_service, coach_service)
│       └── utils/ (validation, logging)
├── ml/
│   ├── data/ (students.csv, careers.csv, student_career_labels.csv)
│   ├── notebooks/ (baseline_experiments.ipynb)
│   ├── models/ (ranking_model.joblib)  # only if RandomForest stretch goal attempted
│   └── src/ (preprocessing, features, scoring, ranking, evaluate)
├── database/ (schema.sql, seed.sql)
├── prompts/ (profile_extraction, career_analysis, skill_gap, roadmap, coach_system)
├── tests/ (parser, profile, ranking, API tests)
└── docs/ (architecture, scoring, demo_script)
```

---

## 9. API endpoints (reference)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/profiles/upload` | Upload PDF/DOCX and parse |
| POST | `/profiles` | Create form-based profile |
| GET | `/profiles/{id}` | Read profile |
| POST | `/profiles/{id}/analyze` | Run/refresh Gemini analysis |
| GET | `/ranking/{id}` | Score, percentile, rank, breakdown |
| GET | `/careers/{id}/matches` | Career matches |
| GET | `/careers/{career_id}/requirements` | Career requirements |
| GET | `/gaps/{id}` | Prioritized skill gaps |
| GET | `/roadmap/{id}` | Personalized roadmap |
| POST | `/coach/{id}/chat` | AI Coach message |
| POST | `/progress/{id}/recalculate` | Recalculate readiness |

---

## 10. Working-agent instructions (paste-ready)

If prompting a coding agent phase by phase, use something like:

> "Build Phase N only, per CareerAI_Implementation_Plan.md. Use the exact file structure and API contracts in §8/§9. Stop when the 'Done when' condition for this phase is met, show me how to verify it, and don't proceed to the next phase until I confirm."

Keep this doc in the repo root and reference it every phase — this is what stops a long agentic session from drifting off the agreed architecture.
