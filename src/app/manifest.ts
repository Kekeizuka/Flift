import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RepLog — lift. log. repeat.",
    short_name: "RepLog",
    description: "A fast, offline, single-user strength-training log. All data stays on your device.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0b0f",
    theme_color: "#0b0b0f",
    icons: [{ src: "/icon.svg", type: "image/svg+xml", sizes: "any", purpose: "any" }],
  };
}
