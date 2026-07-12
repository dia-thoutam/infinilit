import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { UserPlus, Mail, Lock, KeyRound, Loader2 } from "lucide-react";
import { useAuth } from "@/store/auth";
import { friendlyAuthError } from "@/lib/amplify";
import { AuthShell, AuthInput, AuthButton } from "@/components/auth-ui";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign up — InFiniLit" },
      { name: "description", content: "Create your InFiniLit account." },
    ],
  }),
  component: SignupPage,
});

type Stage = "register" | "confirm" | "done";

function SignupPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { signUp, confirmSignUp, resendCode, signIn, loading } = useAuth();
  const [stage, setStage] = useState<Stage>("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password);
      if (needsConfirmation) {
        setStage("confirm");
        setInfo(`We sent a verification code to ${email}.`);
      } else {
        await signIn(email.trim(), password);
        router.invalidate();
        navigate({ to: "/quiz" });
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  async function onConfirm(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    try {
      await confirmSignUp(email.trim(), code.trim());
      if (password) {
        await signIn(email.trim(), password);
        router.invalidate();
        navigate({ to: "/quiz" });
      } else {
        setStage("done");
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  async function onResend() {
    setError(null);
    setInfo(null);
    try {
      await resendCode(email.trim());
      setInfo("A new code has been sent.");
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  if (stage === "confirm") {
    return (
      <AuthShell
        title="Verify your email"
        subtitle="Enter the 6-digit code we sent you."
        icon={<KeyRound className="h-6 w-6" strokeWidth={2.5} />}
      >
        <form onSubmit={onConfirm} className="space-y-4">
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            icon={<Mail className="h-4 w-4" />}
          />
          <AuthInput
            label="Confirmation code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          {info && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {info}
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </div>
          )}
          <AuthButton type="submit" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm & continue"}
          </AuthButton>
          <AuthButton type="button" variant="ghost" onClick={onResend}>
            Resend code
          </AuthButton>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start learning financial literacy the fun way."
      icon={<UserPlus className="h-6 w-6" strokeWidth={2.5} />}
    >
      <form onSubmit={onRegister} className="space-y-4">
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          icon={<Lock className="h-4 w-4" />}
        />
        <p className="text-xs text-foreground/70">
          Min 8 characters, including upper, lower and a number.
        </p>
        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}
        <AuthButton type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
        </AuthButton>
        <AuthButton
          type="button"
          variant="ghost"
          onClick={() => setStage("confirm")}
        >
          I already have a code
        </AuthButton>
      </form>
      <p className="mt-6 text-center text-sm text-foreground/80">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-purple-700 hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}