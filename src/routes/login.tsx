import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { friendlyAuthError } from "@/lib/amplify";
import { AuthShell, AuthInput, AuthButton } from "@/components/auth-ui";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — InFiniLit" },
      { name: "description", content: "Log in to your InFiniLit account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const loading = useAuth((s) => s.loading);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsConfirm(false);
    try {
      await signIn(email.trim(), password);
      router.invalidate();
      navigate({ to: "/quiz" });
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === "UserNotConfirmedException") setNeedsConfirm(true);
      setError(friendlyAuthError(err));
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to continue your financial literacy journey."
      icon={<LogIn className="h-6 w-6" strokeWidth={2.5} />}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          icon={<Mail className="h-4 w-4" />}
        />
        <AuthInput
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          icon={<Lock className="h-4 w-4" />}
        />
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
            {needsConfirm && (
              <div className="mt-1">
                <Link
                  to="/signup"
                  search={{ email }}
                  className="font-semibold underline"
                >
                  Verify your account
                </Link>
              </div>
            )}
          </div>
        )}
        <AuthButton type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log in"}
        </AuthButton>
      </form>
      <p className="mt-6 text-center text-sm text-foreground/80">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-purple-700 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}