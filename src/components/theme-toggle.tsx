import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const STORAGE_KEY = "infinilit-theme";

function applyTheme(theme: "light" | "dark") {
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY)) as
      | "light"
      | "dark"
      | null;
    const initial = stored ?? "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  };

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dim mode"}
      title={isDark ? "Switch to light mode" : "Switch to dim mode"}
      className="section-pill inline-flex h-10 w-10 items-center justify-center text-foreground transition-transform"
      style={{
        background: isDark
          ? "linear-gradient(180deg, #514063 0%, #2f243f 100%)"
          : "linear-gradient(180deg, #ffe07a 0%, #ffc93a 55%, #f5a90b 100%)",
      }}
    >
      {isDark ? (
        <Moon className="h-4 w-4 text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.4)]" strokeWidth={3} />
      ) : (
        <Sun className="h-4 w-4 text-foreground drop-shadow-[0_1px_0_rgba(255,255,255,0.6)]" strokeWidth={3} />
      )}
    </button>
  );
}