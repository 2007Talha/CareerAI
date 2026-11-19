# CareerAI — File-by-File Manual Build Plan
### For coding it yourself with AI as a pair-programmer/tutor, not an autonomous agent

> **How this differs from vibe coding:** you write or actively rewrite every file yourself. AI's job per file is: explain the concept, review your draft, catch bugs, suggest the idiomatic pattern — never "here's the whole file, paste it in." If you paste in a fully AI-generated file without reading every line, you've slipped back into vibe coding. The checkpoint at the end of each file is: **could you explain this file to someone else without looking at it?**

---

## 0. How to use AI well in this mode

For each file below, use AI in this order, not this one:

1. **Before writing:** ask AI to explain the concept/pattern in isolation ("explain how Pydantic validators work with an example unrelated to my project"). Don't ask it to write your file yet.
2. **Write a first draft yourself.** Even a bad, incomplete one. This is what makes the difference between learning and copying.
3. **Ask AI to review your draft**, not replace it: "here's my attempt at X, what's wrong, what's the idiomatic way to do Y, what edge case am I missing." This produces feedback, not a replacement file.
4. **Ask AI to explain any error message** you get, in terms of your specific code, before asking it to fix it.
5. **Only ask for a full code sample** when you're stuck after a genuine attempt — and then still retype it yourself rather than paste, so it passes through your hands once.

Keep a running `NOTES.md` where after each file you write 2–3 sentences on what you learned. This is what actually builds the skill; skip it and you're vibe coding with extra steps.

---

## 1. Suggested pace

This is a learning-oriented build, so it will run slower than the agent-driven plan — budget accordingly:

- **Solo, evenings/weekends:** 3–5 weeks for the full vertical slice (Sections 3–9 below).
- **Hackathon with a hard deadline:** you likely can't hand-code all of this in the time available. Either (a) scope down hard to 3–4 careers and skip Sections 10–11 entirely, or (b) hand-code the core services (Sections 5–7, where the actual learning value is) and let AI generate the more mechanical, lower-learning-value files (basic CRUD routes, boilerplate React pages) — but say so honestly if asked, rather than presenting agent-written code as your own understanding.

---

## 2. Order of files, and why this order

Files are ordered so each one only depends on files you've already built and understood — you should never be writing a file that calls into something you haven't seen work yet.

```
1. Data & schema files       → nothing to call, pure definition, good starting point
2. Backend skeleton          → depends on schema existing
3. Document parsing          → depends on skeleton (needs an endpoint to attach to)
4. Gemini extraction         → depends on parsing (needs raw text as input)
5. Scoring engine            → depends on extraction (needs a structured profile as input)
6. Career fit + gaps         → depends on scoring (reuses the same formula)
7. Roadmap + Coach           → depends on gaps (roadmap needs gaps; coach needs everything)
8. Frontend, page by page    → depends on backend endpoints existing to call
9. Simulator                 → depends on scoring + roadmap both working
10. Tests                    → written alongside each file above, not after
11. Deploy                   → last
```

---

## 3. Section A — Data & schema (write these first, no dependencies)

### `database/schema.sql`
**What it must contain:** tables for `students`, `student_skills`, `projects`, `experiences`, `careers`, `career_skills`, `student_scores`, `skill_gaps`, `roadmaps`, `coach_messages`.

**Write it yourself first by:** sketching the tables on paper — what does a "student" need to know about itself, what does a "career" need? Then translate to SQL.

**Good AI use:** "I have these two tables, should `student_skills` store the skill name directly or a foreign key to a `skills` table? What are the tradeoffs?" — a normalization question, not "write my schema."

**Checkpoint:** you can explain why `career_skills` is a join table and not a column on `careers`.

---

### `ml/data/careers.csv`
**What it must contain:** `career_id, career_name, required_skills, important_skills, optional_skills, skill_weights, target_levels` for your 4–6 chosen careers.

**Write it yourself first by:** picking 4–6 careers, then for each one listing 6–10 real skills from job postings you actually look at (search "ML Engineer job description" and read 2–3 real ones — don't invent this from memory).

**Good AI use:** "I found these 3 real ML Engineer job postings, help me identify which requirements are must-have vs nice-to-have" — you're using AI to help synthesize evidence you gathered, not to invent the evidence.

**Checkpoint:** you can name the actual job postings your requirements came from, if asked in the demo.

---

### `ml/data/students.csv` (seed/demo cohort)
**What it must contain:** 30–100 synthetic students with a genuine spread of skill/experience levels across all 6 careers.

**Write it yourself first by:** writing a small Python script that generates students with randomized-but-plausible skill distributions (not all identical, not all maxed out).

**Good AI use:** "review my generation script — does this actually produce a spread, or will most students cluster near the same score?" This is a real statistics question worth understanding, not just generating.

**Checkpoint:** you can plot a histogram of scores across your seed data and it isn't a single spike.

---

## 4. Section B — Backend skeleton

### `backend/app/main.py`
**What it must contain:** FastAPI app instance, CORS middleware, route registration, startup DB connection check.

**Write it yourself first by:** starting from FastAPI's own quickstart docs, not an AI-generated file — this file is genuinely simple and reading the official docs once will teach you more than asking AI to write it.

**Checkpoint:** you can explain what each middleware line does.

### `backend/app/models/database.py`
**What it must contain:** SQLAlchemy (or asyncpg) engine, session factory, dependency-injected `get_db()`.

**Good AI use:** "explain dependency injection in FastAPI with `Depends()` — why not just import a global session?" This is a concept worth actually understanding since you'll use `Depends()` everywhere.

### `backend/app/models/schemas.py`
**What it must contain:** Pydantic models for every request/response shape — `StudentProfile`, `CareerFit`, `ScoreBreakdown`, `Gap`, `RoadmapItem`, `CoachMessage`.

**Write it yourself first by:** for each API endpoint you'll eventually build (see §9 list), write down on paper what JSON goes in and out, *then* turn that into Pydantic classes.

**Good AI use:** "I want this field to be optional but validated if present — what's the Pydantic pattern?" Specific validation questions, not "write my schemas."

**Checkpoint:** `/health` endpoint returns 200 and you understand every import in this file.

---

## 5. Section C — Document parsing

### `backend/app/services/document_parser.py`
**What it must contain:** functions to extract raw text from PDF (PyMuPDF) and DOCX (python-docx), with file-type/size validation and error handling for corrupt files.

**Write it yourself first by:** getting PyMuPDF to print raw text from one real resume PDF in a throwaway script before you touch FastAPI at all. Isolate the hard part before wiring it into the app.

**Good AI use:** "PyMuPDF is returning garbled text on this table-based resume, what are common causes and how do people usually handle multi-column PDFs?" — a targeted debugging question with your actual error attached.

**Checkpoint:** you've personally seen this fail on a bad file and handled the exception, not just wrapped everything in a blind `try/except: pass`.

---

## 6. Section D — Gemini extraction (highest learning value, don't skip the manual pass here)

### `prompts/profile_extraction.txt`
**What it must contain:** a prompt that instructs Gemini to return strict JSON matching your `StudentProfile` schema, with explicit instructions not to invent information not present in the resume.

**Write it yourself first by:** drafting the prompt, running it against 2–3 real resumes manually (via API playground or a simple script), and reading the raw output before any Pydantic validation exists.

**Good AI use:** "my prompt sometimes returns markdown code fences around the JSON, how do people usually get around this reliably?" — again, your actual output pasted in, not a request to write the prompt from scratch.

**Checkpoint:** you can point to a specific instruction in your prompt and explain why you added it (e.g. "this line stops it from listing 'Python' as a skill when the resume never actually mentions it").

### `backend/app/services/gemini_service.py`
**What it must contain:** single wrapper function that calls Gemini, validates the response against your Pydantic schema, retries once on validation failure with an error-correction follow-up, and raises a clear error if it fails twice.

**Write it yourself first by:** writing the happy path first (valid response → validated object), then deliberately feeding it a broken response to write the failure path.

**Checkpoint:** you've watched this fail on purpose (feed it garbage) and confirmed it degrades gracefully instead of crashing the request.

---

## 7. Section E — Scoring, gaps, roadmap (the actual "intelligence" — worth understanding deeply)

### `ml/src/scoring.py`
**What it must contain:** the weighted formula —
```
score = 0.25×technical_skills + 0.25×projects + 0.20×academics
      + 0.10×experience + 0.10×assessments + 0.10×achievements
```
— implemented as a pure function that takes a normalized profile dict and returns a score + breakdown of each sub-score's contribution.

**Write it yourself first by:** implementing this with plain Python and no libraries first, on 2–3 profiles you construct by hand, and checking the output matches your own mental math.

**Good AI use:** "review this function — is it actually deterministic, will floating point ever bite me here?" A correctness question about code you wrote.

**Checkpoint:** you can compute a student's score by hand on paper and get the same number your function does.

### `ml/src/ranking.py`
**What it must contain:** `StandardScaler` normalization and percentile/rank calculation against the seeded cohort.

**Good AI use:** "explain what StandardScaler actually does to my data, in terms of my specific score distribution" — ask it to reason about *your* numbers, not write the code.

**Checkpoint:** you understand why you normalize before ranking (so different sub-score scales don't distort percentile) — this is a real stats concept worth internalizing.

### `backend/app/services/gap_service.py`
**What it must contain:** compares `current_level` vs `target_level` per skill for a given career, classifies critical/developing/strong, computes `priority = importance × gap_size`, returns top 3–5.

**Write it yourself first by:** doing this calculation by hand for one student against one career before writing the loop that does it for all skills.

**Checkpoint:** you can explain why priority multiplies importance and gap size rather than adding them (a small gap in a high-importance skill should outrank a huge gap in a low-importance one).

### `backend/app/services/roadmap_service.py`
**What it must contain:** converts each top gap into one specific, concrete action (not "learn X" — "build and deploy one ML API using Docker").

**Good AI use:** "here are my 3 gaps and my attempted roadmap items, are these actually concrete enough, or still too vague?" — a review question.

---

## 8. Section F — Coach

### `prompts/coach_system.txt` + `backend/app/services/coach_service.py`
**What it must contain:** assembles full context (profile + score breakdown + career fit + gaps + roadmap) into a system prompt, calls Gemini, and instructs it to separate facts from suggestions and avoid guaranteeing outcomes.

**Write it yourself first by:** drafting the system prompt and testing it manually with the exact question you'll ask in your demo — "why am I not ready yet?" — before wiring it into an endpoint.

**Checkpoint:** you've caught the coach saying something ungrounded or generic at least once, and fixed the prompt to stop it.

---

## 9. Section G — Frontend, page by page

Build and manually verify each page before starting the next. For each page:

1. Write the component with hardcoded/mocked data first — get the layout right without worrying about the API.
2. Wire it to the real backend endpoint second, once the endpoint exists.
3. Add loading/empty/error states last, and test all three by hand (unplug network, request a nonexistent student ID, request an empty profile).

Order: `Landing → Onboarding → Dashboard → Rank → Skills → Careers → Roadmap → Coach → Profile`.

**Good AI use throughout:** "review my component for accessibility/state management issues," "explain why my useEffect is running twice" — debugging and review, not generation.

**Checkpoint per page:** you can resize the browser and explain what breaks and why, because you wrote the CSS/layout yourself.

---

## 10. Section H — Simulator

### Recalculation endpoint + UI
**What it must contain:** marking roadmap items complete re-runs the *exact same* `scoring.py` function from Section E with updated inputs — never a hardcoded score jump.

**Checkpoint:** you can trace, line by line, how marking an item complete changes an input to `scoring.py` and produces a new number.

---

## 11. Section I — Tests (write alongside, not after)

For each service file in Sections C–G, before moving to the next file, write at minimum:
- One test with clean/expected input.
- One test with malformed input (empty resume, missing fields, Gemini returning invalid JSON).
- One test with an edge case you personally worry about (e.g. a student with zero projects — does the score break or just go low?).

**Good AI use:** "what edge cases am I likely missing for this function?" — a checklist prompt, then you write the actual test cases.

---

## 12. Section J — Deploy

Docker + Cloud Run, done last, per the original plan. This is the one section where full AI generation of boilerplate (Dockerfile, cloudbuild config) is reasonable — it's infrastructure config, not the logic you're trying to learn, as long as you read through it and understand what each line does before running it.

---

## 13. Weekly checkpoint questions (ask yourself, honestly)

At the end of each week, before moving on:
- Which files this week could I rewrite from scratch without looking, if I had to?
- Which files did I mostly transcribe from AI output without a real first attempt of my own?

Any file that falls in the second bucket is worth a 20-minute redo pass — go back, close the AI chat, and try to reconstruct it from memory plus your own reasoning. That's the actual skill-building step this mode is for.
