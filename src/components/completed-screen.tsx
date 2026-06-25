import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Course / quiz completed celebration screen.
 * Purple gradient, large medal badge with star + ribbons, XP pill, "Great!" CTA.
 */
export function CompletedScreen({
  xp,
  accuracy,
  quizTitle,
  onContinue,
}: {
  xp: number;
  accuracy: number;
  quizTitle: string;
  onContinue: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Confetti dot positions (stable, deterministic)
  const dots = [
    { x: 12, y: 22, c: "bg-sunshine", s: 10 },
    { x: 86, y: 18, c: "bg-mint", s: 12 },
    { x: 22, y: 60, c: "bg-coral", s: 8 },
    { x: 78, y: 64, c: "bg-sky", s: 10 },
    { x: 50, y: 14, c: "bg-mint", s: 7 },
    { x: 8, y: 42, c: "bg-coral", s: 9 },
    { x: 92, y: 44, c: "bg-sunshine", s: 9 },
    { x: 35, y: 72, c: "bg-sky", s: 8 },
    { x: 65, y: 70, c: "bg-coral", s: 10 },
    { x: 18, y: 8, c: "bg-mint", s: 7 },
    { x: 82, y: 8, c: "bg-coral", s: 8 },
    { x: 48, y: 78, c: "bg-sunshine", s: 8 },
  ];

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at 50% 35%, var(--celebration-from) 0%, var(--celebration-to) 70%)",
        backgroundColor: "var(--celebration-to)",
      }}
    >
      {/* Confetti dots */}
      <div className="pointer-events-none absolute inset-0">
        {dots.map((d, i) => (
          <span
            key={i}
            className={cn("absolute rounded-full opacity-90 blur-[0.5px]", d.c)}
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: d.s,
              height: d.s,
              transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.4)",
              opacity: mounted ? 0.9 : 0,
              transition: `transform 700ms cubic-bezier(.2,.8,.2,1) ${i * 50}ms, opacity 500ms ${i * 50}ms`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col items-center justify-between px-6 py-12 text-center">
        <div className="space-y-2 pt-6">
          <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
            Congrats!
          </h1>
          <h2 className="font-display text-2xl font-semibold leading-tight opacity-95 sm:text-3xl">
            The {quizTitle ? "set" : "course"} is completed!
          </h2>
          {quizTitle && (
            <p className="pt-1 text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              {quizTitle} · {accuracy}% correct
            </p>
          )}
        </div>

        {/* Medal */}
        <div
          className={cn(
            "relative my-8 transition-all duration-700",
            mounted ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        >
          {/* Glow */}
          <div className="absolute inset-0 -z-10 rounded-full bg-white/20 blur-3xl" />
          {/* Ribbons */}
          <svg viewBox="0 0 200 240" width="220" height="260" className="drop-shadow-[0_18px_30px_rgba(0,0,0,0.35)]">
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE27A" />
                <stop offset="55%" stopColor="#FFC83D" />
                <stop offset="100%" stopColor="#E89B16" />
              </linearGradient>
              <linearGradient id="ribbon" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9B7BFF" />
                <stop offset="100%" stopColor="#6B4BE0" />
              </linearGradient>
              <linearGradient id="ribbonDark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7A5BE6" />
                <stop offset="100%" stopColor="#4A2FB8" />
              </linearGradient>
            </defs>
            {/* Ribbon left */}
            <path d="M65 130 L40 230 L70 210 L85 175 Z" fill="url(#ribbon)" />
            <path d="M65 130 L55 175 L85 175 Z" fill="url(#ribbonDark)" opacity="0.7" />
            {/* Ribbon right */}
            <path d="M135 130 L160 230 L130 210 L115 175 Z" fill="url(#ribbon)" />
            <path d="M135 130 L145 175 L115 175 Z" fill="url(#ribbonDark)" opacity="0.7" />
            {/* Medal coin */}
            <circle cx="100" cy="100" r="78" fill="url(#gold)" />
            <circle cx="100" cy="100" r="78" fill="none" stroke="#B87410" strokeWidth="4" opacity="0.5" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="#FFFFFF" strokeWidth="3" opacity="0.45" />
            {/* Star */}
            <g transform="translate(100 102)">
              <polygon
                points="0,-42 12,-13 43,-13 18,5 28,34 0,17 -28,34 -18,5 -43,-13 -12,-13"
                fill="#FFE27A"
                stroke="#B87410"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        <div className="flex w-full flex-col items-center gap-6">
          <div className="space-y-3">
            <p className="text-base font-medium text-white/85">
              You've put in a lot of effort<br />and earned
            </p>
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#FFC83D] to-[#E89B16] px-6 py-2.5 text-lg font-extrabold text-[#3A1F00] shadow-[0_6px_0_rgba(0,0,0,0.18)] transition-all duration-500",
                mounted ? "scale-100 opacity-100" : "scale-75 opacity-0",
              )}
              style={{ transitionDelay: "350ms" }}
            >
              <Star className="h-4 w-4 fill-current" strokeWidth={0} />
              +{xp} XP
            </div>
          </div>

          <Button
            onClick={onContinue}
            className="h-14 w-full rounded-2xl bg-white text-base font-bold text-[color:var(--celebration-to)] shadow-[0_8px_0_rgba(0,0,0,0.18)] hover:bg-white/95 hover:translate-y-[-1px] active:translate-y-[1px]"
          >
            Great!
          </Button>
        </div>
      </div>
    </div>
  );
}