export const THEMES = [
  "anxiety",
  "fear",
  "uncertainty",
  "trust",
  "guidance",
  "future",
  "hope",
  "loneliness",
  "grief",
  "sadness",
  "strength",
  "perseverance",
  "patience",
  "forgiveness",
  "love",
  "relationships",
  "gratitude",
  "joy",
  "faith",
  "wisdom",
  "decision-making",
  "new-beginnings",
  "temptation",
  "peace",
  "encouragement",
] as const;

export type Theme = (typeof THEMES)[number];

const themeSet = new Set<string>(THEMES);

export function isTheme(value: string): value is Theme {
  return themeSet.has(value);
}
