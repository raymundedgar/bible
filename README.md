# Free Bible Companion

**Live demo:** [bible.dev-raymund.workers.dev](https://bible.dev-raymund.workers.dev)

A free, installable web app that takes a personal situation in plain language and returns one relevant Bible passage, with a short reflection. There is no account, subscription, database, or analytics.

The interesting constraint is trust. The model is not allowed to recall or invent Scripture. A curated index picks the reference, the verse text is loaded from a public-domain source and checked before it is shown, and Gemini only writes the reflection about that verified passage. If the model is over quota or unreachable, the same passage is still shown with a reflection written ahead of time.

## Why this is in my portfolio

I built this to show how I ship a small product with a real constraint, not a demo that stops at a prompt box.

- **Product judgment.** The main action is one sentence: describe what you are going through, then read one passage. Extra results and topic chips were removed after using the app, because they pushed the verse below the fold.
- **AI with a boundary.** Theme matching is deterministic. The model receives only the passage already selected, and any reference it returns that was not in that list is discarded. The verse on screen never comes from the model.
- **Safety and privacy.** Prompts are not stored or written to logs. A message that looks like immediate danger shows crisis resources and is not sent to Gemini.
- **Cost-aware production.** The public site runs on Cloudflare’s free Workers plan. The Bible text is public domain. Reflections use Gemini’s free tier (`gemini-3.5-flash-lite`), with a prepared fallback when that quota fails.
- **Evidence.** Vitest covers matching, verse parsing, AI output validation, crisis detection, and the fallback. A separate script checks every curated range against the live Bible API.

## What a visitor does

1. Write a situation, such as worry about the future, loneliness, or a hard decision.
2. The server maps the words onto a fixed theme list and scores a curated index of references.
3. It loads that exact range from the World English Bible, Catholic edition, and rejects the result if a requested verse is missing.
4. Gemini writes why the passage may relate, and a short encouragement. The verse text stays the API text.
5. The visitor can read the surrounding chapter, copy the passage, or ask for another verse.

## Stack

| Area | Choice |
| --- | --- |
| UI | Astro, TypeScript, hand-written CSS |
| API | Astro server routes on Cloudflare Workers |
| Validation | Zod at the Bible API and AI boundaries |
| Scripture | [Free Use Bible API](https://bible.helloao.org/docs/), translation `eng_webc` |
| Reflection | Gemini `generateContent`, model `gemini-3.5-flash-lite` |
| Tests | Vitest |
| Install | Web app manifest and a service worker |

Pages are prerendered. `/api/recommend` and `/api/chapter` are the only Worker routes. Chapter JSON is cached for a day so repeat reads do not hit the Bible API every time.

## How a recommendation is chosen

```text
situation
  -> keyword rules assign weights to a fixed theme list
  -> curated passages are scored by those themes
  -> the top passage from a new chapter is selected
  -> verse text is fetched and checked
  -> Gemini explains that passage only
  -> unknown references from the model are dropped
```

The index in `src/data/passages.json` stores references, themes, canon, and fallback copy. It does not store verse text. Book names come from the chapter response, using the 73-book `eng_webc` catalog. Esther and Daniel in this translation are the Greek editions (`ESG`, `DAG`). Deuterocanonical passages, such as Sirach 2 and Wisdom of Solomon 9, are labeled.

## Scripture and licensing

Verified **2026-11-10**:

| Item | Record |
| --- | --- |
| Translation | World English Bible, Catholic edition (`eng_webc`, short name WEBC) |
| License | Public domain. Attribution is not required. Commercial use is allowed. [eBible record](https://ebible.org/Scriptures/details.php?id=eng-web-c) |
| Chapter endpoint | `GET https://bible.helloao.org/api/eng_webc/{book}/{chapter}.simple.json` |
| Book list | [eng_webc books](https://bible.helloao.org/api/eng_webc/books.json) |

The app still prints “World English Bible, Catholic edition (public domain)” on each result. `npm run verify:scripture` checks that every curated range still exists and prints references only.

## Privacy

The public notice is at [/privacy](https://bible.dev-raymund.workers.dev/privacy).

- No account, and the situation is not saved by this app.
- Logs keep status, whether AI ran, whether a support notice was shown, result count, and duration. They do not keep the words the visitor typed.
- When AI is on, the situation and the verified passage are sent to Google Gemini. On the free tier, Google says submitted content may be used to improve its products.
- Crisis-like messages are answered with human support links and are not sent to Gemini.

## Run it locally

Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open the URL Astro prints, usually `http://localhost:4321`. Recommendations work with AI off.

To write reflections with Gemini, copy `.env.example` to `.env` and set:

```bash
AI_ENABLED=true
AI_PROVIDER=gemini
GEMINI_API_KEY=your-key
AI_MODEL=gemini-3.5-flash-lite
```

Create the key in [Google AI Studio](https://aistudio.google.com/apikey). Leave billing unlinked if you want to stay on the free tier. Checked **2026-11-10** on the [Gemini pricing page](https://ai.google.dev/gemini-api/docs/pricing): `gemini-3.5-flash-lite` lists input and output as free of charge. The exact daily limit is shown in AI Studio for each project and resets at midnight Pacific. Put the key in `.env` or, on Cloudflare, `npx wrangler secret put GEMINI_API_KEY`. Do not prefix it with `PUBLIC_`.

```bash
npm test                 # unit tests; mocked verse text is labeled and is not Scripture
npm run verify:scripture # live check of curated ranges
npm run build            # Cloudflare output
```

## Deployment

The live worker is [https://bible.dev-raymund.workers.dev](https://bible.dev-raymund.workers.dev).

```bash
npm run build
npx wrangler deploy --config dist/server/wrangler.json
```

`wrangler.json` enables the Gemini provider. Reflections start after the `GEMINI_API_KEY` secret is set.

Checked **2026-11-10** against [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/) (page updated 2026-10-29) and [pricing](https://developers.cloudflare.com/workers/platform/pricing/) (updated 2026-10-02): the free plan includes 100,000 requests per day for the account and 10 ms of CPU time per request. Time spent waiting on `fetch` does not count as CPU. Those numbers can change.

The service worker makes the app installable, caches the shell, and shows `/offline` when a navigation fails. It does not cache `/api/*`, so prompts and reflections are not stored on the device. A new recommendation needs a connection.
