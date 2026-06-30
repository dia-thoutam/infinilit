import { Zap, Sparkles, Flame, Star, Crown, Rocket } from "lucide-react";
import { HexBadge } from "@/components/hex-badge";
import { cn } from "@/lib/utils";

/**
 * XP badge set. Each tier is a hex badge with its own tone + icon and a
 * matching label. Use <XpBadge tier="silver" /> or render the whole set with
 * <XpBadgeSet />. Tiers map to cumulative XP thresholds.
 */

export type XpTier =
  | "spark"
  | "bronze"
  | "silver"
  | "gold"
  | "platinum"
  | "legend";

type TierConfig = {
  label: string;
  threshold: number;
  tone: "coral" | "sunshine" | "mint" | "sky" | "violet";
  Icon: React.ComponentType<{ className?: string }>;
};

export const XP_TIERS: Record<XpTier, TierConfig> = {
  spark: { label: "Spark", threshold: 0, tone: "coral", Icon: Sparkles },
  bronze: { label: "Kindling", threshold: 200, tone: "coral", Icon: Flame },
  silver: { label: "Rising", threshold: 600, tone: "sky", Icon: Zap },
  gold: { label: "Brilliant", threshold: 1200, tone: "sunshine", Icon: Star },
  platinum: { label: "Mastermind", threshold: 2500, tone: "mint", Icon: Rocket },
  legend: { label: "Legend", threshold: 5000, tone: "violet", Icon: Crown },
};

const TIER_ORDER: XpTier[] = ["spark", "bronze", "silver", "gold", "platinum", "legend"];

export function tierForXp(xp: number): XpTier {
  let current: XpTier = "spark";
  for (const t of TIER_ORDER) {
    if (xp >= XP_TIERS[t].threshold) current = t;
  }
  return current;
}

export function XpBadge({
  tier,
  size = 80,
  showLabel = true,
  className,
}: {
  tier: XpTier;
  size?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const cfg = XP_TIERS[tier];
  const Icon = cfg.Icon;
  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <HexBadge tone={cfg.tone} size={size}>
        <Icon className="w-full h-full" />
      </HexBadge>
      {showLabel && (
        <div className="text-center">
          <div className="font-display font-semibold text-foreground text-sm leading-tight">
            {cfg.label}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-foreground/60">
            {cfg.threshold === 0 ? "Start" : `${cfg.threshold}+ XP`}
          </div>
        </div>
      )}
    </div>
  );
}

export function XpBadgeSet({
  earnedXp = 0,
  size = 76,
  className,
}: {
  earnedXp?: number;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-3 sm:grid-cols-6 gap-4 place-items-center",
        className,
      )}
    >
      {TIER_ORDER.map((t) => {
        const earned = earnedXp >= XP_TIERS[t].threshold;
        return (
          <div
            key={t}
            className={cn(
              "transition-all",
              earned ? "opacity-100" : "opacity-40 grayscale",
            )}
          >
            <XpBadge tier={t} size={size} />
          </div>
        );
      })}
    </div>
  );
}