import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #1A1612 0%, #070707 100%)",
          borderRadius: 40,
          border: "8px solid #C9A35A",
          color: "#E6C37A",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: -2,
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        HB
      </div>
    ),
    { ...size },
  );
}
