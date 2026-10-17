import { body, db, FieldValue, rateLimit, route } from "@/lib/server";
import { clientErrorSchema } from "@/lib/schemas";

// Crash reports from the error screens (src/app/error.tsx, global-error.tsx).
// No login or App Check: the crash may be in sign-in or App Check itself.
export const POST = route(
  async (req) => {
    const input = clientErrorSchema.parse(await body(req));
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim().replace(/[^\w.:-]/g, "") || "unknown";
    await rateLimit(`ip-${ip}`, "client-error", 30);
    console.error("client-error", JSON.stringify(input));
    await db().collection("clientErrors").add({ ...input, createdAt: FieldValue.serverTimestamp() });
    return { ok: true };
  },
  { appCheck: false },
);
