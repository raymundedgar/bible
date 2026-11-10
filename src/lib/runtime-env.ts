import { env } from "cloudflare:workers";

export function cloudflareBindings(): Record<string, unknown> {
  return env as unknown as Record<string, unknown>;
}
