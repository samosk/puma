// Gemensamma TypeScript-typer för profildata som hämtas från Supabase.
// ProfileBalances beskriver värdena för candies och coins som visas i appen.
// lade till denna ifall vi ska ha mer profilrelaterade typer så som exempelvis:
// ProfileSettings, ProfileStats, DailySteps etc. i framtiden.

export type ProfileBalances = {
  candies: number;
  coins: number;
};
