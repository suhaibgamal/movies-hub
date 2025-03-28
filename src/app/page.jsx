// app/page.jsx
import MoviesListClient from "@/app/MoviesListClient";
import { Suspense } from "react";

export const metadata = {
  title: "Movies Hub - Home",
  description: "Discover and search movies on Movies Hub.",
  openGraph: {
    title: "Movies Hub",
    description: "Discover and search movies on Movies Hub.",
    url: "https://movies.suhaeb.com/",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: { card: "summary_large_image" },
  alternate: { canonical: "https://movies.suhaeb.com/" },
};

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading movies...</div>}>
      <MoviesListClient />
    </Suspense>
  );
}
