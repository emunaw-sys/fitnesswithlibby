import { ImageResponse } from "next/og";

/**
 * The card people see when the site is shared on WhatsApp, iMessage or
 * Facebook. For a studio that grows by word of mouth, more people meet the
 * brand through this image than through the homepage — a shared link that
 * previews as a blank grey box is a wasted introduction.
 *
 * Generated at build time, so there is no PNG to keep in sync with the brand.
 * Two constraints of the satori renderer behind ImageResponse:
 *   - every element with children needs an explicit `display: "flex"`
 *   - next/font doesn't work here, so the faces are fetched below
 */
export const alt =
  "Fitness With Libby — where fitness meets fun. Women-only studio in Beit Shemesh.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Straight from the design tokens in globals.css.
const PLUM = "#35143E";
const GOLD = "#F2A254";
const CREAM = "#FAF4EF";
const GRAD = "linear-gradient(100deg,#F2A254 0%,#E85D8A 45%,#DE2160 100%)";

/**
 * Pull a Google font's TTF at build time. If a fetch fails the card still
 * renders in a fallback face rather than failing the deploy — a plain card
 * beats a broken build.
 */
async function loadFont(family: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@400&display=swap`,
      { headers: { "User-Agent": "Mozilla/5.0" } }
    ).then((r) => r.text());
    const url = css.match(/src: url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function Image() {
  const [bebas, brush] = await Promise.all([
    loadFont("Bebas+Neue"),
    loadFont("Alex+Brush"),
  ]);

  const fonts = [
    bebas && { name: "Bebas", data: bebas, style: "normal" as const, weight: 400 as const },
    brush && { name: "Brush", data: brush, style: "normal" as const, weight: 400 as const },
  ].filter(Boolean) as {
    name: string;
    data: ArrayBuffer;
    style: "normal";
    weight: 400;
  }[];

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
          background: PLUM,
          fontFamily: bebas ? "Bebas" : "sans-serif",
          position: "relative",
        }}
      >
        {/* Gradient bar along the top — the brand's signature mark */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: GRAD,
            display: "flex",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 28,
            letterSpacing: 12,
            textTransform: "uppercase",
            color: GOLD,
            marginBottom: 34,
          }}
        >
          Fitness With Libby
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            color: CREAM,
            fontSize: 96,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Where Fitness Meets
        </div>

        {/* "fun" in the script face, exactly as the hero sets it */}
        <div
          style={{
            display: "flex",
            fontFamily: brush ? "Brush" : "cursive",
            fontSize: 150,
            color: GOLD,
            lineHeight: 1,
            marginTop: 6,
          }}
        >
          fun
        </div>

        <div
          style={{
            display: "flex",
            width: 120,
            height: 3,
            background: GRAD,
            margin: "44px 0 30px",
          }}
        />

        <div
          style={{
            display: "flex",
            fontSize: 30,
            letterSpacing: 4,
            color: "#FAF4EFB0",
            textTransform: "uppercase",
          }}
        >
          Women-only studio · Beit Shemesh
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
