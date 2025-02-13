import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  FiClock,
  FiStar,
  FiYoutube,
  FiDollarSign,
  FiGlobe,
  FiUsers,
  FiFlag,
  FiHome,
  FiLink,
} from "react-icons/fi";
import { authOptions } from "@/app/api/auth/authOptions";
import { unstable_cache } from "next/cache";
import WatchNowButton from "@/app/components/WatchNowButton";

const WatchlistButton = dynamic(
  () => import("@/app/components/WatchlistButton"),
  { ssr: true }
);

const getCachedMovieData = unstable_cache(
  async (id) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error("Failed to fetch movie");
    return res.json();
  },
  ["movie-data"],
  { revalidate: 86400 }
);

const getCachedTrailerData = unstable_cache(
  async (id) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`,
        { next: { revalidate: 3600 } }
      );
      return res.json();
    } catch (error) {
      return { results: [] };
    }
  },
  ["trailer-data"],
  { revalidate: 3600 }
);

export async function generateStaticParams() {
  const popular = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
  ).then((res) => res.json());
  return popular.results.map((movie) => ({ id: movie.id.toString() }));
}

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    const movie = await getCachedMovieData(id);
    return {
      title: `${movie.title} - Movies Hub`,
      description: movie.overview || "Movie details",
      openGraph: {
        title: movie.title,
        description: movie.overview || "",
        images: [
          {
            url:
              movie.poster_path || movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w780${
                    movie.poster_path || movie.backdrop_path
                  }`
                : "/images/default.webp",
          },
        ],
      },
      twitter: { card: "summary_large_image" },
      alternates: {
        canonical: `https://movies-hub-explore.vercel.app/movie/${id}`,
      },
    };
  } catch (error) {
    return {
      title: "Movie Not Found - Movies Hub",
      description: "Movie details not available",
      alternates: {
        canonical: `https://movies-hub-explore.vercel.app/movie/${id}`,
      },
    };
  }
}

export default async function MoviePage({ params }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session)
    redirect(`/login?callbackUrl=${encodeURIComponent(`/movie/${id}`)}`);
  if (!id || !/^\d+$/.test(id)) redirect("/not-found");

  try {
    const [movie, trailerData] = await Promise.all([
      getCachedMovieData(id),
      getCachedTrailerData(id),
    ]);

    const trailerKey = trailerData.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    )?.key;
    const trailerUrl = trailerKey
      ? `https://www.youtube.com/watch?v=${trailerKey}`
      : `https://www.youtube.com/results?search_query=${encodeURIComponent(
          movie.title + " trailer"
        )}`;
    const watchLink = movie.imdb_id
      ? `https://vidsrc.xyz/embed/movie/${movie.imdb_id}`
      : `https://www.google.com/search?q=${encodeURIComponent(
          movie.title + " watch full movie"
        )}`;

    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<SkeletonLoader />}>
            <article className="flex flex-col rounded-xl bg-card shadow-2xl overflow-hidden lg:flex-row relative">
              <div className="relative lg:w-1/3 xl:w-1/4">
                <Image
                  src={
                    movie.poster_path || movie.backdrop_path
                      ? `https://image.tmdb.org/t/p/w780${
                          movie.poster_path || movie.backdrop_path
                        }`
                      : "/images/default.webp"
                  }
                  alt={`${movie.title} poster`}
                  width={780}
                  height={1170}
                  className="aspect-[2/3] w-full object-cover"
                  placeholder="blur"
                  blurDataURL="/images/default-blur.webp"
                  quality={75}
                  priority
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <div className="flex-1 p-6 lg:p-8 relative">
                <header className="mb-6 relative">
                  <h1 className="mb-4 text-3xl font-bold text-card-foreground sm:text-4xl lg:text-5xl">
                    {movie.title}
                  </h1>
                  <div className="absolute top-0 right-0">
                    <WatchlistButton movie={movie} small={false} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm sm:text-base">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FiClock className="text-blue-500" />
                      <time>{movie.release_date}</time>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiStar className="text-blue-500" />
                      <span
                        className={`${getRatingColor(
                          movie.vote_average
                        )} font-semibold`}
                      >
                        {movie.vote_average.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {movie.genres.map((genre) => (
                        <span
                          key={genre.id}
                          className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-500"
                        >
                          {genre.name || "Other"}
                        </span>
                      ))}
                    </div>
                  </div>
                </header>
                <section className="mb-8">
                  <h2 className="mb-4 text-xl font-semibold text-card-foreground">
                    Overview
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {movie.overview || "No overview available..."}
                  </p>
                </section>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FiDollarSign className="text-blue-500" />
                    <span>
                      Budget:{" "}
                      {movie.budget > 0
                        ? `$${movie.budget.toLocaleString()}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FiGlobe className="text-blue-500" />
                    <span>
                      Language:{" "}
                      {movie.original_language?.toUpperCase() || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FiUsers className="text-blue-500" />
                    <span>
                      Popularity: {movie.popularity?.toFixed(0) || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FiFlag className="text-blue-500" />
                    <span>Status: {movie.status || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FiHome className="text-blue-500" />
                    <span>Runtime: {movie.runtime} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FiLink className="text-blue-500" />
                    <a
                      href={movie.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Official Website
                    </a>
                  </div>
                </div>
                <div className="mt-auto grid gap-4 sm:grid-cols-2">
                  <a
                    href={trailerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 rounded-lg bg-blue-500 p-4 text-white transition-all hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background"
                    aria-label="Watch trailer"
                  >
                    <FiYoutube className="h-6 w-6" />
                    <span className="font-semibold">
                      {trailerKey
                        ? "Watch Trailer on Youtube"
                        : "Search Trailer on Google"}
                    </span>
                  </a>
                  <WatchNowButton
                    watchLink={watchLink}
                    imdb_id={movie.imdb_id}
                    movieTitle={movie.title}
                  />
                </div>
              </div>
            </article>
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error in MoviePage:", error);
    redirect("/error");
  }
}

function getRatingColor(ratingValue) {
  if (ratingValue >= 7) return "text-green-500";
  if (ratingValue >= 5) return "text-yellow-500";
  return "text-red-500";
}

function SkeletonLoader() {
  return (
    <div className="animate-pulse rounded-xl bg-card">
      <div className="flex flex-col lg:flex-row">
        <div className="aspect-[2/3] w-full bg-muted lg:w-1/3" />
        <div className="flex-1 p-8">
          <div className="mb-6 h-12 w-3/4 rounded bg-muted" />
          <div className="mb-8 space-y-2">
            <div className="h-4 w-1/4 rounded bg-muted" />
            <div className="h-4 w-1/3 rounded bg-muted" />
          </div>
          <div className="space-y-4">
            <div className="h-4 rounded bg-muted" />
            <div className="h-4 w-5/6 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
