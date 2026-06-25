import { createFileRoute } from "@tanstack/react-router";
import { QuizBuilder } from "@/components/quiz-builder";

export const Route = createFileRoute("/teacher/new")({
  head: () => ({
    meta: [
      { title: "New quiz — InFiniLit" },
      { name: "description", content: "Create a new InFiniLit quiz from scratch." },
    ],
  }),
  component: () => <QuizBuilder />,
});