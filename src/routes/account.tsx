import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Loader2, ShieldAlert, ArrowLeft } from "lucide-react";
import { useAuth } from "@/store/auth";
import { friendlyAuthError } from "@/lib/amplify";
import { AuthShell, AuthButton, AuthInput } from "@/components/auth-ui";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — InFiniLit" },
      { name: "description", content: "Manage your InFiniLit account." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const deleteAccount = useAuth((s) => s.deleteAccount);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  async function onDelete() {
    setError(null);
    try {
      await deleteAccount();
      navigate({ to: "/signup" });
    } catch (err) {
      setError(friendlyAuthError(err));
    }
  }

  return (
    <AuthShell
      title="Your account"
      subtitle={user?.email ?? "Not signed in"}
      icon={<ShieldAlert className="h-6 w-6" strokeWidth={2.5} />}
    >
      <div className="space-y-6">
        <Link
          to="/quiz"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to app
        </Link>

        <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-red-900">
            <Trash2 className="h-5 w-5" /> Delete profile
          </h2>
          <p className="mt-1 text-sm text-red-900/80">
            This permanently deletes your Cognito account. You'll be signed out and cannot recover it.
          </p>

          {!asking ? (
            <AuthButton
              type="button"
              variant="primary"
              onClick={() => setAsking(true)}
              className="mt-4 !bg-gradient-to-br !from-red-600 !to-red-800 hover:!from-red-700 hover:!to-red-900"
            >
              <Trash2 className="h-4 w-4" /> Delete my profile
            </AuthButton>
          ) : (
            <div className="mt-4 space-y-3">
              <AuthInput
                label='Type "DELETE" to confirm'
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="DELETE"
              />
              {error && (
                <div className="rounded-xl border border-red-300 bg-white px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                <AuthButton
                  type="button"
                  onClick={onDelete}
                  disabled={loading || confirm !== "DELETE"}
                  className="!bg-gradient-to-br !from-red-600 !to-red-800 hover:!from-red-700 hover:!to-red-900"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm delete"}
                </AuthButton>
                <AuthButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAsking(false);
                    setConfirm("");
                    setError(null);
                  }}
                >
                  Cancel
                </AuthButton>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthShell>
  );
}