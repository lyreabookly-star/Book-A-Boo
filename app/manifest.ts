import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Book-A-Boo",
    short_name: "Book-A-Boo",
    description: "Découvrez, lisez et partagez des histoires sans frontières.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone"],
    orientation: "any",
    background_color: "#f7f6f2",
    theme_color: "#f7f6f2",
    categories: ["books", "education", "entertainment"],
    icons: [
      { src: "/icons/icon-dark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
