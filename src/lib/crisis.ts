const CRISIS_PATTERNS: RegExp[] = [
  /\bsuicid(?:e|al)\b/i,
  /\bkill myself\b/i,
  /\bkilling myself\b/i,
  /\bend my life\b/i,
  /\bwant to die\b/i,
  /\bwish (?:that )?i (?:was|were) dead\b/i,
  /\bself[-\s]?harm\b/i,
  /\bhurt myself\b/i,
  /\bharm myself\b/i,
  /\bcutting myself\b/i,
  /\bcut myself\b/i,
  /\bdon'?t want to (?:live|be alive)\b/i,
  /\bno reason to live\b/i,
  /\b(?:want|going|plan) to (?:kill|hurt|harm) (?:someone|him|her|them|people)\b/i,
];

export interface SupportResource {
  label: string;
  href?: string;
}

export interface SupportNotice {
  title: string;
  body: string;
  resources: SupportResource[];
}

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

export function supportNotice(): SupportNotice {
  return {
    title: "Please reach out to a person who can help right now",
    body: "If you might be in danger, or thinking about harming yourself or someone else, contact local emergency services or a crisis line. This app cannot provide emergency help, and a Bible passage is not a substitute for immediate human support.",
    resources: [
      {
        label: "Find a helpline near you",
        href: "https://findahelpline.com/",
      },
      {
        label: "International Association for Suicide Prevention",
        href: "https://www.iasp.info/suicidalthoughts/",
      },
      {
        label: "United States and Canada: call or text 988",
        href: "tel:988",
      },
    ],
  };
}
