# Free Bible Companion PWA: Product & Build Plan

*Revised plan. Translation decision: World English Bible, Catholic edition (`eng_webc`).*

## 1. Project overview

**Working title:** Free Bible Companion (final name to be decided)
**Product type:** Progressive Web App (PWA)
**Primary goal:** Help people discover relevant Bible passages based on what they are experiencing, then offer a short, thoughtful explanation and encouragement grounded in those passages.

The app should be welcoming, peaceful, simple, mobile-first, accessible, and free to use with no account.

This is an early-stage project. Treat this document as the product direction and implementation brief. Make sensible, low-cost, reversible choices, document assumptions, and do not add features the MVP does not need.

## 2. Problem and motivation

Many people want encouragement from the Bible but do not know which passage fits their situation. They may be worried about the future, going through a hard season, lonely, anxious, celebrating good news, or facing a big decision.

Many Bible apps use subscriptions or lock features behind paid plans. This project offers a simple, free alternative.

The developer wants a solution that is:

- Free for users.
- Inexpensive and straightforward for one developer to maintain.
- Hosted on free tiers where practical, with honest notes on limits and possible future costs.
- Reachable through a normal web URL and installable as a PWA.

## 3. Product principles

1. **Scripture first.** Never invent Bible verses, references, chapter numbers, or quotations.
2. **AI assists; it does not author Scripture.** AI may classify a situation and explain verified passages, but verse text and references always come from the trusted Bible source.
3. **Free and accessible.** No account or subscription for the MVP.
4. **Simple experience.** The main action is obvious: describe what is happening and discover relevant Scripture.
5. **Privacy by default.** Prompts can contain personal information. Do not store them unless a future feature genuinely requires it and the user explicitly opts in.
6. **Respectful and broadly Christian by default.** Avoid presenting disputed denominational interpretations as universal doctrine. Explanations should stay close to the passage itself.
7. **Honest limitations.** Never promise that a recommendation is a definitive answer to someone's situation.

## 4. Target users and primary use cases

The app is for anyone who wants encouragement or reflection from the Bible. Example situations:

- "I'm worried about my future and afraid I might fail."
- "I'm feeling lonely and don't know what to do."
- "I'm grateful for a new opportunity."
- "I'm struggling to forgive someone."
- "I'm going through a difficult time."
- "I'm excited about a new plan but need guidance."
- "I feel anxious about an important decision."

The app supports both difficult and positive situations. It must not assume every prompt is a crisis, or that every user is Christian.

## 5. MVP user experience

### Main screen

- A simple app name and short tagline.
- A welcoming heading, such as **"What are you going through today?"**
- A short explanation: "Share what's on your heart and discover encouragement from Scripture."
- A large multiline text field with a clear placeholder.
- A primary button such as **"Find a Bible verse"**.
- A small privacy note: "No account required. Your message is not saved." (Adjust it to mention the AI provider if AI is enabled. See section 10.)
- Optional quick-start topics.

Suggested quick-start categories: Anxiety and worry, Fear and uncertainty, Loneliness, Grief and difficult seasons, Strength and perseverance, Hope and new beginnings, Guidance and decisions, Forgiveness, Love and relationships, Gratitude and joy, Faith and trust, Patience.

### Results screen

Return up to three relevant passages:

1. **Main recommendation:** the strongest match.
2. **Another perspective:** a related passage.
3. **For further reflection:** one more passage to read and consider.

Each result shows:

- The exact Bible reference.
- The translation label (**World English Bible, Catholic edition**, abbreviated WEBC).
- The exact verse text from the Bible data source.
- A concise explanation of why it may relate to the user's situation.
- A short encouragement or reflection grounded in the passage.
- An action to read the surrounding chapter or context.
- Copy and share actions that include the reference and verse text.

Other actions: **Try another recommendation** (with sensible limits), **Start over**.

Results must not feel like a diagnosis, prophecy, or guaranteed message from God.

### Visual direction

- Calm, warm, uncluttered interface.
- Mobile-first responsive layout.
- Readable typography and generous spacing.
- Subtle nature, light, or simple abstract visual elements.
- Strong contrast and accessible controls.
- Nothing overly commercial or ad-heavy.

## 6. AI and Scripture recommendation design

This is the most important product and technical requirement.

### Required flow

1. Validate the submitted text (non-empty, reasonable maximum length).
2. Send it to a backend endpoint, never directly from the browser to an AI provider.
3. Identify relevant themes from the description.
4. Retrieve candidate passages from the curated index and verify them against the Bible source.
5. Select up to three passages that match the themes.
6. Send only the verified references and verse text to the AI for explanations.
7. Validate the AI response. Render the original Scripture text from the trusted source, never from AI output.
8. If AI is unavailable or over quota, fall back to non-AI matching and show verses with a short prewritten explanation, or none.

### Strict AI rules

The system prompt must clearly instruct the model to:

- Never create, guess, or paraphrase-as-a-quotation any Bible verse.
- Never create a Bible reference.
- Discuss only passages in the supplied verified list.
- Not alter the supplied Scripture text.
- Not claim a passage is a guaranteed or uniquely intended message from God.
- Use humble language such as "This passage may encourage you because..."
- Not shame, threaten, or manipulate users.
- Not present itself as a pastor, therapist, or substitute for professional help.
- Keep explanations concise, compassionate, and grounded in the passage's context.
- Say so, rather than forcing a connection, if the supplied passages do not fit well.

### Recommended hybrid approach

Start with a curated Scripture index and deterministic theme matching. Each passage carries tags from a controlled theme list (section 13). AI can optionally classify free-text prompts into that approved list and explain why the retrieved passages may be relevant. This keeps AI usage, and cost, low.

Do not rely on AI to search the Bible from memory.

### Example internal passage record

```json
{
  "reference": "Proverbs 3:5-6",
  "translation": "eng_webc",
  "book": "PRO",
  "chapter": 3,
  "verseStart": 5,
  "verseEnd": 6,
  "canon": "protocanonical",
  "themes": ["trust", "guidance", "uncertainty", "future"],
  "contextNote": "Short internal note on the passage's context to avoid misleading matches."
}
```

The curated index stores **references and metadata only, not verse text**. Verse text is fetched from the Bible source at request time (or cached as the source's license allows). This schema is an example, not a license to hardcode a quotation.

### Example AI output schema

Use structured JSON and validate it server-side:

```json
{
  "themes": ["uncertainty", "trust", "guidance"],
  "recommendations": [
    {
      "reference": "Proverbs 3:5-6",
      "why_it_relates": "A short explanation based only on the supplied passage.",
      "encouragement": "A gentle, practical reflection."
    }
  ]
}
```

The backend must verify that every returned reference is one of the passages supplied to the model. The frontend receives verse text separately, from the Bible data source.

## 7. Bible text source and licensing

### Decision: `eng_webc`

The MVP uses **`eng_webc`, the World English Bible (Catholic edition)**, served through the **Free Use Bible API** (https://bible.helloao.org/docs/guide/getting-started.html#api).

Why this choice:

- Modern English, easy to read for a broad audience.
- Public domain, with no attribution required and commercial use allowed.
- Includes the 64 books of the Protestant canon plus 9 deuterocanonical books, for the 73 books of the Catholic canon. This means the curated index can draw on any of them.
- The source is free and does not require a user account or paid plan.

### What to confirm and record before launch

Even with a public-domain translation, do the following and record the source and date in the README:

- Re-read the API's current terms and any usage limits or fair-use guidance.
- Confirm the translation's public-domain status and any requested credit on the translation's own page.
- Confirm the exact API endpoint shape, book identifiers, and chapter and verse numbering, since the curated index depends on them.
- Decide whether the app will cache verse text (recommended, since it reduces API calls and improves offline behavior).
- Keep the translation ID, API base URL, and fetching logic configurable so another licensed source can be added later.

Although attribution is not required, a small "Scripture: World English Bible, Catholic edition (public domain)" label on each result and in the footer is recommended for transparency and trust.

Never scrape or redistribute copyrighted Bible translations without permission.

### Implications of the Catholic canon

- **Deuterocanonical books.** The index may include passages from books such as Wisdom and Sirach. Tag each record with a `canon` field (`protocanonical` or `deuterocanonical`) so the app can filter or label them later.
- **Default selection.** Recommended for the first prototype: build the index mainly from passages found in all Christian traditions, and add deuterocanonical passages only where they are an especially good fit. Each should be labeled clearly (for example, "Sirach 2:1-6").
- **Audience.** Because the text includes the full Catholic canon, the app suits readers from Catholic, Protestant, and Orthodox backgrounds. Explanations must still avoid taking denominational positions.
- **Book names and numbering.** Verify how this translation names books and numbers Psalms, and make sure displayed references match the source exactly. Display references from the source, not from the AI.

## 8. Suggested technology architecture

Preferred initial stack:

- **Frontend:** Astro with TypeScript.
- **UI:** Lightweight CSS or a small component system. Avoid unnecessary dependencies.
- **PWA:** Web app manifest, service worker, installability, icons, offline fallback.
- **Hosting:** Cloudflare Pages.
- **Backend/API:** Cloudflare Workers, or Astro server endpoints deployed to Cloudflare, whichever is simplest to support.
- **Bible text:** Free Use Bible API, `eng_webc`, behind a small server-side interface.
- **Curated index:** Version-controlled JSON (references, themes, context notes, canon flag).
- **Optional database:** Cloudflare D1 only if needed later (curated metadata, configuration, admin features). The MVP uses the JSON dataset.
- **AI provider:** Provider-agnostic server-side adapter. Choose a provider only after checking current free-tier quotas, terms, privacy, and model availability.
- **Validation:** Runtime schema validation for all external API and AI responses.

Keep the architecture small. Do not add a traditional server, paid database, authentication, or vector database unless real usage shows a need.

### High-level request flow

```text
User's browser / installed PWA
          |
          v
Cloudflare Pages (Astro frontend)
          |
          v
Cloudflare Worker API
          |
          +----> Theme matching / curated passage index (JSON)
          |
          +----> Free Use Bible API (eng_webc), with caching
          |
          +----> Optional AI provider for explanation
          |
          v
Validated recommendations returned to the PWA
```

All provider keys and secrets stay server-side. Never expose them in client JavaScript or public environment variables.

## 9. Cost and sustainability requirements

The target is roughly zero monthly infrastructure cost during early use.

Use free tiers where suitable:

- Cloudflare Pages for frontend hosting.
- Cloudflare Workers for a small API, within the current free plan's limits.
- The free, public-domain `eng_webc` text through the Free Use Bible API.
- A curated local JSON index to avoid database calls.
- Optional AI only when useful and within a verified free quota.

Important:

- Free-tier limits and terms can change. Check current official documentation before deployment.
- Do not assume an AI API will stay free.
- Cache fetched verse text (in the Worker cache or at build time) so the app does not depend on, or overload, the Bible API on every request.
- Add request limits and abuse protection so a public endpoint cannot create surprise costs.
- Provide a non-AI fallback for provider outages or quota limits.
- Track request volume and errors without logging private prompt content.
- A custom domain has a registration cost. The app can initially use its hosting subdomain.
- No advertising or monetization in the MVP unless the product direction changes.

## 10. Privacy, security, and responsible responses

### Privacy

- No account required.
- Do not persist submitted prompts by default.
- Do not store personal situations in analytics or logs.
- If an external AI provider processes prompts, say so plainly in the UI and the privacy notice. The privacy note on the main screen must stay accurate. For example: "Your message is not saved by this app. If AI explanations are on, it is sent to our AI provider to generate them."
- Keep API keys server-side.
- Publish a plain-language privacy notice before public launch.

### Security and abuse prevention

- Validate and limit prompt length.
- Apply per-IP or equivalent rate limiting where practical.
- Add request timeouts and response-size limits.
- Validate all external API responses.
- Treat user prompts as untrusted input. They must not be able to override system instructions.
- Do not expose stack traces, secrets, or provider errors to users.
- Add basic bot protection if public traffic requires it.

### Sensitive situations

- If a user expresses immediate danger, self-harm intent, or risk of harming someone, respond compassionately and prioritize immediate human support and local emergency or crisis resources. Do not rely on Bible verses alone.
- Do not diagnose mental-health conditions.
- Do not tell users to stop medication, treatment, or professional support.
- Avoid definitive financial, legal, medical, or relationship instructions.
- Do not imply that hardship is proof of weak faith or personal failure.

## 11. PWA requirements

The app should:

- Be responsive and usable on modern mobile and desktop browsers.
- Be installable on supported Android and iOS devices where the browser allows.
- Include a web app manifest with name, short name, theme color, background color, icons, and `display: standalone`.
- Use HTTPS.
- Provide a useful offline fallback page.
- Cache static application assets.
- Cache Scripture text under the terms of the source (`eng_webc` is public domain, so caching verse text is permitted, but still confirm the API's own usage guidance).
- Avoid caching private prompts or AI results by default.
- Handle offline and API-failure states clearly.

Do not promise that every feature works offline. The recommendation API and AI explanations generally need connectivity. Because the curated index references a limited set of passages, a later version could ship those verses for offline reading.

## 12. MVP scope and priorities

### Must have for first release

- Landing page with a prompt textarea.
- Submit and loading states.
- Input validation and clear error handling.
- Theme identification and Scripture matching.
- Up to three recommendations.
- Verified verse text and references from `eng_webc`.
- Short AI explanation and encouragement when available.
- Non-AI fallback.
- Copy and share verse actions.
- Mobile-first responsive design.
- PWA manifest and installability.
- Privacy notice.
- Basic rate limiting and server-side secret handling.

### Nice to have after MVP

- Browse by feeling or topic.
- Daily verse.
- Additional translations and languages.
- Filipino language support.
- Favorites and saved verses (needs a privacy-conscious storage decision).
- Shareable verse image cards.
- Audio Bible links or playback, subject to licensing.
- Prayer journal.
- Optional accounts and cross-device sync.
- Admin interface for curated tags and passages.
- Offline reading of the curated passages.

Do not build these before the core experience works well.

## 13. Initial content taxonomy

Use a controlled theme list rather than free-form tags. Start with:

anxiety, fear, uncertainty, trust, guidance, future, hope, loneliness, grief, sadness, strength, perseverance, patience, forgiveness, love, relationships, gratitude, joy, faith, wisdom, decision-making, new-beginnings, temptation, peace, encouragement.

A passage can have multiple themes. Each passage also carries:

- A short internal **context note** to reduce misleading matches.
- A **canon** flag (`protocanonical` or `deuterocanonical`).

## 14. Quality and acceptance criteria

The MVP is ready for a small public beta when:

1. A visitor can use the app without signing up.
2. The main experience works on mobile and desktop.
3. A submitted situation returns relevant Scripture passages.
4. Every displayed verse and reference is verified against the `eng_webc` source.
5. AI cannot introduce a new verse or reference into the results.
6. The app still gives useful results when the AI provider is unavailable.
7. Empty, overly long, or invalid prompts are handled gracefully.
8. API errors and rate limits produce understandable messages.
9. User prompts are not stored in application logs or analytics by default.
10. The PWA can be installed on supported devices.
11. The privacy notice is published, and the translation label and source details are recorded and displayed.
12. The deployment fits within the chosen free-tier limits under expected early usage.
13. Deuterocanonical passages, if included, display correctly and are labeled.

## 15. Development phases

### Phase 1: Foundation

- Create the Astro + TypeScript project.
- Build the responsive landing page.
- Add the prompt form, loading state, and empty and error states.
- Establish the visual design system.

### Phase 2: Scripture matching

- Build the `eng_webc` fetch layer (chapter retrieval, verse extraction, caching, schema validation).
- Build a small curated passage index with themes, context notes, and canon flags.
- Implement deterministic matching and ranking.
- Display verified text and references.

### Phase 3: AI explanations

- Add a server-side AI provider adapter.
- Implement structured prompt classification and explanations.
- Validate AI output against the verified candidate list.
- Add the non-AI fallback and provider quota handling.

### Phase 4: PWA and hardening

- Add manifest, icons, service worker, and offline fallback.
- Add rate limiting, input limits, and privacy protections.
- Test accessibility, responsive behavior, and failure states.

### Phase 5: Beta launch

- Deploy to Cloudflare.
- Test with a small group of users.
- Review recommendation quality and Scripture context.
- Monitor usage, latency, errors, and free-tier consumption.
- Fix issues before promoting publicly.

## 16. Guidance for the AI developer building this project

When implementing this plan:

- Start by proposing a concise architecture and project structure, then build incrementally.
- Prefer simple, maintainable code over unneeded abstractions.
- Use TypeScript and validate data at system boundaries.
- Keep AI and Bible API integrations behind small server-side interfaces so providers can be replaced.
- Load verse text from the Bible source. Never hardcode verse text in the index, in tests that pretend to be production data, or in prompts.
- Do not put secrets in the frontend.
- Do not add login, paid subscriptions, a database, analytics, or unrelated features without asking.
- Include a `.env.example` with variable names only.
- Include a README covering local setup, environment variables, deployment steps, the `eng_webc` source details and date verified, and free-tier caveats.
- Add tests for theme matching, passage validation, verse fetching and parsing, AI output validation, and fallback behavior.
- Clearly label mocked data. Never present mock verses as real Scripture.
- If a decision depends on current pricing, quotas, or licensing, verify it against official documentation and record the source and date.
- If a requirement is ambiguous, make the lowest-cost reversible assumption and document it rather than expanding scope.

## 17. Decisions

### Resolved

- **Bible translation:** `eng_webc`, World English Bible (Catholic edition). Public domain, modern English, 73-book canon.
- **Bible source:** Free Use Bible API.

### Still open

- Final app name and domain.
- Whether launch is English only or includes Filipino.
- Whether the first index leans on passages common to all Christian traditions or deliberately includes many deuterocanonical passages.
- Which AI provider, if any, for the first release.
- Whether AI explanations are enabled at launch or added after a no-AI prototype.

**Recommended default for the first prototype:** English-first, `eng_webc`, no user accounts, curated theme matching, optional AI explanations behind a server-side adapter, and Cloudflare Pages + Workers.

---

**Product north star:** Make it easy for anyone to share what they are going through and discover relevant, trustworthy encouragement from God's Word, without a subscription, unnecessary complexity, or fabricated Scripture.
