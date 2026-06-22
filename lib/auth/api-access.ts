import { timingSafeEqual } from "node:crypto";
import { getConfig } from "@/lib/config/env";
import { isAuthenticated } from "./session";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/**
 * Grant access to the Athenea REST API when either:
 *  - a valid admin session cookie is present (browser use), or
 *  - a matching `x-api-key` header is sent AND EXPORT_API_KEY is configured
 *    (machine/integration use).
 */
export async function hasApiAccess(req: Request): Promise<boolean> {
  const apiKey = getConfig().exportApiKey;
  if (apiKey) {
    const provided = req.headers.get("x-api-key");
    if (provided && safeEqual(provided, apiKey)) return true;
  }
  return isAuthenticated();
}
