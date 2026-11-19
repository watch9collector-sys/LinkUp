import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nyvon",
    short_name: "Nyvon",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/nyvon-icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/nyvon-app-icon.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };
}
