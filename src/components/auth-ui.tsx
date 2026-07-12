import type { ReactNode, InputHTMLAttributes, ButtonHTMLAttributes } from "react";
import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { HexBadge } from "@/components/hex-badge";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-100 via-amber-50 to-purple-200 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/quiz" className="mb-6 flex items-center justify-center gap-2">
          <HexBadge tone="sunshine" size={40}>
            <Trophy strokeWidth={3} />
          </HexBadge>
          <span className="font-display text-xl font-bold text-purple-900">InFiniLit</span>
        </Link>
        <div className="rounded-3xl border border-purple-200 bg-white/90 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            {icon && (
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-md">
                {icon}
              </div>
            )}
            <div>
              <h1 className="font-display text-2xl font-bold text-purple-950">{title}</h1>
              {subtitle && <p className="text-sm text-foreground/80">{subtitle}</p>}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: ReactNode;
};

export function AuthInput({ label, icon, className, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-purple-950">{label}</span>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={cn(
            "w-full rounded-xl border border-purple-200 bg-white px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-300",
            icon && "pl-9",
            className,
          )}
        />
      </div>
    </label>
  );
}

export function AuthButton({
  className,
  variant = "primary",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "amber" | "ghost" }) {
  const variants = {
    primary:
      "bg-gradient-to-br from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900",
    amber:
      "bg-gradient-to-br from-amber-400 to-amber-500 text-purple-950 hover:from-amber-500 hover:to-amber-600",
    ghost: "bg-transparent text-purple-800 hover:bg-purple-100",
  } as const;
  return (
    <button
      {...props}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}