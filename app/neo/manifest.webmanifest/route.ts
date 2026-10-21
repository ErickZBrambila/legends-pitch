export function GET() {
  return Response.json({
    name: "NLFC Neo",
    short_name: "Neo",
    description: "North Legends FC — Neo Panel",
    start_url: "/neo",
    scope: "/neo/",
    display: "standalone",
    background_color: "#1c1c1e",
    theme_color: "#c8102e",
    icons: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
