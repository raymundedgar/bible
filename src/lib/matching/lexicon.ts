import { THEMES, type Theme } from "../themes";

interface Rule {
  phrase: string;
  themes: Theme[];
  weight: number;
}

const RULES: Rule[] = [
  { phrase: "new opportunity", themes: ["new-beginnings", "gratitude"], weight: 3 },
  { phrase: "new beginning", themes: ["new-beginnings", "hope"], weight: 3 },
  { phrase: "new beginnings", themes: ["new-beginnings", "hope"], weight: 3 },
  { phrase: "fresh start", themes: ["new-beginnings", "hope"], weight: 3 },
  { phrase: "new plan", themes: ["new-beginnings", "guidance", "decision-making"], weight: 3 },
  { phrase: "new job", themes: ["new-beginnings", "future"], weight: 3 },
  { phrase: "hard season", themes: ["perseverance", "encouragement", "grief"], weight: 3 },
  { phrase: "hard time", themes: ["perseverance", "encouragement"], weight: 2 },
  { phrase: "difficult time", themes: ["perseverance", "encouragement", "sadness"], weight: 3 },
  { phrase: "difficult season", themes: ["perseverance", "grief", "encouragement"], weight: 3 },
  { phrase: "don't know what to do", themes: ["uncertainty", "guidance"], weight: 3 },
  { phrase: "passed away", themes: ["grief"], weight: 3 },
  { phrase: "keep going", themes: ["perseverance", "strength"], weight: 2 },
  { phrase: "giving up", themes: ["perseverance", "encouragement"], weight: 2 },
  { phrase: "anxious", themes: ["anxiety"], weight: 3 },
  { phrase: "anxiety", themes: ["anxiety"], weight: 3 },
  { phrase: "worried", themes: ["anxiety", "future"], weight: 2 },
  { phrase: "worry", themes: ["anxiety"], weight: 2 },
  { phrase: "nervous", themes: ["anxiety"], weight: 2 },
  { phrase: "panic", themes: ["anxiety", "fear"], weight: 2 },
  { phrase: "afraid", themes: ["fear"], weight: 3 },
  { phrase: "scared", themes: ["fear"], weight: 3 },
  { phrase: "fear", themes: ["fear"], weight: 2 },
  { phrase: "terrified", themes: ["fear"], weight: 3 },
  { phrase: "fail", themes: ["fear", "uncertainty"], weight: 2 },
  { phrase: "failure", themes: ["fear", "uncertainty"], weight: 2 },
  { phrase: "uncertain", themes: ["uncertainty"], weight: 3 },
  { phrase: "unsure", themes: ["uncertainty"], weight: 2 },
  { phrase: "confused", themes: ["uncertainty", "guidance"], weight: 2 },
  { phrase: "trust", themes: ["trust"], weight: 2 },
  { phrase: "guidance", themes: ["guidance"], weight: 3 },
  { phrase: "guide", themes: ["guidance"], weight: 2 },
  { phrase: "direction", themes: ["guidance", "decision-making"], weight: 1 },
  { phrase: "future", themes: ["future"], weight: 2 },
  { phrase: "tomorrow", themes: ["future"], weight: 1 },
  { phrase: "hope", themes: ["hope"], weight: 2 },
  { phrase: "hopeful", themes: ["hope"], weight: 2 },
  { phrase: "lonely", themes: ["loneliness"], weight: 3 },
  { phrase: "loneliness", themes: ["loneliness"], weight: 3 },
  { phrase: "alone", themes: ["loneliness"], weight: 2 },
  { phrase: "isolated", themes: ["loneliness"], weight: 2 },
  { phrase: "grief", themes: ["grief"], weight: 3 },
  { phrase: "grieving", themes: ["grief", "sadness"], weight: 3 },
  { phrase: "mourning", themes: ["grief"], weight: 3 },
  { phrase: "died", themes: ["grief"], weight: 2 },
  { phrase: "sad", themes: ["sadness"], weight: 2 },
  { phrase: "heartbroken", themes: ["sadness", "grief"], weight: 3 },
  { phrase: "crying", themes: ["sadness"], weight: 1 },
  { phrase: "strength", themes: ["strength"], weight: 2 },
  { phrase: "weak", themes: ["strength"], weight: 2 },
  { phrase: "weary", themes: ["strength", "perseverance"], weight: 2 },
  { phrase: "exhausted", themes: ["strength"], weight: 2 },
  { phrase: "tired", themes: ["strength"], weight: 1 },
  { phrase: "persevere", themes: ["perseverance"], weight: 3 },
  { phrase: "perseverance", themes: ["perseverance"], weight: 3 },
  { phrase: "patience", themes: ["patience"], weight: 3 },
  { phrase: "patient", themes: ["patience"], weight: 2 },
  { phrase: "waiting", themes: ["patience"], weight: 2 },
  { phrase: "forgive", themes: ["forgiveness"], weight: 3 },
  { phrase: "forgiveness", themes: ["forgiveness"], weight: 3 },
  { phrase: "resent", themes: ["forgiveness"], weight: 2 },
  { phrase: "love", themes: ["love"], weight: 2 },
  { phrase: "relationship", themes: ["relationships", "love"], weight: 2 },
  { phrase: "relationships", themes: ["relationships", "love"], weight: 2 },
  { phrase: "marriage", themes: ["relationships", "love"], weight: 2 },
  { phrase: "friend", themes: ["relationships"], weight: 1 },
  { phrase: "family", themes: ["relationships"], weight: 1 },
  { phrase: "grateful", themes: ["gratitude", "joy"], weight: 3 },
  { phrase: "gratitude", themes: ["gratitude"], weight: 3 },
  { phrase: "thankful", themes: ["gratitude"], weight: 3 },
  { phrase: "thank", themes: ["gratitude"], weight: 1 },
  { phrase: "joy", themes: ["joy"], weight: 2 },
  { phrase: "joyful", themes: ["joy"], weight: 2 },
  { phrase: "happy", themes: ["joy"], weight: 1 },
  { phrase: "excited", themes: ["joy"], weight: 2 },
  { phrase: "celebrating", themes: ["joy", "gratitude"], weight: 2 },
  { phrase: "faith", themes: ["faith"], weight: 2 },
  { phrase: "believe", themes: ["faith"], weight: 1 },
  { phrase: "wisdom", themes: ["wisdom"], weight: 3 },
  { phrase: "wise", themes: ["wisdom"], weight: 1 },
  { phrase: "decision", themes: ["decision-making", "guidance"], weight: 3 },
  { phrase: "decide", themes: ["decision-making"], weight: 2 },
  { phrase: "choice", themes: ["decision-making"], weight: 1 },
  { phrase: "temptation", themes: ["temptation"], weight: 3 },
  { phrase: "tempted", themes: ["temptation"], weight: 3 },
  { phrase: "peace", themes: ["peace"], weight: 2 },
  { phrase: "calm", themes: ["peace"], weight: 1 },
  { phrase: "discouraged", themes: ["encouragement", "sadness"], weight: 2 },
  { phrase: "encourage", themes: ["encouragement"], weight: 2 },
  { phrase: "struggling", themes: ["perseverance", "encouragement"], weight: 1 },
  { phrase: "difficult", themes: ["perseverance", "encouragement"], weight: 1 },
];

function matches(text: string, phrase: string): boolean {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(text);
}

export interface ThemeMatch {
  weights: Map<Theme, number>;
  themes: Theme[];
  general: boolean;
}

export function identifyThemes(text: string): ThemeMatch {
  const weights = new Map<Theme, number>();
  const normalized = text.toLowerCase();

  for (const rule of RULES) {
    if (!matches(normalized, rule.phrase)) continue;
    for (const theme of rule.themes) {
      weights.set(theme, (weights.get(theme) ?? 0) + rule.weight);
    }
  }

  if (weights.size === 0) {
    weights.set("encouragement", 1);
    weights.set("hope", 1);
    weights.set("peace", 1);
    return { weights, themes: ["encouragement", "hope", "peace"], general: true };
  }

  const themes = THEMES.filter((theme) => weights.has(theme));
  return { weights, themes, general: false };
}
