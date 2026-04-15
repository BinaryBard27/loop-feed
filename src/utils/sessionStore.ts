// ──────────────────────────────────────────────────────────────
// sessionStore.ts — localStorage persistence layer
// All calls are try/catch safe for SSR environments
// ──────────────────────────────────────────────────────────────

const KEY = "brainloop_stats_v1";
const OLD_KEY = "chaos_feed_stats_v1";

export interface SessionStats {
  bestRageScore: number;
  totalItemsViewed: number;
  streak: number;
  lastVisitDate: string; // Date.toDateString()
}

function defaultStats(): SessionStats {
  return { bestRageScore: 0, totalItemsViewed: 0, streak: 0, lastVisitDate: "" };
}

export function getStats(): SessionStats {
  try {
    if (typeof window === "undefined") return defaultStats();
    
    // Migration logic
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const oldRaw = localStorage.getItem(OLD_KEY);
      if (oldRaw) {
        const stats = { ...defaultStats(), ...JSON.parse(oldRaw) };
        localStorage.setItem(KEY, JSON.stringify(stats));
        // Optional: localStorage.removeItem(OLD_KEY); // Keeping for safety
        return stats;
      }
      return defaultStats();
    }
    
    return { ...defaultStats(), ...JSON.parse(raw) };
  } catch {
    return defaultStats();
  }
}

function save(data: SessionStats): void {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {}
}

/**
 * Call once on app mount.
 * Increments streak if it's a new calendar day vs last visit.
 */
export function loadAndUpdateStreak(): { streak: number; isNewDay: boolean } {
  const stats = getStats();
  const today = new Date().toDateString();

  if (stats.lastVisitDate === today) {
    // Same day — no change
    return { streak: stats.streak, isNewDay: false };
  }

  const yesterday = new Date(Date.now() - 86_400_000).toDateString();
  const newStreak = stats.lastVisitDate === yesterday ? stats.streak + 1 : 1;

  save({ ...stats, streak: newStreak, lastVisitDate: today });
  return { streak: newStreak, isNewDay: true };
}

/**
 * Save a rage score. Returns whether it's a new personal best.
 */
export function saveBestRageScore(score: number): {
  isNewBest: boolean;
  previousBest: number;
} {
  const stats = getStats();
  const previousBest = stats.bestRageScore;
  const isNewBest = score > previousBest;

  if (isNewBest) {
    save({ ...stats, bestRageScore: score });
  }

  return { isNewBest, previousBest };
}

export function getBestRageScore(): number {
  return getStats().bestRageScore;
}

/**
 * Increments all-time viewed count and returns the new total.
 */
export function incrementTotalViewed(): number {
  const stats = getStats();
  const next = stats.totalItemsViewed + 1;
  save({ ...stats, totalItemsViewed: next });
  return next;
}
