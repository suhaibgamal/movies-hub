// src/app/browse/page.jsx
import MoviesListClient from "@/app/components/MoviesListClient";
import { Suspense } from "react";

export const metadata = {
  title: "Browse All Movies & TV Shows - Movies Hub",
  description:
    "Discover, search, and filter through an extensive collection of movies and TV shows. Find your next watch by genre, rating, year, and more on Movies Hub.",
  alternates: {
    canonical: "https://movies.suhaeb.com/browse",
  },
  openGraph: {
    title: "Browse Movies & TV Shows - Movies Hub",
    description:
      "Discover and filter through a vast collection of movies and TV shows.",
    url: "https://movies.suhaeb.com/browse",
    images: [
      {
        url: "https://movies.suhaeb.com/images/default-og.png",
        width: 1200,
        height: 630,
        alt: "Browse Movies & TV Shows on Movies Hub",
      },
    ],
    siteName: "Movies Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Movies & TV Shows - Movies Hub",
    description:
      "Discover and filter through a vast collection of movies and TV shows.",
    images: ["https://movies.suhaeb.com/images/default-og.png"],
  },
};

export default function BrowsePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-muted-foreground">
          Loading movies and TV shows...
        </div>
      }
    >
      <MoviesListClient />
    </Suspense>
  );
}
