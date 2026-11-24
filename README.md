# FMVA Trainer v2.1

Gamified, mobile-first PWA for passing CFI's FMVA® final exam. It is plain HTML/CSS/JS with no build step and runs on GitHub Pages.

## What's inside
- **Teach-first lessons (v2.1)**: 59 plain-English concept cards with worked examples and Excel tips. Each lesson introduces the next concept before quizzing on it, and never tests what it hasn't taught. Every question has a 💡 Teach me button, and 79 jargon terms are tappable for a quick definition (turned off in mock exams). There is also a new Finance Basics starter unit.
- **Learning path** of 16 units mapped to the 15 FMVA core courses (2026 curriculum), plus an Excel toolkit unit. There are 4 sections, checkpoint case studies, and a final mock.
- **120 conceptual questions** with plausible wrong answers and explanations.
- **37 calculation generators** covering CAPM, WACC, beta, FCFF/FCFE, terminal value (Gordon, exit, implied g), mid-year discounting, the EV bridge, comps, precedents, calendarization, NWC, the debt and PP&E schedules, CFO, DuPont, CCC, CAGR, break-even, the Excel NPV trap, PMT, CHOOSE scenarios and sensitivity. Every question uses fresh numbers and an answer computed in code. Wrong options come from common mistakes.
- **4 Excel case studies** in `cases/`: a 3-statement build, a DCF, trading comps, and a model audit with planted errors. Each has a task workbook and a solution workbook, and the answer keys were verified by recalculating the files in a spreadsheet engine.
- **Mock exams**: full (50 questions, 3:00:00, includes 1 Excel case) and mini (20 questions, 1:12:00). They have a navigator, flag-for-review and per-unit results, and they survive closing the app.
- **Gamification**: XP, ranks (Intern → Partner), a daily goal ring, streaks with streak freezes, combos, ★1–5 unit levels, Legendary challenges, 16 badges, confetti, sound and haptics.
- **Learning engine**: Leitner spaced repetition (0/1/3/7/16/35 days), wrong answers re-queued within a lesson, adaptive smart practice weighted to your weakest units, and an exam-readiness score.
- **Notes + formula sheet** for every unit, plus a built-in calculator.
- **Beta feedback**: 🚩 flag any question, then Profile → *Copy feedback* to paste it back for fixes.

## Deploying over v1 (GitHub Pages)
1. In your repo, **delete the old `app.js`** and replace everything else with the contents of this folder (`index.html`, `sw.js`, `manifest.webmanifest`, `css/`, `js/`, `icons/`, `cases/`).
2. Commit and push. Pages redeploys in about a minute.
3. On your phone, open the app once while online, then close and reopen it. The new service worker deletes v1's stuck cache.
   If it still shows v1, remove the home-screen icon and add it again from Safari (Share → Add to Home Screen).

v1 progress isn't carried over (v1 only had 30 questions). From now on, use Profile → Backup → Export before changing phones.

## Releasing updates
Bump `VERSION` in `sw.js` and the `?v=` query strings in `index.html`/`sw.js`. Installed apps pick up the change on the next launch.

## Content note
Exam format comes from CFI's public FMVA Final Exam overview, and topics follow the 2026 core course list. All questions, notes and cases are original, and the companies are fictional. This app does not reproduce CFI course material or exam questions and is not affiliated with CFI. FMVA® is a trademark of CFI.
