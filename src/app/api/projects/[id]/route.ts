import { body, db, FieldValue, HttpError, requireUser, route } from "@/lib/server";
import { projectPatchSchema } from "@/lib/schemas";
import { projectStatusFor } from "@/lib/domain";

export const PATCH = route(async (req, ctx) => {
  const user = await requireUser(req);
  const { id } = await ctx.params;
  const input = projectPatchSchema.parse(await body(req));
  const ref = db().doc(`projects/${id}`);
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpError(404, "not-found");
    if (snap.get("ownerUid") !== user.uid) throw new HttpError(403, "not-owner");
    const { status, deadline, ...rest } = input;
    const needed = rest.needed ?? snap.get("needed");
    const current = status === "closed" ? "closed" : status === "open" ? "open" : snap.get("status");
    tx.update(ref, {
      ...rest,
      ...(rest.stack ? { stackLower: rest.stack.map((s) => s.toLowerCase()) } : {}),
      ...(deadline ? { deadline: new Date(deadline + "T23:59:59+08:00") } : {}),
      status: projectStatusFor(current, snap.get("acceptedCount"), needed),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
});
