export function GET() {
  return Response.json({
    name: "NLFC Admin",
    short_name: "Admin",
    description: "North Legends FC — Admin Panel",
    start_url: "/admin",
    scope: "/admin/",
    display: "standalone",
    background_color: "#1c1c1e",
    theme_color: "#c8102e",
    icons: [{ src: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  }, { headers: { "Content-Type": "application/manifest+json" } });
}
