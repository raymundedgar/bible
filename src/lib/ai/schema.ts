import { z } from "zod";

export const aiResponseSchema = z
  .object({
    themes: z.array(z.string()).max(12).optional(),
    recommendations: z
      .array(
        z
          .object({
            reference: z.string().min(1).max(80),
            why_it_relates: z.string().min(1).max(700),
            encouragement: z.string().min(1).max(700),
          })
          .strict(),
      )
      .max(3),
  })
  .strict();

export interface Explanation {
  whyItRelates: string;
  encouragement: string;
}

export function explanationsFromAi(
  raw: unknown,
  allowedReferences: Map<string, string>,
): Map<string, Explanation> {
  const parsed = aiResponseSchema.safeParse(raw);
  const explanations = new Map<string, Explanation>();
  if (!parsed.success) return explanations;

  for (const recommendation of parsed.data.recommendations) {
    const id = allowedReferences.get(recommendation.reference.trim());
    if (!id || explanations.has(id)) continue;
    explanations.set(id, {
      whyItRelates: recommendation.why_it_relates.trim(),
      encouragement: recommendation.encouragement.trim(),
    });
  }

  return explanations;
}
