// src/app/browse/page.jsx
import MoviesListClient from "@/app/components/MoviesListClient";
import { Suspense } from "react";
// If you were using SearchParamsProvider, ensure it's correctly set up or remove if not needed by MoviesListClient directly on server for initial state
// import { SearchParamsProvider } from "@/app/context/SearchParamsContext";

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
    type: "website", // Or 'list' / 'collection' if more appropriate
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Movies & TV Shows - Movies Hub",
    description:
      "Discover and filter through a vast collection of movies and TV shows.",
    images: ["https://movies.suhaeb.com/images/default-og.png"],
  },
};

export default function BrowsePage({ searchParams }) {
  // The searchParams object is available to Server Components.
  // MoviesListClient is a Client Component and will use `useSearchParams()` hook to get them.
  // No need to pass searchParams as a prop if MoviesListClient uses the hook.
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-muted-foreground">
          Loading movies and TV shows...
        </div>
      }
    >
      {/* If SearchParamsProvider was for passing initial server searchParams to client context, 
          and MoviesListClient now uses useSearchParams(), it might not be needed.
          For now, I'll assume MoviesListClient handles its own searchParams.
      */}
      {/* <SearchParamsProvider initialSearchParams={searchParams}> */}
      <MoviesListClient />
      {/* </SearchParamsProvider> */}
    </Suspense>
  );
}
