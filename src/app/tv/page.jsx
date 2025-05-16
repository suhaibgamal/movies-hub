import { Suspense } from "react";
import SeriesListClient from "@/app/components/SeriesListClient";
import SkeletonLoader from "@/app/components/SkeletonLoader"; // Or a more specific grid skeleton

export const metadata = {
  title: "TV Shows - Movies Hub",
  description: "Discover and explore a wide range of TV shows.",
};

export default function TvShowsPage() {
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          Popular TV Shows
        </h1>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <SkeletonLoader key={index} />
              ))}
            </div>
          }
        >
          <SeriesListClient />
        </Suspense>
      </div>
    </main>
  );
}
