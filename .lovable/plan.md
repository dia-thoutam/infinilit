# InFiniLit — Financial Literacy Gamification

A 3-tab web app for the InFiniLit Initiative by Dia & Joshitha. Bright, badge-driven UI inspired by the Dribbble "55 Badge Illustrations" reference — playful but focused.

## Design System

- **Palette**: Warm cream background (#FFF8EC), deep navy ink (#1A1F3A), vivid coral primary (#FF6B4A), sunshine yellow (#FFD23F), mint success (#3DD68C), sky accent (#4DA8F2), amber alert (#F59E0B).
- **Type**: Fraunces (display headings) + Plus Jakarta Sans (body). Loaded via `<link>` in `__root.tsx`.
- **Vibe**: Chunky rounded cards (2xl radius), soft drop shadows, badge-like circular icons with thick outlines, micro-animations on hover/select. No dark mode.
- All tokens in `src/styles.css` via oklch.

## Routes

```
/                       → redirect to /quiz
/quiz                   → Tab 1: Student quiz flow (5 screens, state machine)
/teacher                → Tab 2: Create / past quizzes grid + builder
/teacher/new            → Quiz builder form
/teacher/:id/edit       → Edit existing quiz
/analytics              → Tab 3: Class + individual visualisations
```

Persistent top tab bar (Quiz / Create / Analytics) on every route.

## Tab 1 — Quiz (state machine)

Single route `/quiz` driving 5 sub-screens via local state:

1. **Question screen** — top bar (session # · section · Q3/10 · timer circle), question 60%, A/B/C/D options 40%.
2. **Confidence check** — full-screen "How sure are you?" with 3 massive buttons (Sure / Unsure / Guessing). 5-second auto-advance.
3. **Reveal** — correct option brightens with check, wrong options dim. One-line explanation. Horizontal bar chart of class vote distribution (A/B/C/D). If majority wrong → amber background + "Let's talk about this" discussion prompt.
4. **Leaderboard** — yellow full-screen. Top 3 hero cards, full class table (improvement score as primary col), 4 award cards at bottom (Most Improved, Most Consistent, Fastest, Top Scorer).
5. **Progress screen** — split: left = per-section bar chart (last vs this session, muted vs bright), right = student spotlight cards (Most Improved / Most Consistent / Fastest).

XP awarded per correct answer: easy 20, medium 50, hard 100. Total XP shown on leaderboard.

Teacher device mini-mode toggle: 4 large A/B/C/D vote tap zones + Reveal / Next / Pause. Swipe-in side panel (sheet) with current question, roster, notes textarea.

## Tab 2 — Teacher Create

- Grid of past quiz cards (title, description, small badge icon with last-attempt accuracy %, XP total, date).
- "+ New Quiz" hero card.
- Builder: quiz title, description, then add questions with text, 4 answer choices, correct answer, explanation, difficulty (easy/medium/hard), section name. Save + reuse.

## Tab 3 — Analytics

- **Top metric**: "Class has improved 34% since week 1" — huge number.
- **Class accuracy by section** — % with up/down arrow vs last session.
- **Confidence calibration** — % who said "Sure" and were correct.
- **Misconception tracker** — list of questions most got wrong, frequency across sessions.
- **Individual improvement** — line chart per student, color-coded (green improving, amber plateau, red declining), with numeric table below.
- **Class improvement** — bar chart (per-student improvement %) + overall class line chart over sessions.

Charts via Recharts (already shadcn-compatible).

## Data

All local for v1: seed `src/data/seed.ts` with sample quizzes, students, session history. State via Zustand for quiz flow + localStorage for created quizzes and recorded scores. No backend until requested.

## Technical Details

- React + TanStack Router file-based routes
- Recharts for all visualisations
- Zustand for quiz-flow state machine and teacher-recorded scores
- shadcn components: Button, Card, Dialog, Sheet, Input, Textarea, Select, Tabs, Progress, Table
- All colors via semantic tokens — no hardcoded hex in components
- Custom Button variants: `coral`, `sunshine`, `mint`, `outlineBadge`

## Out of Scope (v1)

- Real auth / multi-user sync (single-device local data)
- Persistence beyond localStorage
- Real-time student device + teacher device pairing (teacher mode is a UI toggle)

I'll build all 3 tabs end-to-end in one pass with seeded sample data so everything is interactive immediately.