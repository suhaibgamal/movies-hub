import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  getCachedMovieData,
  getCachedTrailerData,
  getCachedCredits,
  checkLinkStability,
} from "@/lib/tmdb";
import SkeletonLoader from "@/app/components/SkeletonLoader";
import InteractiveFeatures from "@/app/components/InteractiveFeatures";
import WatchlistButton from "@/app/components/WatchlistButton";

export async function generateStaticParams() {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
  );
  const popular = await res.json();
  return popular.results.map((movie) => ({ id: movie.id.toString() }));
}

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = params;
  try {
    const movie = await getCachedMovieData(id);
    return {
      title: `${movie.title} - Movies Hub`,
      description: movie.overview || "Movie details",
      alternates: {
        canonical: `https://movies.suhaeb.com/movie/${id}`,
      },
    };
  } catch (error) {
    return {
      title: "Movie Not Found - Movies Hub",
      description: "Movie details not available",
    };
  }
}

export default async function MoviePage({ params }) {
  const { id } = params;
  const session = await getServerSession(authOptions);
  if (!session)
    redirect(`/login?callbackUrl=${encodeURIComponent(`/movie/${id}`)}`);
  if (!id || !/^\d+$/.test(id))
    return (
      <p className="text-center text-lg font-semibold">Movie not found.</p>
    );

  try {
    const [movie, trailerData, creditsData, isFound] = await Promise.all([
      getCachedMovieData(id),
      getCachedTrailerData(id),
      getCachedCredits(id),
      checkLinkStability(id),
    ]);
    const trailerKey = trailerData.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    )?.key;
    const cast = creditsData.cast?.slice(0, 10) || [];
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

    // Extract genres from movie data
    const genres =
      movie.genres?.map((genre) => genre.name).filter(Boolean) || [];

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
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                />
              </div>

              {/* Content Section */}
              <div className="min-w-0 flex-1 p-4 lg:p-6 flex flex-col relative">
                <div className="absolute top-4 right-4 z-10">
                  <WatchlistButton movie={movie} />
                </div>

                <header className="mb-4 pr-12">
                  <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl lg:text-4xl break-words">
                    {movie.title}
                  </h1>

                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <span
                      className={`${ratingColor} px-2 py-1 rounded-full text-xs font-bold text-white`}
                    >
                      ⭐ {rating}
                    </span>
                    <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full font-bold">
                      {releaseYear}
                    </span>
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
                    {movie.overview || "No overview available..."}
                  </p>
                </section>

                <div className="pt-4 border-t border-muted/30 min-w-0">
                  <InteractiveFeatures
                    trailerKey={trailerKey}
                    cast={cast}
                    movieFound={isFound}
                    movie={movie}
                  />
                </div>
              </div>
            </article>
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    redirect("/not-found");
  }
}
