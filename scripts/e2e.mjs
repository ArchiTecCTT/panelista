// Production E2E for Panelista. Creates throwaway users, exercises the API, rules
// and Worker, asserts results, then deletes everything it created.
// Run from the repo root: GOOGLE_APPLICATION_CREDENTIALS=admin-sa.json node scripts/e2e.mjs <NEXT_PUBLIC_FIREBASE_API_KEY> <NEXT_PUBLIC_FIREBASE_APP_ID>
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(process.cwd() + "/package.json");
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

const KEY = process.argv[2];
const SITE = "https://panelista.vercel.app";
const WORKER = "https://panelista-worker.eirmonpaculan11.workers.dev";
const PROJECT = "panelista-riecodes";
initializeApp({ credential: cert(require(process.env.GOOGLE_APPLICATION_CREDENTIALS)) });
const auth = getAuth();
const db = getFirestore();
const { getAppCheck } = require("firebase-admin/app-check");
const APP_ID = process.argv[3];
// Stands in for the Turnstile-backed provider a real browser uses.
const AC = (await getAppCheck().createToken(APP_ID, { ttlMillis: 3600000 })).token;
const log = (...a) => console.log("  ok", ...a);

async function mkUser(tag, claims) {
  const u = await auth.createUser({ email: `e2e-${tag}-${Date.now()}@panelista.test`, emailVerified: true, displayName: `E2E ${tag}` });
  created.users.push(u.uid);
  if (claims) await auth.setCustomUserClaims(u.uid, claims);
  const ct = await auth.createCustomToken(u.uid);
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${KEY}`, {
    method: "POST",
    headers: { "content-type": "application/json", referer: SITE + "/" },
    body: JSON.stringify({ token: ct, returnSecureToken: true }),
  });
  const j = await r.json();
  assert.ok(j.idToken, "custom token sign-in: " + JSON.stringify(j.error));
  return { uid: u.uid, token: j.idToken };
}

const api = (who, path, method, body) =>
  fetch(SITE + path, { method, headers: { "content-type": "application/json", authorization: `Bearer ${who.token}`, "x-firebase-appcheck": AC }, body: body && JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json() }));

const fsUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
const rest = (who, path, init = {}) => fetch(`${fsUrl}/${path}`, { ...init, headers: { "content-type": "application/json", authorization: `Bearer ${who.token}`, "x-firebase-appcheck": AC, ...(init.headers ?? {}) } });

const created = { users: [], projects: [], requests: [] };
try {
  const S = await mkUser("student");
  const E = await mkUser("evaluator");
  const X = await mkUser("stranger");
  const A = await mkUser("admin", { admin: true });
  log("4 verified test users signed in");
  const noAc = await fetch(SITE + "/api/profile", { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${S.token}` }, body: "{}" });
  assert.equal(noAc.status, 401);
  const noAcFs = await fetch(`${fsUrl}/profiles?pageSize=5`, { headers: { authorization: `Bearer ${S.token}` } });
  const noAcUp = await fetch(`${WORKER}/proofs`, { method: "POST", headers: { authorization: `Bearer ${S.token}`, "content-type": "image/png" }, body: "x" });
  assert.equal(noAcUp.status, 401);
  log("no App Check token: API 401, Worker 401; Firestore REST without token:", noAcFs.status);

  // Profiles
  const base = { headline: "", bio: "", titles: [], categories: ["web"], skills: ["Laravel"], city: "", modes: ["online"], linkedin: "", school: "CvSU", course: "BSIT", accepting: true, maxActive: 5 };
  assert.equal((await api(S, "/api/profile", "PUT", { ...base, name: "E2E Student", yearsExp: 0, isEvaluator: false })).status, 200);
  assert.equal((await api(E, "/api/profile", "PUT", { ...base, name: "E2E Evaluator", yearsExp: 6, isEvaluator: true })).status, 200);
  const bad = await api(S, "/api/profile", "PUT", { ...base, name: "x", yearsExp: 99, isEvaluator: false });
  assert.equal(bad.status, 400);
  log("profiles saved; invalid profile rejected 400");

  // Client cannot write server-owned fields
  const direct = await rest(S, `profiles/${S.uid}?updateMask.fieldPaths=verified`, { method: "PATCH", body: JSON.stringify({ fields: { verified: { booleanValue: true } } }) });
  assert.equal(direct.status, 403);
  log("direct Firestore write to profile denied 403");

  // Project
  const deadline = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
  const proj = await api(S, "/api/projects", "POST", {
    title: "E2E Library Security System", abstract: "End to end test project, deleted after the run.", school: "CvSU", course: "BSIT",
    categories: ["web"], stack: ["Laravel"], needed: 1, minYears: 3, deadline, formUrl: "", mode: "online",
  });
  assert.equal(proj.status, 200, JSON.stringify(proj.json));
  const projectId = proj.json.id;
  created.projects.push(projectId);
  log("project created", projectId);

  // Request: student invites evaluator
  const req = await api(S, "/api/requests", "POST", { projectId, evaluatorUid: E.uid, note: "Hi! Please evaluate our system." });
  assert.equal(req.status, 200, JSON.stringify(req.json));
  const rid = req.json.id;
  created.requests.push(rid);
  assert.equal((await api(S, "/api/requests", "POST", { projectId, evaluatorUid: E.uid, note: "" })).json.error, "exists");
  log("request created; duplicate blocked");

  // Wrong side cannot accept; stranger cannot read
  assert.equal((await api(S, `/api/requests/${rid}`, "POST", { action: "accept" })).json.error, "initiator-cannot-answer");
  assert.equal((await rest(X, `requests/${rid}`)).status, 403);
  log("initiator cannot accept; stranger read denied 403");

  // Accept
  assert.equal((await api(E, `/api/requests/${rid}`, "POST", { action: "accept" })).status, 200);
  let p = (await db.doc(`projects/${projectId}`).get()).data();
  assert.equal(p.acceptedCount, 1);
  assert.equal(p.status, "filled");
  let ev = (await db.doc(`profiles/${E.uid}`).get()).data();
  assert.equal(ev.activeCount, 1);
  assert.equal(ev.responseCount, 1);
  log("accepted; project filled 1/1; evaluator active=1, response time recorded");

  // Chat via Firestore rules
  const now = { fields: { senderUid: { stringValue: S.uid }, text: { stringValue: "Salamat po!" } } };
  const write = await fetch(`${fsUrl}:commit`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${S.token}`, "x-firebase-appcheck": AC },
    body: JSON.stringify({
      writes: [
        { update: { name: `projects/${PROJECT}/databases/(default)/documents/requests/${rid}/messages/e2e1`, ...now }, updateTransforms: [{ fieldPath: "createdAt", setToServerValue: "REQUEST_TIME" }], currentDocument: { exists: false } },
        { update: { name: `projects/${PROJECT}/databases/(default)/documents/requests/${rid}`, fields: { lastMessage: { stringValue: "Salamat po!" }, lastSender: { stringValue: S.uid } } }, updateMask: { fieldPaths: ["lastMessage", "lastSender"] }, updateTransforms: [{ fieldPath: "lastMessageAt", setToServerValue: "REQUEST_TIME" }] },
      ],
    }),
  });
  assert.equal(write.status, 200, await write.text());
  const spoof = await fetch(`${fsUrl}/requests/${rid}/messages?documentId=e2e2`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${X.token}`, "x-firebase-appcheck": AC },
    body: JSON.stringify({ fields: { senderUid: { stringValue: X.uid }, text: { stringValue: "spam" } } }),
  });
  assert.equal(spoof.status, 403);
  const msgs = await (await rest(E, `requests/${rid}/messages`)).json();
  assert.ok(msgs.documents.some((d) => d.fields.text?.stringValue === "Salamat po!"));
  log("chat message + preview written under rules; stranger write denied; evaluator reads thread");

  // Complete + review
  assert.equal((await api(E, `/api/requests/${rid}`, "POST", { action: "complete" })).status, 200);
  assert.equal((await api(S, `/api/requests/${rid}`, "POST", { action: "complete" })).json.error, "not-accepted");
  ev = (await db.doc(`profiles/${E.uid}`).get()).data();
  assert.equal(ev.activeCount, 0);
  assert.equal(ev.completedCount, 1);
  assert.equal((await api(S, "/api/reviews", "POST", { requestId: rid, stars: 5, tags: ["fast", "helpful"], text: "Ang galing!" })).status, 200);
  assert.equal((await api(S, "/api/reviews", "POST", { requestId: rid, stars: 1, tags: [], text: "" })).json.error, "already-reviewed");
  assert.equal((await api(E, "/api/reviews", "POST", { requestId: rid, stars: 4, tags: ["organized"], text: "" })).status, 200);
  ev = (await db.doc(`profiles/${E.uid}`).get()).data();
  const st = (await db.doc(`profiles/${S.uid}`).get()).data();
  assert.equal(ev.evalRatingCount, 0, "brand-new accounts must not move ratings");
  assert.equal(st.studentRatingCount, 0);
  assert.equal((await db.doc(`reviews/${rid}_student`).get()).get("counted"), false);
  log("evaluator completes; double-complete blocked; two-way reviews saved; duplicate blocked; new-account reviews not counted (anti-farm)");

  // Worker upload + admin-only read + delete
  const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex");
  const up = await fetch(`${WORKER}/proofs`, { method: "POST", headers: { authorization: `Bearer ${E.token}`, "x-firebase-appcheck": AC, "content-type": "image/png", "x-file-name": "id.png" }, body: png });
  assert.equal(up.status, 201, await up.clone().text());
  const { key } = await up.json();
  const svg = await fetch(`${WORKER}/proofs`, { method: "POST", headers: { authorization: `Bearer ${E.token}`, "x-firebase-appcheck": AC, "content-type": "image/png" }, body: "<svg onload=alert(1)>" });
  assert.equal(svg.status, 415);
  assert.equal((await fetch(`${WORKER}/proofs/${encodeURIComponent(key)}`, { headers: { authorization: `Bearer ${E.token}`, "x-firebase-appcheck": AC } })).status, 403);
  const adminGet = await fetch(`${WORKER}/proofs/${encodeURIComponent(key)}`, { headers: { authorization: `Bearer ${A.token}`, "x-firebase-appcheck": AC } });
  assert.equal(adminGet.status, 200);
  assert.equal(adminGet.headers.get("content-type"), "image/png");
  assert.equal((await api(E, "/api/verification", "POST", { files: [{ key, name: "id.png", type: "image/png", size: png.length }], note: "" })).status, 200);
  assert.equal((await api(A, "/api/admin", "POST", { op: "verify", uid: E.uid, decision: "approve", reason: "" })).status, 200);
  assert.equal((await db.doc(`profiles/${E.uid}`).get()).get("verified"), true);
  assert.equal((await fetch(`${WORKER}/proofs/${encodeURIComponent(key)}`, { method: "DELETE", headers: { authorization: `Bearer ${A.token}`, "x-firebase-appcheck": AC } })).status, 200);
  assert.equal((await api(S, "/api/admin", "POST", { op: "verify", uid: E.uid, decision: "approve", reason: "" })).status, 403);
  log("upload sniffed (svg 415); owner GET 403; admin GET 200; verification approved; non-admin admin call 403");

  console.log("\nE2E PASSED");
} finally {
  // Cleanup everything created by this run.
  for (const rid of created.requests) {
    const msgs = await db.collection(`requests/${rid}/messages`).get();
    await Promise.all(msgs.docs.map((d) => d.ref.delete()));
    await db.doc(`requests/${rid}`).delete();
    await Promise.all(["student", "evaluator"].map((s) => db.doc(`reviews/${rid}_${s}`).delete()));
  }
  for (const id of created.projects) await db.doc(`projects/${id}`).delete();
  for (const uid of created.users) {
    await db.doc(`profiles/${uid}`).delete();
    await db.doc(`verifications/${uid}`).delete();
    const rl = await db.collection("ratelimits").where("__name__", ">=", uid).where("__name__", "<", uid + "\uf8ff").get();
    await Promise.all(rl.docs.map((d) => d.ref.delete()));
    await auth.deleteUser(uid).catch(() => {});
  }
  console.log("cleanup done:", created.users.length, "users,", created.projects.length, "projects,", created.requests.length, "requests");
}
