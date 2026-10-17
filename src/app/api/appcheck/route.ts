import { getAppCheck } from "firebase-admin/app-check";
import { app, body, HttpError, route } from "@/lib/server";
import { z } from "zod";

// Custom App Check provider: a Cloudflare Turnstile pass buys a 1-hour App
// Check token. Firestore enforces App Check, so scripts without a real
// browser session on our site cannot read or write it.
const schema = z.object({ turnstile: z.string().min(10).max(4096) });
const TTL = 60 * 60 * 1000;
const ALLOWED_HOSTS = new Set(["panelista.vercel.app", "localhost"]);

export const POST = route(
  async (req) => {
    const { turnstile } = schema.parse(await body(req));
    const form = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET ?? "", response: turnstile });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (ip) form.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
    const v = (await res.json()) as { success: boolean; hostname?: string };
    if (!v.success || !ALLOWED_HOSTS.has(v.hostname ?? "")) throw new HttpError(403, "bot-check-failed");
    const t = await getAppCheck(app()).createToken(process.env.NEXT_PUBLIC_FIREBASE_APP_ID!, { ttlMillis: TTL });
    return { token: t.token, expireTimeMillis: Date.now() + t.ttlMillis };
  },
  { appCheck: false },
);
