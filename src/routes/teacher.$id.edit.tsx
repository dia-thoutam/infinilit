import { createFileRoute, useParams, Navigate } from "@tanstack/react-router";
import { QuizBuilder } from "@/components/quiz-builder";
import { useQuizzes } from "@/store/quizzes";

export const Route = createFileRoute("/teacher/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit quiz — InFiniLit" },
      { name: "description", content: "Edit a saved InFiniLit quiz." },
    ],
  }),
  component: EditQuiz,
});

function EditQuiz() {
  const { id } = useParams({ from: "/teacher/$id/edit" });
  const quiz = useQuizzes((s) => s.quizzes.find((q) => q.id === id));
  if (!quiz) return <Navigate to="/teacher" />;
  return <QuizBuilder existing={quiz} />;
}