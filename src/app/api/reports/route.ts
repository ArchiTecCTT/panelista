import { body, db, FieldValue, HttpError, rateLimit, requireUser, route } from "@/lib/server";
import { reportSchema } from "@/lib/schemas";

export const POST = route(async (req) => {
  const user = await requireUser(req);
  const input = reportSchema.parse(await body(req));
  if (input.targetUid === user.uid) throw new HttpError(400, "self");
  await rateLimit(user.uid, "report", 10);
  await db().collection("reports").add({ ...input, reporterUid: user.uid, status: "open", createdAt: FieldValue.serverTimestamp() });
  return { ok: true };
});
