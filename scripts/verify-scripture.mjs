import passages from "../src/data/passages.json" with { type: "json" };

const base = process.env.BIBLE_API_BASE_URL || "https://bible.helloao.org/api";
const translation = process.env.BIBLE_TRANSLATION_ID || "eng_webc";
const cache = new Map();
let failed = 0;

for (const passage of passages) {
  const key = `${passage.book}/${passage.chapter}`;
  if (!cache.has(key)) {
    const response = await fetch(`${base}/${translation}/${passage.book}/${passage.chapter}.simple.json`);
    if (!response.ok) {
      console.error(`HTTP ${response.status} ${key}`);
      failed += 1;
      continue;
    }
    const data = await response.json();
    const numbers = new Set(
      data.chapter.content.filter((item) => item.type === "verse").map((item) => item.number),
    );
    cache.set(key, {
      numbers,
      id: data.book.id,
      commonName: data.book.commonName,
    });
  }

  const chapter = cache.get(key);
  if (!chapter) continue;
  const missing = [];
  for (let verse = passage.verseStart; verse <= passage.verseEnd; verse += 1) {
    if (!chapter.numbers.has(verse)) missing.push(verse);
  }
  if (chapter.id !== passage.book || missing.length > 0) {
    console.error(
      `Mismatch ${passage.id}: source book ${chapter.id} ${chapter.commonName}, missing ${missing.join(",") || "none"}`,
    );
    failed += 1;
  } else {
    console.log(`ok ${passage.id} ${chapter.commonName} ${passage.chapter}:${passage.verseStart}-${passage.verseEnd}`);
  }
}

if (failed > 0) {
  console.error(`${failed} passage check(s) failed`);
  process.exit(1);
}

console.log(`Verified ${passages.length} passage ranges against ${translation}. Verse text was not stored.`);
