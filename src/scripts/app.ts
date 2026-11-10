interface SupportResource {
  label: string;
  href?: string;
}

interface Recommendation {
  roleLabel: string;
  id: string;
  reference: string;
  translationName: string;
  translationShort: string;
  canon: "protocanonical" | "deuterocanonical";
  bookId: string;
  chapter: number;
  verseStart: number;
  verseEnd: number;
  text: string;
  whyItRelates: string;
  encouragement: string;
}

interface SuccessBody {
  ok: true;
  notice: string;
  support: { title: string; body: string; resources: SupportResource[] } | null;
  results: Recommendation[];
  hasMore: boolean;
}

const form = document.querySelector<HTMLFormElement>("#ask-form");
const field = document.querySelector<HTMLTextAreaElement>("#situation");
const count = document.querySelector<HTMLElement>("#count");
const error = document.querySelector<HTMLElement>("#form-error");
const submit = document.querySelector<HTMLButtonElement>("#submit");
const results = document.querySelector<HTMLElement>("#results");

if (!form || !field || !count || !error || !submit || !results) {
  throw new Error("The page is missing part of the form.");
}

const shown: string[] = [];
let lastPrompt = "";

function setCount(): void {
  count.textContent = `${field.value.length.toLocaleString("en-US")} / 1,500`;
}

field.addEventListener("input", setCount);
setCount();

function clearError(): void {
  error.hidden = true;
  error.textContent = "";
}

function showError(message: string): void {
  error.hidden = false;
  error.textContent = message;
}

function element(tag: string, className?: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function safeHref(href: string | undefined): string | null {
  if (!href) return null;
  if (href.startsWith("https://") || href.startsWith("tel:")) return href;
  return null;
}

function shareText(item: Recommendation): string {
  return `${item.reference} (${item.translationShort})\n${item.text}\n\nScripture: ${item.translationName} (public domain)`;
}

function render(body: SuccessBody): void {
  results.hidden = false;
  results.replaceChildren();

  if (body.support) {
    const card = element("article", "support-card");
    card.append(
      element("h2", "reference", body.support.title),
      element("p", undefined, body.support.body),
    );
    const list = document.createElement("ul");
    for (const resource of body.support.resources) {
      const item = document.createElement("li");
      const href = safeHref(resource.href);
      if (href) {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = resource.label;
        if (href.startsWith("https://")) {
          link.target = "_blank";
          link.rel = "noreferrer";
        }
        item.append(link);
      } else {
        item.textContent = resource.label;
      }
      list.append(item);
    }
    card.append(list);
    results.append(card);
  }

  document.body.classList.add("showing-result");

  for (const item of body.results) {
    const card = element("article", "result-card");
    const heading = element("div", "result-head");
    heading.append(element("h2", "reference", item.reference));
    if (item.canon === "deuterocanonical") {
      heading.append(element("p", "badge", "Deuterocanonical"));
    }
    card.append(
      heading,
      element("p", "verse", item.text),
      element("p", "kicker", "Why it may relate"),
      element("p", "note", item.whyItRelates),
      element("p", "kicker", "Reflection"),
      element("p", "note", item.encouragement),
    );

    const actions = element("div", "card-actions");
    const chapter = document.createElement("a");
    chapter.className = "button-link secondary";
    chapter.href = `/chapter?book=${encodeURIComponent(item.bookId)}&chapter=${item.chapter}&from=${item.verseStart}&to=${item.verseEnd}`;
    chapter.textContent = "Chapter";
    const copy = element("button", "secondary", "Copy") as HTMLButtonElement;
    copy.type = "button";
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(shareText(item));
        copy.textContent = "Copied";
      } catch {
        copy.textContent = "Copy failed";
      }
    });
    const share = element("button", "secondary", "Share") as HTMLButtonElement;
    share.type = "button";
    share.addEventListener("click", async () => {
      const text = shareText(item);
      if (navigator.share) {
        try {
          await navigator.share({ title: item.reference, text });
          return;
        } catch {
          // Fall back to copy if the share sheet is dismissed or unavailable.
        }
      }
      await navigator.clipboard.writeText(text);
      share.textContent = "Copied";
    });
    actions.append(chapter, copy, share);
    card.append(actions);
    results.append(card);
  }

  results.append(
    element("p", "disclaimer", "A starting point for reflection, not a diagnosis or a guarantee."),
  );

  const row = element("div", "result-actions");
  if (body.hasMore) {
    const again = element("button", "secondary", "Another verse") as HTMLButtonElement;
    again.type = "button";
    again.addEventListener("click", () => {
      void requestPassages(shown);
    });
    row.append(again);
  }
  const restart = element("button", "secondary", "Start over") as HTMLButtonElement;
  restart.type = "button";
  restart.addEventListener("click", () => {
    shown.length = 0;
    lastPrompt = "";
    field.value = "";
    setCount();
    results.hidden = true;
    results.replaceChildren();
    document.body.classList.remove("showing-result");
    clearError();
    field.focus();
  });
  row.append(restart);
  results.append(row);
  window.scrollTo(0, 0);
}

async function requestPassages(exclude: string[]): Promise<void> {
  clearError();
  submit.disabled = true;
  submit.textContent = "Looking for a fitting passage...";
  if (!navigator.onLine) {
    showError("You appear to be offline. A recommendation needs a connection.");
    submit.disabled = false;
    submit.textContent = "Find a Bible verse";
    return;
  }

  try {
    const response = await fetch("/api/recommend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: lastPrompt, exclude }),
    });
    const body: unknown = await response.json();
    if (!response.ok || !body || typeof body !== "object" || !("ok" in body) || body.ok !== true) {
      const message =
        body && typeof body === "object" && "message" in body && typeof body.message === "string"
          ? body.message
          : "Something went wrong. Please try again.";
      showError(message);
      return;
    }
    const success = body as SuccessBody;
    for (const item of success.results) {
      if (!shown.includes(item.id)) shown.push(item.id);
    }
    render(success);
  } catch {
    showError("The request did not finish. Please check your connection and try again.");
  } finally {
    submit.disabled = false;
    submit.textContent = "Find a Bible verse";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  lastPrompt = field.value;
  shown.length = 0;
  void requestPassages([]);
});
