"use client";
import { useState } from "react";
import { api } from "@/lib/firebase";
import { useApp } from "./app-provider";
import { ErrorText, Modal } from "./ui";

const REASONS = [
  ["fake", "reasonFake"],
  ["spam", "reasonSpam"],
  ["rude", "reasonRude"],
  ["scam", "reasonScam"],
  ["other", "reasonOther"],
] as const;

export function ReportButton({ targetUid }: { targetUid: string }) {
  const { t } = useApp();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number][0]>("fake");
  const [details, setDetails] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setState("busy");
    setErr(null);
    try {
      await api("/api/reports", "POST", { targetUid, reason, details: details.trim() });
      setState("done");
    } catch (e) {
      setErr((e as Error).message);
      setState("idle");
    }
  }

  return (
    <>
      <button className="self-start text-xs text-muted underline hover:text-red-700" onClick={() => setOpen(true)}>
        {t("report")}
      </button>
      {open && (
        <Modal title={t("reportTitle")} onClose={() => setOpen(false)}>
          {state === "done" ? (
            <p>{t("reportSent")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              <fieldset className="flex flex-col gap-2">
                {REASONS.map(([v, k]) => (
                  <label key={v} className="flex items-center gap-2 text-sm">
                    <input type="radio" name="reason" value={v} checked={reason === v} onChange={() => setReason(v)} className="accent-brand" />
                    {t(k)}
                  </label>
                ))}
              </fieldset>
              <textarea className="input min-h-24" maxLength={500} placeholder={t("reportDetails")} value={details} onChange={(e) => setDetails(e.target.value)} aria-label={t("reportDetails")} />
              <ErrorText code={err} />
              <button className="btn-danger" disabled={state === "busy"} onClick={submit}>
                {t("report")}
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}
