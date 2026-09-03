import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SheetNative — AI Business Operating System";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #07090f 0%, #1e1b4b 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
            }}
          >
            ✦
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2 }}>
            SheetNative
          </div>
        </div>
        <div style={{ fontSize: 36, color: "#c7d2fe", textAlign: "center", padding: "0 80px" }}>
          Upload an Excel workbook. AI builds your entire business software.
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 24,
            padding: "12px 36px",
            borderRadius: 999,
            border: "1px solid rgba(99,102,241,0.5)",
            color: "#a5b4fc",
          }}
        >
          Web · Mobile · Desktop · AI Employees
        </div>
      </div>
    ),
    { ...size }
  );
}
