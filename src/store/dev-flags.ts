import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Dev-only feature flags. Persisted to localStorage so testers can toggle
 * without a rebuild. Nothing here should ever gate real data writes — only
 * developer-facing UI (banners, verbose logs, mock detection).
 */
interface DevFlags {
  leakDetection: boolean;
  setLeakDetection: (v: boolean) => void;
}

export const useDevFlags = create<DevFlags>()(
  persist(
    (set) => ({
      leakDetection: true,
      setLeakDetection: (v) => set({ leakDetection: v }),
    }),
    { name: "infinilit-dev-flags-v1" },
  ),
);