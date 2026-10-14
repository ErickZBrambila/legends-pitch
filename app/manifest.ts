import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "North Legends FC",
    short_name: "NLFC",
    description:
      "Official website of the North Legends FC youth soccer team — schedules, roster, news, and more.",
    start_url: "/",
    display: "standalone",
    background_color: "#1c1c1e",
    theme_color: "#c8102e",
    icons: [
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
