export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: string;
  text: string;
  choices: [string, string, string, string];
  correct: 0 | 1 | 2 | 3;
  explanation: string;
  misconception?: string;
  difficulty: Difficulty;
  section: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
  lastAttempt?: { date: string; accuracy: number; xp: number };
}

export const xpFor = (d: Difficulty) => (d === "hard" ? 100 : d === "medium" ? 50 : 20);

export const seedQuizzes: Quiz[] = [];
const _archivedSeedQuizzes: Quiz[] = [
  {
    id: "q-budget-basics",
    title: "Budget Basics",
    description: "Needs vs wants, the 50/30/20 rule, and why your future self will thank you.",
    createdAt: "2026-05-12",
    lastAttempt: { date: "2026-06-18", accuracy: 78, xp: 1240 },
    questions: [
      {
        id: "q1",
        text: "Under the 50/30/20 rule, what does the 20% go toward?",
        choices: ["Wants", "Needs", "Savings & debt repayment", "Taxes"],
        correct: 2,
        explanation: "The 20% slice is dedicated to savings and paying down debt — the part that builds your future.",
        misconception: "Many think 20% is taxes — taxes come out before you even apply the rule.",
        difficulty: "easy",
        section: "Budgeting",
      },
      {
        id: "q2",
        text: "Which of these is a 'need' rather than a 'want'?",
        choices: ["Streaming subscription", "Rent", "Concert tickets", "New sneakers"],
        correct: 1,
        explanation: "Rent is a need — it keeps a roof over your head. Streaming, concerts, and sneakers are wants.",
        difficulty: "easy",
        section: "Budgeting",
      },
      {
        id: "q3",
        text: "Your monthly take-home is $2,000. What's your max 'wants' budget?",
        choices: ["$200", "$400", "$600", "$1,000"],
        correct: 2,
        explanation: "30% of $2,000 is $600 for wants.",
        difficulty: "medium",
        section: "Budgeting",
      },
      {
        id: "q4",
        text: "Inflation is 4% and your savings earns 1%. What's your real return?",
        choices: ["+5%", "+3%", "-3%", "0%"],
        correct: 2,
        explanation: "Real return = nominal − inflation = 1% − 4% = −3%. You're losing purchasing power.",
        misconception: "A positive nominal return can still lose money in real terms when inflation outpaces it.",
        difficulty: "hard",
        section: "Inflation",
      },
      {
        id: "q5",
        text: "Compound interest grows fastest when…",
        choices: ["You start late but invest more", "You start early and let time do the work", "You withdraw often", "Rates stay below 1%"],
        correct: 1,
        explanation: "Time is the single biggest lever in compounding. Starting early beats investing more later.",
        difficulty: "medium",
        section: "Investing",
      },
    ],
  },
  {
    id: "q-credit-101",
    title: "Credit 101",
    description: "Cards, scores, and the silent cost of carrying a balance.",
    createdAt: "2026-05-28",
    lastAttempt: { date: "2026-06-20", accuracy: 64, xp: 980 },
    questions: [
      {
        id: "c1",
        text: "Which factor weighs MOST in your FICO credit score?",
        choices: ["New credit", "Payment history", "Credit mix", "Length of history"],
        correct: 1,
        explanation: "Payment history is ~35% of your FICO score — the single largest factor.",
        difficulty: "medium",
        section: "Credit",
      },
      {
        id: "c2",
        text: "Carrying a $1,000 balance at 24% APR for a year costs about…",
        choices: ["$24", "$120", "$240", "$1,240"],
        correct: 2,
        explanation: "24% of $1,000 ≈ $240 in interest if unpaid for a year.",
        misconception: "APR isn't a one-time fee — it accrues every month you carry the balance.",
        difficulty: "hard",
        section: "Credit",
      },
      {
        id: "c3",
        text: "A good credit utilization ratio is…",
        choices: ["Below 30%", "Around 50%", "Above 70%", "100%"],
        correct: 0,
        explanation: "Below 30% is the rule of thumb — lower is better.",
        difficulty: "easy",
        section: "Credit",
      },
    ],
  },
  {
    id: "q-invest-intro",
    title: "Investing Intro",
    description: "Stocks, bonds, index funds — and why diversification matters.",
    createdAt: "2026-06-05",
    lastAttempt: { date: "2026-06-22", accuracy: 82, xp: 1560 },
    questions: [
      {
        id: "i1",
        text: "An index fund holds…",
        choices: ["One stock", "A basket tracking a market index", "Only bonds", "Cash"],
        correct: 1,
        explanation: "An index fund holds a broad basket designed to mirror a market index like the S&P 500.",
        difficulty: "easy",
        section: "Investing",
      },
      {
        id: "i2",
        text: "Diversification reduces…",
        choices: ["Returns", "Specific (idiosyncratic) risk", "Inflation", "Taxes"],
        correct: 1,
        explanation: "Diversification cuts company-specific risk; broad market risk remains.",
        difficulty: "hard",
        section: "Investing",
      },
    ],
  },
];

export const seedStudents: string[] = [];

// sessions x students improvement points (0-100)
export const seedSessionScores: { session: number; date: string; scores: Record<string, number> }[] = [];

export const seedSectionAccuracy: { section: string; last: number; current: number }[] = [];

// per-question class vote distribution (mock)
export const mockVoteDistribution = (correct: number) => {
  const arr = [0, 0, 0, 0];
  arr[correct] = 14 + Math.floor(Math.random() * 6);
  for (let i = 0; i < 4; i++) if (i !== correct) arr[i] = 1 + Math.floor(Math.random() * 6);
  return arr as [number, number, number, number];
};