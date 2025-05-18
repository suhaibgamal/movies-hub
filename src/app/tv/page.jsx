// src/app/tv/page.jsx
import { redirect } from "next/navigation";

export const metadata = {
  title: "TV Shows - Movies Hub",
  description:
    "Discover and explore a wide range of TV shows on Movies Hub. Browse popular, top-rated, and trending TV series.",
  alternates: { canonical: "https://movies.suhaeb.com/browse?itemType=TV" },
};

export default function TvPageRedirect() {
  redirect("/browse?itemType=TV");
  // Next.js will handle the redirect; returning null or minimal content is good practice.
  // return null;
}
