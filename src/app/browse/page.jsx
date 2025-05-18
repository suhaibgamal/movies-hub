// src/app/browse/page.jsx
import MoviesListClient from "@/app/components/MoviesListClient"; // Verify this path is correct
import { Suspense } from "react";

export const metadata = {
  title: "Browse Movies & TV Shows - Movies Hub",
  description:
    "Explore a vast collection of movies and TV shows. Filter by genre, rating, year, and more.",
  // Add canonical URL if you plan for this page to be indexed with specific default filters
  // alternates: { canonical: "https://movies.suhaeb.com/browse" },
};

export default function BrowsePage() {
  return (
    // Wrap MoviesListClient with its context provider if it's not already globally provided
    // in a way that covers this page. Since layout.jsx has MoviesListProvider,
    // it should already be available. If MoviesListClient specifically needs its *own*
    // fresh instance or if there were issues, you'd add it here.
    // For now, assuming global provider in layout.jsx is sufficient.

    // <MoviesListProvider> // Usually not needed here if already in RootLayout
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="container mx-auto">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-xl bg-card p-4 aspect-[2/3]"
                >
                  <div className="w-full h-full bg-muted shimmer" />
                </div>
              ))}
            </div>
          }
        >
          <MoviesListClient />
        </Suspense>
      </div>
    </main>
    // </MoviesListProvider>
  );
}
