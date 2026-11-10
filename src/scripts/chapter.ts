const title = document.querySelector<HTMLElement>("#chapter-title");
const meta = document.querySelector<HTMLElement>("#chapter-meta");
const error = document.querySelector<HTMLElement>("#chapter-error");
const body = document.querySelector<HTMLElement>("#chapter-body");

if (!title || !meta || !error || !body) {
  throw new Error("The chapter page is missing its layout.");
}

const params = new URLSearchParams(window.location.search);
const book = params.get("book") ?? "";
const chapter = params.get("chapter") ?? "";
const from = Number(params.get("from"));
const to = Number(params.get("to"));

function showError(message: string): void {
  error.hidden = false;
  error.textContent = message;
  title.textContent = "Chapter unavailable";
}

async function load(): Promise<void> {
  if (!navigator.onLine) {
    showError("Reconnect to read this chapter. Chapter text is loaded from the Scripture source.");
    return;
  }

  try {
    const response = await fetch(
      `/api/chapter?book=${encodeURIComponent(book)}&chapter=${encodeURIComponent(chapter)}`,
    );
    const payload: unknown = await response.json();
    if (!response.ok || !payload || typeof payload !== "object" || !("ok" in payload) || payload.ok !== true) {
      const message =
        payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string"
          ? payload.message
          : "That chapter could not be loaded.";
      showError(message);
      return;
    }

    const data = payload as {
      commonName: string;
      chapter: number;
      translationLabel: string;
      isApocryphal: boolean;
      verses: { number: number; text: string }[];
    };

    title.textContent = `${data.commonName} ${data.chapter}`;
    meta.textContent = data.isApocryphal
      ? `${data.translationLabel}. Deuterocanonical book in this translation.`
      : data.translationLabel;

    body.replaceChildren();
    for (const verse of data.verses) {
      const paragraph = document.createElement("p");
      const marked = Number.isFinite(from) && Number.isFinite(to) && verse.number >= from && verse.number <= to;
      if (marked) paragraph.className = "marked";
      const number = document.createElement("sup");
      number.textContent = String(verse.number);
      paragraph.append(number, document.createTextNode(` ${verse.text}`));
      body.append(paragraph);
    }

    const highlighted = body.querySelector(".marked");
    highlighted?.scrollIntoView({ block: "center" });
  } catch {
    showError("The chapter could not be loaded. Please try again when you are online.");
  }
}

void load();
