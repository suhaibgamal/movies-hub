// src/app/movie/[id]/page.jsx

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  getCachedMovieData,
  getCachedTrailerData,
  getCachedCredits,
  getCachedRecommendations,
  checkLinkStability,
} from "@/lib/tmdb";
import SkeletonLoader from "@/app/components/SkeletonLoader";
import InteractiveFeatures from "@/app/components/InteractiveFeatures";
import WatchlistButton from "@/app/components/WatchlistButton";
import DetailItem from "@/app/components/DetailItem"; // <<< IMPORTED SHARED COMPONENT
// Icons used in this page for DetailItem
import {
  Star as StarIcon,
  Film,
  Info,
  ExternalLink as ExternalLinkIcon,
  CalendarDays,
} from "lucide-react";

const BASE_URL_FOR_STATIC_PARAMS = "https://api.themoviedb.org/3";

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${BASE_URL_FOR_STATIC_PARAMS}/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=en-US&page=1`
    );
    if (!res.ok) {
      console.error(
        "Failed to fetch popular movies for static params:",
        res.status
      );
      return [];
    }
    const popular = await res.json();
    return (popular.results || [])
      .slice(0, 20)
      .map((movie) => ({ id: movie.id.toString() }));
  } catch (error) {
    console.error("Error in generateStaticParams for Movies:", error);
    return [];
  }
}

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = params;
  try {
    const movie = await getCachedMovieData(id);
    if (!movie || Object.keys(movie).length === 0) {
      console.warn(`No movie data found for metadata, ID: ${id}`);
      throw new Error("Movie not found for metadata");
    }
    return {
      title: `${movie.title || "Movie"} - Movies Hub`,
      description:
        movie.overview ||
        `Details about the movie ${
          movie.title || ""
        }, including cast, ratings, and trailers.`,
      alternates: {
        canonical: `https://movies.suhaeb.com/movie/${id}`,
      },
      openGraph: {
        title: `${movie.title || "Movie"} - Movies Hub`,
        description:
          movie.overview ||
          `Detailed information about the movie ${movie.title || ""}.`,
        images: movie.poster_path
          ? [`https://image.tmdb.org/t/p/w780${movie.poster_path}`]
          : ["/images/default-og.png"],
        type: "video.movie",
      },
    };
  } catch (error) {
    console.error(
      `Error generating metadata for Movie ID ${id}:`,
      error.message
    );
    return {
      title: "Movie Not Found - Movies Hub",
      description: "Details for this movie could not be loaded.",
    };
  }
}

export default async function MoviePage({ params }) {
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/movie/${id}`)}`);
  }

  if (!id || !/^\d+$/.test(id)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-center text-xl font-semibold text-destructive">
          Invalid Movie ID.
        </p>
      </main>
    );
  }

  try {
    const movie = await getCachedMovieData(id); // Fetches details, videos, external_ids

    if (!movie || Object.keys(movie).length === 0) {
      throw new Error(
        `No data returned for movie ID ${id}. It might not exist.`
      );
    }

    // Note: movie.videos and movie.external_ids are now fetched by getCachedMovieData
    // The separate calls to getCachedTrailerData might be redundant if the former is sufficient.
    // For now, we'll keep it to ensure trailerKey logic doesn't break if movie.videos is missing.
    const [trailerData, creditsData, isFound, recommendationsData] =
      await Promise.all([
        getCachedTrailerData(id, "movie"), // Can potentially be removed if movie.videos is reliable
        getCachedCredits(id, "movie"),
        checkLinkStability(id, "movie"),
        getCachedRecommendations(id, "movie"),
      ]);

    const trailerKey =
      movie.videos?.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube" && v.official
      )?.key ||
      movie.videos?.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      )?.key ||
      trailerData.results.find(
        // Fallback to separate trailerData fetch
        (v) => v.type === "Trailer" && v.site === "YouTube" && v.official
      )?.key ||
      trailerData.results.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      )?.key;

    const cast = creditsData.cast?.slice(0, 12) || [];
    const releaseYear = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "N/A";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const ratingColor =
      rating >= 7
        ? "bg-blue-600"
        : rating >= 5
        ? "bg-purple-600"
        : "bg-red-600";
    const genres =
      movie.genres?.map((genre) => genre.name).filter(Boolean) || [];
    const runtime = movie.runtime
      ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
      : null;
    const budget = movie.budget ? `$${movie.budget.toLocaleString()}` : null; // For display
    const revenue = movie.revenue ? `$${movie.revenue.toLocaleString()}` : null; // For display
    const homepageLink = movie.homepage;
    const imdbId = movie.external_ids?.imdb_id;

    return (
      <div className="min-h-screen bg-background py-6 px-2 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<SkeletonLoader />}>
            <article className="flex flex-col rounded-xl bg-card shadow-xl lg:flex-row min-w-0 overflow-hidden">
              <div className="min-w-0 lg:w-[300px] xl:w-[380px] flex-shrink-0 bg-muted">
                <Image
                  unoptimized
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
                      : "/images/default.webp"
                  }
                  alt={`${movie.title || "Movie"} poster`}
                  width={780}
                  height={1170}
                  className="aspect-[2/3] w-full object-cover lg:rounded-l-xl lg:rounded-r-none"
                  placeholder="blur"
                  blurDataURL="/images/default-blur.webp"
                  quality={80}
                  priority
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 300px, 380px"
                />
              </div>

              <div className="min-w-0 flex-1 p-4 py-5 sm:p-5 lg:p-6 flex flex-col">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div className="pr-10 flex-grow min-w-0">
                    <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl xl:text-4xl break-words leading-tight">
                      {movie.title}
                    </h1>
                    {movie.tagline && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        "{movie.tagline}"
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 z-10">
                    <WatchlistButton item={movie} itemType="MOVIE" />
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 mt-1 mb-4 flex-wrap text-xs">
                  {parseFloat(rating) > 0 && (
                    <span
                      className={`${ratingColor} px-2 py-0.5 rounded-full font-bold text-white flex items-center gap-1`}
                    >
                      <StarIcon size={12} /> {rating}
                    </span>
                  )}
                  <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                    {releaseYear}
                  </span>
                  {runtime && (
                    <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                      {runtime}
                    </span>
                  )}
                  {genres.slice(0, 3).map((genre) => (
                    <span
                      key={genre}
                      className="text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full truncate"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <section className="mb-4 sm:mb-5">
                  <h2 className="mb-1.5 text-lg sm:text-xl font-semibold text-card-foreground">
                    Overview
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4 hover:line-clamp-none transition-all duration-300 ease-in-out">
                    {movie.overview || "No overview available for this movie."}
                  </p>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-4 sm:mb-5">
                  <DetailItem
                    icon={
                      <Film
                        size={16}
                        className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                      />
                    }
                    label="Status"
                    value={movie.status}
                  />
                  {movie.budget > 0 && (
                    <DetailItem
                      icon={
                        <Info
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Budget"
                      value={budget}
                    />
                  )}
                  {movie.revenue > 0 && (
                    <DetailItem
                      icon={
                        <Info
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Revenue"
                      value={revenue}
                    />
                  )}
                  {homepageLink && (
                    <DetailItem
                      icon={
                        <ExternalLinkIcon
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Homepage"
                      value={homepageLink}
                      isLink={true}
                    />
                  )}
                  {imdbId && (
                    <DetailItem
                      icon={
                        <Info
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="IMDb"
                      value={`https://www.imdb.com/title/${imdbId}`}
                      isLink={true}
                    />
                  )}
                </div>

                <div className="pt-4 border-t border-border/30 mt-auto min-w-0">
                  <InteractiveFeatures
                    itemType="MOVIE"
                    item={movie}
                    trailerKey={trailerKey}
                    cast={cast}
                    itemFound={isFound}
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
    console.error(
      `Error fetching movie page (id: ${id}): ${error.message}`,
      error.stack
    );
    const errorQueryParam =
      error.message.includes("No data returned") ||
      error.message.includes("not found for metadata")
        ? `?error=movie_not_found&id=${id}`
        : "?error=movie_load_failed";
    redirect(`/not-found${errorQueryParam}`);
  }
}
