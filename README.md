# InFiniLit 

An interactive, gamified financial literacy quiz platform built for classroom use — designed to run on a single projector with no student devices required, making it accessible to under-resourced schools.

## What It Does

InFiniLit helps teachers deliver engaging financial literacy lessons through live quiz sessions projected to the class, with the teacher tapping student responses in real time. The platform features improvement-based leaderboards that reward growth over raw scores, speed and accuracy awards, myth-busting modules that challenge common financial misconceptions, confidence tracking to identify where students are uncertain versus guessing, and class analytics showing per-student growth, section accuracy, and confidence calibration over time.

## Who It's For

Built for the Financial Literacy Program Initiative co-founded to serve 210+ underprivileged students (grades 5–8) across schools in Hyderabad, India — delivered in three languages (Hindi, Telugu, English) to maximise accessibility.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TanStack Start |
| Hosting | Lovable |
| Authentication | AWS Cognito (JWT, user pools, group-based access control) |
| API | AWS API Gateway (REST API, Cognito authorizer) |
| Backend | AWS Lambda (Node.js 22, serverless, arm64) |
| Database | AWS DynamoDB (on-demand capacity, 4 tables) |
| AI Assistant | Claude API (financial literacy coach with age-appropriate guardrails) |

## Architecture

Every route is protected by a Cognito JWT authorizer. Answer keys never reach the browser — grading happens server-side in Lambda. DynamoDB queries are ownership-enforced so teachers can only ever access their own data. Improvement scores are computed dynamically from session history rather than stored separately, avoiding stale data.

## AWS Infrastructure

- **4 DynamoDB tables:** InFiniLit-Quizzes, InFiniLit-Classrooms, InFiniLit-Sessions, InFiniLit-Users
- **13 Lambda functions** covering quiz CRUD, classroom management, session recording, analytics, server-side grading, user profiles, data reset, AI coach, and a Cognito post-confirmation trigger
- **1 shared IAM role** (InFiniLit-Lambda-Role) following least-privilege principles
- **Cognito user pool** with Teacher and Admin groups, auto-assigned on signup via Lambda trigger
- **REST API Gateway** with a Cognito authorizer protecting all routes

## Features

- Live classroom quiz sessions (teacher-projected, single device)
- Improvement-based leaderboard with deterministic tie-breaking
- Server-side answer grading (prevents cheating via devtools)
- Per-student accuracy, XP, and confidence tracking
- Section-level analytics (Budgeting, Credit, Investing, etc.)
- Confidence calibration reports
- PIN-verified data reset panel
- AI-powered financial literacy teaching assistant with age-appropriate guardrails
- Role-based access control (Teacher / Admin)
- Audit logging of roster IDs powering each session result

## Features In Progress

- Full Lambda + DynamoDB backend replacing localStorage
- Frontend store migration from localStorage to API calls
- Real-time analytics powered by live session data
- AI Coach chat interface

## Project Structure

src/ contains components (reusable UI including quiz builder, auth shell, reset panel), routes (pages for quiz, analytics, teacher dashboard, login, signup), store (Zustand stores for auth, quizzes, classrooms), lib (Amplify config, API client), data (quiz content, seed data, XP logic), and hooks (custom React hooks).

## Local Development

Run bun install then bun run dev. Requires a .env file with VITE_COGNITO_REGION, VITE_COGNITO_USER_POOL_ID, VITE_COGNITO_USER_POOL_CLIENT_ID, and VITE_API_URL.

## Developer

Built by Dia Thoutam — Grade 12 IB Diploma student, AI/ML research intern at Pharmint (breast cancer survival prediction using TCGA-BRCA transcriptomic data), software engineering intern at Service Oriented Solutions LLC, and co-founder of financial literacy and cybersafety education initiatives serving 600+ students and senior citizens across Hyderabad, India.
