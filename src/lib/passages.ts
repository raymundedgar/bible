import { z } from "zod";
import rawPassages from "../data/passages.json";
import { THEMES } from "./themes";

export const passageSchema = z
  .object({
    id: z.string().regex(/^[A-Z0-9]{2,4}\.\d{1,3}\.\d{1,3}(-\d{1,3})?$/),
    book: z.string().regex(/^[A-Z0-9]{2,4}$/),
    chapter: z.number().int().positive(),
    verseStart: z.number().int().positive(),
    verseEnd: z.number().int().positive(),
    canon: z.enum(["protocanonical", "deuterocanonical"]),
    themes: z.array(z.enum(THEMES)).min(1),
    contextNote: z.string().min(1),
    fallbackWhy: z.string().min(1),
    fallbackEncouragement: z.string().min(1),
  })
  .strict()
  .refine((passage) => passage.verseStart <= passage.verseEnd, {
    message: "verseStart must not be after verseEnd",
  });

export type Passage = z.infer<typeof passageSchema>;

const listSchema = z.array(passageSchema).min(1);

function loadPassages(): Passage[] {
  const passages = listSchema.parse(rawPassages);
  const ids = new Set<string>();
  for (const passage of passages) {
    if (ids.has(passage.id)) {
      throw new Error(`Duplicate passage id: ${passage.id}`);
    }
    ids.add(passage.id);
  }
  return passages;
}

export const passages: Passage[] = loadPassages();
