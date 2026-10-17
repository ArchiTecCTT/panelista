"use client";
import { useEffect } from "react";
import { reportError } from "@/lib/firebase";
import "./globals.css";

// A crash in the root layout itself (header, providers). No AppProvider here, so both languages.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => reportError(error), [error]);
  return (
    <html lang="fil" translate="no">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center font-sans">
        <p className="max-w-sm text-muted">
          May nag-error sa page na ito. Na-report na namin.
          <br />
          Something broke on this page. We logged it.
        </p>
        <button className="btn-primary" onClick={() => location.reload()}>
          Reload
        </button>
      </body>
    </html>
  );
}
