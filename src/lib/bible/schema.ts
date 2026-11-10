import { z } from "zod";

export const bookSchema = z.object({
  id: z.string(),
  name: z.string(),
  commonName: z.string(),
  order: z.number().int(),
  numberOfChapters: z.number().int().positive(),
  isApocryphal: z.boolean(),
});

export type CatalogBook = z.infer<typeof bookSchema>;

export const booksFileSchema = z.object({
  source: z.string().url(),
  translationId: z.string(),
  translationName: z.string(),
  shortName: z.string(),
  verifiedOn: z.string(),
  licenseUrl: z.string().url(),
  books: z.array(bookSchema).min(1),
});

export const simpleChapterSchema = z.object({
  book: z
    .object({
      id: z.string(),
      name: z.string(),
      commonName: z.string(),
      isApocryphal: z.boolean().optional(),
    })
    .passthrough(),
  numberOfVerses: z.number().int().nonnegative(),
  chapter: z.object({
    number: z.number().int().positive(),
    content: z.array(
      z
        .object({
          type: z.string(),
          number: z.number().int().positive().optional(),
          text: z.string().optional(),
        })
        .passthrough(),
    ),
  }),
  translation: z
    .object({
      id: z.string(),
      name: z.string(),
      shortName: z.string(),
    })
    .passthrough(),
});

export type SimpleChapter = z.infer<typeof simpleChapterSchema>;
