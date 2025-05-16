import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  getCachedTvShowDetails,
  getCachedTvShowCredits,
  getCachedTvShowRecommendations,
} from "@/lib/tmdb"; // Updated imports
import SkeletonLoader from "@/app/components/SkeletonLoader";
import InteractiveFeatures from "@/app/components/InteractiveFeatures"; // Re-evaluate if this needs to be TV-specific
import WatchlistButton from "@/app/components/WatchlistButton";

export async function generateStaticParams() {
  // Fetch popular TV shows for static generation
  const res = await fetch(
    `https://api.themoviedb.org/3/tv/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
  );
  const popular = await res.json();
  return popular.results.map((series) => ({ id: series.id.toString() }));
}

export const revalidate = 3600; // Revalidate hourly

export async function generateMetadata({ params }) {
  const { id } = params;
  try {
    const series = await getCachedTvShowDetails(id);
    return {
      title: `${series.name} - Movies Hub`,
      description: series.overview || "TV series details",
      alternates: {
        canonical: `https://movies.suhaeb.com/tv/${id}`, // Update canonical URL
      },
    };
  } catch (error) {
    return {
      title: "TV Series Not Found - Movies Hub",
      description: "TV series details not available",
    };
  }
}

export default async function TvShowPage({ params }) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/tv/${id}`)}`);
  }
  if (!id || !/^\d+$/.test(id)) {
    // Or redirect to a proper not-found page
    return (
      <p className="text-center text-lg font-semibold">TV Series not found.</p>
    );
  }

  try {
    const [seriesData, creditsData, recommendationsData] = await Promise.all([
      getCachedTvShowDetails(id),
      getCachedTvShowCredits(id),
      getCachedTvShowRecommendations(id),
    ]);

    // For TV shows, a specific "trailerKey" might not be directly available for the whole series.
    // This might need adjustment based on how/if you want to display trailers (e.g., first season trailer).
    // For now, we pass null or undefined for trailerKey to InteractiveFeatures.
    const trailerKey = null; // Placeholder

    const cast = creditsData.cast?.slice(0, 10) || [];
    const firstAirYear = seriesData.first_air_date
      ? new Date(seriesData.first_air_date).getFullYear()
      : "N/A";
    const rating = seriesData.vote_average
      ? seriesData.vote_average.toFixed(1)
      : "N/A";
    const ratingColor =
      rating >= 7
        ? "bg-blue-600"
        : rating >= 5
        ? "bg-purple-600"
        : "bg-red-600";
    const genres =
      seriesData.genres?.map((genre) => genre.name).filter(Boolean) || [];

    return (
      <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<SkeletonLoader />}>
            <article className="flex flex-col rounded-xl bg-card shadow-xl lg:flex-row min-w-0">
              {/* Poster Section */}
              <div className="min-w-0 lg:w-1/3 xl:w-1/2 flex-shrink-0">
                <Image
                  unoptimized
                  src={
                    seriesData.poster_path
                      ? `https://image.tmdb.org/t/p/w780${seriesData.poster_path}`
                      : "/images/default.webp"
                  }
                  alt={`${seriesData.name} poster`}
                  width={780}
                  height={1170}
                  className="aspect-[2/3] w-full object-cover"
                  placeholder="blur"
                  blurDataURL="/images/default-blur.webp"
                  quality={75}
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                />
              </div>

              {/* Content Section */}
              <div className="min-w-0 flex-1 p-4 lg:p-6 flex flex-col relative">
                <div className="absolute top-4 right-4 z-10">
                  {/* Ensure WatchlistButton is correctly adapted for item and itemType */}
                  <WatchlistButton
                    item={{ ...seriesData, title: seriesData.name }}
                    itemType="TV"
                  />
                </div>

                <header className="mb-4 pr-12">
                  <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl lg:text-4xl break-words">
                    {seriesData.name}
                  </h1>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span
                      className={`${ratingColor} px-2 py-1 rounded-full text-xs font-bold text-white`}
                    >
                      ⭐ {rating}
                    </span>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full font-bold">
                      {firstAirYear}
                    </span>
                    {seriesData.number_of_seasons && (
                      <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                        {seriesData.number_of_seasons} Season
                        {seriesData.number_of_seasons > 1 ? "s" : ""}
                      </span>
                    )}
                    {genres.map((genre) => (
                      <span
                        key={genre}
                        className="text-sm text-muted-foreground font-medium bg-muted px-2 py-1 rounded-full"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </header>

                <section className="mb-6">
                  <h2 className="mb-2 text-xl font-semibold text-card-foreground">
                    Overview
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {seriesData.overview || "No overview available..."}
                  </p>
                </section>

                <div className="pt-4 border-t border-muted/30 min-w-0">
                  <InteractiveFeatures
                    trailerKey={trailerKey} // May need a different approach for TV trailers
                    cast={cast}
                    movieFound={true} // Assuming if page loads, TV show is found. This prop might need to be re-evaluated for TV context.
                    movie={seriesData} // Passing seriesData, InteractiveFeatures might need to handle this generally
                    recommendations={recommendationsData}
                  />
                </div>
              </div>
            </article>
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error fetching TV show page:", error);
    redirect("/not-found"); // Redirect to a generic not-found page
  }
}
