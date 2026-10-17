import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Panelista: find IT expert evaluators for your capstone";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Link preview for Facebook/Messenger shares (that is how students find this).
export default async function OgImage() {
  const svg = await readFile(join(process.cwd(), "public/brand/logo-mark.svg"));
  const mark = `data:image/svg+xml;base64,${svg.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#176B55", color: "#F5F8F3" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={120} height={120} alt="" style={{ borderRadius: 28, border: "4px solid #F5F8F3" }} />
          <span style={{ fontSize: 88, fontWeight: 800 }}>Panelista</span>
        </div>
        <div style={{ marginTop: 40, fontSize: 52, fontWeight: 700, lineHeight: 1.2 }}>Hanap ng IT expert evaluator para sa capstone mo.</div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#F2B544" }}>Libre · Verified badges · Marketplace-style ratings</div>
      </div>
    ),
    size,
  );
}
