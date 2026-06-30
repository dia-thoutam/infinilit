import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HexTone = "coral" | "sunshine" | "mint" | "sky" | "violet";

const tile: Record<HexTone, string> = {
  coral: "from-coral/25 to-coral/5",
  sunshine: "from-sunshine/35 to-sunshine/5",
  mint: "from-mint/30 to-mint/5",
  sky: "from-sky/30 to-sky/5",
  violet: "from-violet/30 to-violet/5",
};

const hexFill: Record<HexTone, string> = {
  coral: "fill-coral",
  sunshine: "fill-sunshine",
  mint: "fill-mint",
  sky: "fill-sky",
  violet: "fill-violet",
};

const iconWrap: Record<HexTone, string> = {
  coral: "text-coral-foreground",
  sunshine: "text-sunshine-foreground",
  mint: "text-mint-foreground",
  sky: "text-sky-foreground",
  violet: "text-violet-foreground",
};

/**
 * Hexagonal reward badge in the style of motivational achievement icons.
 * Soft pastel rounded tile with a saturated hexagon and an icon centered inside.
 */
export function HexBadge({
  tone = "coral",
  size = 72,
  children,
  className,
}: {
  tone?: HexTone;
  size?: number;
  children: ReactNode;
  className?: string;
}) {
  const tilePad = Math.round(size * 0.12);
  const hex = size - tilePad * 2;
  const iconSize = Math.round(hex * 0.52);
  return (
    <div
      className={cn(
        "relative grid place-items-center rounded-[28%] bg-gradient-to-br shadow-[0_10px_22px_-8px_rgba(15,20,60,0.45)]",
        tile[tone],
        className,
      )}
      style={{ width: size, height: size, padding: tilePad }}
    >
      <svg
        viewBox="0 0 100 100"
        width={hex}
        height={hex}
        className="drop-shadow-[0_4px_0_rgba(15,20,60,0.35)] drop-shadow-[0_8px_14px_rgba(15,20,60,0.25)]"
      >
        <polygon
          points="50,4 92,28 92,72 50,96 8,72 8,28"
          className={hexFill[tone]}
          stroke="rgba(15,20,60,0.85)"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <polygon
          points="50,4 92,28 50,52 8,28"
          fill="white"
          fillOpacity="0.32"
        />
        <polygon
          points="50,4 92,28 92,72 50,96 8,72 8,28"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.5"
          transform="scale(0.86) translate(8 8)"
        />
      </svg>
      <div
        className={cn("absolute inset-0 grid place-items-center text-[color:var(--color-ink)] drop-shadow-[0_2px_0_rgba(255,255,255,0.4)]", iconWrap[tone])}
        style={{ paddingBottom: Math.round(size * 0.02) }}
      >
        <div style={{ width: iconSize, height: iconSize }} className="grid place-items-center">
          {children}
        </div>
      </div>
    </div>
  );
}