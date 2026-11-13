import type { MetadataRoute } from "next";
import { APP_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4a5ae8",
    lang: "ja",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon.png", sizes: "480x480", type: "image/png", purpose: "any" },
    ],
  };
}
