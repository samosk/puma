export const XP_PER_LEVEL = 100;

export type LevelProgress = {
  level: number;
  percentage: number;
  totalXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
};

export function calculateLevelProgress(xp: number): LevelProgress {
  const totalXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  const xpIntoLevel = totalXp % XP_PER_LEVEL;

  return {
    level: Math.floor(totalXp / XP_PER_LEVEL) + 1,
    percentage: (xpIntoLevel / XP_PER_LEVEL) * 100,
    totalXp,
    xpIntoLevel,
    xpForNextLevel: XP_PER_LEVEL - xpIntoLevel,
  };
}
