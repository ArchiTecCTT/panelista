import { body, db, FieldValue, HttpError, rateLimit, requireUser, route } from "@/lib/server";
import { verificationSchema } from "@/lib/schemas";

// Files are uploaded to the Cloudflare Worker (R2) first; this only records
// the keys. Keys must sit under the caller's own prefix.
export const POST = route(async (req) => {
  const user = await requireUser(req);
  const input = verificationSchema.parse(await body(req));
  if (!input.files.every((f) => f.key.startsWith(`proofs/${user.uid}/`))) throw new HttpError(400, "bad-key");
  const profile = await db().doc(`profiles/${user.uid}`).get();
  if (!profile.get("isEvaluator")) throw new HttpError(400, "not-evaluator");
  await rateLimit(user.uid, "verify", 3);
  await db().doc(`verifications/${user.uid}`).set({
    uid: user.uid,
    name: profile.get("name"),
    headline: profile.get("headline") ?? "",
    linkedin: profile.get("linkedin") ?? "",
    yearsExp: profile.get("yearsExp") ?? 0,
    files: input.files,
    note: input.note,
    status: "pending",
    reason: "",
    submittedAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
});
