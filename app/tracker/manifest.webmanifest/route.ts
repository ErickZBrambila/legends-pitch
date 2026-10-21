export function GET() {
  return Response.json({
    name: "NLFC Tracker",
    short_name: "Tracker",
    description: "North Legends FC — Session Tracker",
    start_url: "/tracker",
    scope: "/tracker/",
    display: "standalone",
    background_color: "#1c1c1e",
    theme_color: "#c8102e",
    icons: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
