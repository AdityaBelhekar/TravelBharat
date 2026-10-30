import { ImageResponse } from "next/og";

export const alt = "TravelBharat: Explore India state by state";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share image for pages that don't have a photo of their own.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#fbf7f0", color: "#1f2433" }}>
        <div style={{ fontSize: 40, color: "#b9501f", fontWeight: 700 }}>TravelBharat</div>
        <div style={{ fontSize: 84, fontWeight: 700, marginTop: 24, lineHeight: 1.1 }}>Explore India, state by state.</div>
        <div style={{ fontSize: 32, marginTop: 32, color: "#6b6f7b" }}>28 states · 8 union territories · heritage, nature, religious and adventure</div>
      </div>
    ),
    size,
  );
}
