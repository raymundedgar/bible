import type { Passage } from "../passages";
import type { Theme } from "../themes";

export interface ScoredPassage {
  passage: Passage;
  score: number;
}

export function scorePassages(
  passages: Passage[],
  weights: Map<Theme, number>,
  exclude: Set<string>,
): ScoredPassage[] {
  const ranked: ScoredPassage[] = [];

  for (const passage of passages) {
    if (exclude.has(passage.id)) continue;
    let score = 0;
    for (const theme of passage.themes) score += weights.get(theme) ?? 0;
    if (score > 0) ranked.push({ passage, score });
  }

  ranked.sort(
    (a, b) => b.score - a.score || a.passage.id.localeCompare(b.passage.id),
  );
  return ranked;
}

export function pickDiverse(
  ranked: ScoredPassage[],
  count: number,
): { picked: Passage[]; hasMore: boolean } {
  const picked: Passage[] = [];
  const deferred: Passage[] = [];
  const chapters = new Set<string>();

  for (const item of ranked) {
    const key = `${item.passage.book}:${item.passage.chapter}`;
    if (chapters.has(key)) {
      deferred.push(item.passage);
      continue;
    }
    chapters.add(key);
    picked.push(item.passage);
    if (picked.length === count) break;
  }

  if (picked.length < count) {
    for (const passage of deferred) {
      picked.push(passage);
      if (picked.length === count) break;
    }
  }

  const pickedIds = new Set(picked.map((passage) => passage.id));
  return {
    picked,
    hasMore: ranked.some((item) => !pickedIds.has(item.passage.id)),
  };
}
