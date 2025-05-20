// src/app/movie/[id]/page.jsx
// No longer importing redirect for the entire page based on session
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation"; // Import notFound
import {
  getCachedMovieData,
  // getCachedTrailerData, // This data is part of getCachedMovieData now
  getCachedCredits,
  getCachedRecommendations,
  checkLinkStability,
} from "@/lib/tmdb";
import SkeletonLoader from "@/app/components/SkeletonLoader";
import InteractiveFeatures from "@/app/components/InteractiveFeatures";
import WatchlistButton from "@/app/components/WatchlistButton";
import DetailItem from "@/app/components/DetailItem";
import {
  Star as StarIcon,
  Film,
  Info,
  ExternalLink as ExternalLinkIcon,
  CalendarDays,
} from "lucide-react";

const BASE_URL_FOR_STATIC_PARAMS = "https://api.themoviedb.org/3";

// Function to generate ISO 8601 duration from minutes
function formatDuration(minutes) {
  if (!minutes || typeof minutes !== "number" || minutes <= 0) {
    return null;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  let duration = "PT";
  if (hours > 0) {
    duration += `${hours}H`;
  }
  if (remainingMinutes > 0) {
    duration += `${remainingMinutes}M`;
  }
  if (duration === "PT") return null;
  return duration;
}

function generateMovieStructuredData(movie, canonicalUrl, cast, directors) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.overview,
    datePublished: movie.release_date,
    url: canonicalUrl,
    image: movie.poster_path
      ? `https://image.tmdb.org/t/p/original${movie.poster_path}`
      : undefined,
  };
  if (directors && directors.length > 0) {
    structuredData.director = directors.map((d) => ({
      "@type": "Person",
      name: d.name,
    }));
  }
  if (cast && cast.length > 0) {
    structuredData.actor = cast
      .slice(0, 5)
      .map((a) => ({ "@type": "Person", name: a.name }));
  }
  if (movie.genres && movie.genres.length > 0) {
    structuredData.genre = movie.genres.map((g) => g.name);
  }
  if (movie.vote_average && movie.vote_count) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: movie.vote_average.toFixed(1),
      bestRating: "10",
      ratingCount: movie.vote_count,
    };
  }
  const isoDuration = formatDuration(movie.runtime);
  if (isoDuration) {
    structuredData.duration = isoDuration;
  }
  if (movie.external_ids?.imdb_id) {
    structuredData.sameAs = `https://www.imdb.com/title/${movie.external_ids.imdb_id}`;
  }
  Object.keys(structuredData).forEach(
    (key) => structuredData[key] === undefined && delete structuredData[key]
  );
  if (structuredData.director && structuredData.director.length === 0)
    delete structuredData.director;
  if (structuredData.actor && structuredData.actor.length === 0)
    delete structuredData.actor;
  if (structuredData.genre && structuredData.genre.length === 0)
    delete structuredData.genre;
  return structuredData;
}

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
  const canonicalUrl = `https://movies.suhaeb.com/movie/${params.id}`;
  try {
    const movie = await getCachedMovieData(params.id);
    if (!movie || Object.keys(movie).length === 0) {
      console.warn(`No movie data found for metadata, ID: ${params.id}`);
      throw new Error("Movie not found for metadata");
    }
    const title = `${movie.title || "Movie"} - Movies Hub`;
    const description =
      movie.overview ||
      `Details about the movie ${
        movie.title || ""
      }, including cast, ratings, and trailers.`;
    const imageUrl = movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : "https://movies.suhaeb.com/images/default-og.png";

    return {
      title: title,
      description: description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: title,
        description: description,
        url: canonicalUrl,
        images: [
          {
            url: imageUrl,
            width: 780,
            height: 1170,
            alt: `${movie.title || "Movie"} Poster`,
          },
        ],
        type: "video.movie",
        "video:release_date": movie.release_date,
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error(
      `Error generating metadata for Movie ID ${params.id}:`,
      error.message
    );
    return {
      title: "Movie Not Found - Movies Hub",
      description: "Details for this movie could not be loaded.",
      alternates: { canonical: canonicalUrl },
    };
  }
}

export default async function MoviePage({ params }) {
  const canonicalUrl = `https://movies.suhaeb.com/movie/${params.id}`;

  // Session is fetched but NOT used to gate the entire page content.
  // It can be passed to components if they need to render differently for logged-in users.
  // const session = await getServerSession(authOptions); // You can uncomment if needed by sub-components

  if (!params.id || !/^\d+$/.test(params.id)) {
    // For invalid ID format, trigger notFound.
    // For a non-existent but validly formatted ID, getCachedMovieData will throw, caught below.
    notFound();
  }

  try {
    const movie = await getCachedMovieData(params.id);
    if (!movie || Object.keys(movie).length === 0) {
      // This case should ideally be caught by getCachedMovieData throwing an error if res.ok is false.
      // If it returns an empty object for a 404, this check is also valid.
      console.warn(
        `No data returned for movie ID ${params.id}. It might not exist or TMDB fetch failed.`
      );
      notFound();
    }

    const [creditsData, isFound, recommendationsData] = await Promise.all([
      getCachedCredits(params.id, "movie"),
      checkLinkStability(params.id, "movie"),
      getCachedRecommendations(params.id, "movie"),
    ]);

    const trailerKey =
      movie.videos?.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube" && v.official
      )?.key ||
      movie.videos?.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      )?.key;

    const cast = creditsData.cast?.slice(0, 10) || [];
    const directors =
      creditsData.crew?.filter((c) => c.job === "Director") || [];

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
    const budget = movie.budget ? `$${movie.budget.toLocaleString()}` : null;
    const revenue = movie.revenue ? `$${movie.revenue.toLocaleString()}` : null;
    const homepageLink = movie.homepage;
    const imdbId = movie.external_ids?.imdb_id;

    const movieStructuredData = generateMovieStructuredData(
      movie,
      canonicalUrl,
      cast,
      directors
    );

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(movieStructuredData),
          }}
        />
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
                      {movie.overview ||
                        "No overview available for this movie."}
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
                    {movie.release_date && (
                      <DetailItem
                        icon={
                          <CalendarDays
                            size={16}
                            className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                          />
                        }
                        label="Release Date"
                        value={new Date(movie.release_date).toLocaleDateString(
                          "en-US",
                          { year: "numeric", month: "long", day: "numeric" }
                        )}
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
      </>
    );
  } catch (error) {
    console.error(`MoviePage Error (id: ${params.id}): ${error.message}`);
    // If data fetching fails (e.g., movie not found in TMDB), trigger a 404.
    // This is better than redirecting to a generic error page if the resource truly doesn't exist.
    notFound();
  }
}
