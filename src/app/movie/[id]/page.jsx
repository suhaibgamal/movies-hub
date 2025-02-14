import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  getCachedMovieData,
  getCachedTrailerData,
  getCachedCredits,
} from "@/lib/tmdb";
import WatchNowButton from "@/app/components/WatchNowButton";
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
    const [movie, trailerData] = await Promise.all([
      getCachedMovieData(id),
      getCachedTrailerData(id),
    ]);

    const trailerKey = trailerData.results.find(
      (v) => v.type === "Trailer" && v.site === "YouTube"
    )?.key;
    const trailerUrl = trailerKey
      ? `https://www.youtube.com/embed/${trailerKey}`
      : "";
    const watchLink = movie.imdb_id
      ? `https://vidsrc.xyz/embed/movie/${movie.imdb_id}`
      : `https://www.google.com/search?q=${encodeURIComponent(
          movie.title + " watch full movie"
        )}`;

    const releaseYear = movie.release_date
      ? new Date(movie.release_date).getFullYear()
      : "N/A";
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

    return (
      <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<SkeletonLoader />}>
            <article className="flex flex-col rounded-xl bg-card shadow-2xl overflow-hidden lg:flex-row">
              {/* Poster Section */}
              <div className="relative lg:w-1/3 xl:w-1/2 flex-shrink-0">
                <Image
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
              <div className="flex-1 p-6 lg:p-8 flex flex-col">
                <header className="mb-6 relative">
                  <div className="flex justify-between items-start mb-4">
                    <h1 className="text-3xl font-bold text-card-foreground sm:text-4xl lg:text-5xl pr-4">
                      {movie.title}
                    </h1>
                    <WatchNowButton movie={movie} className="hidden lg:flex" />
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
                      <span className="text-sm font-semibold text-card-foreground">
                        ⭐ {rating}
                      </span>
                    </div>
                    <span className="text-muted-foreground font-medium">
                      {releaseYear}
                    </span>
                    <WatchlistButton movie={movie} />
                  </div>
                </header>

                <section className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-card-foreground">
                    Overview
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {movie.overview || "No overview available..."}
                  </p>
                </section>

                <div className="lg:hidden mb-8">
                  <WatchNowButton movie={movie} />
                </div>

                <div className="pt-6 border-t border-muted">
                  <InteractiveFeatures
                    trailerUrl={trailerUrl}
                    trailerKey={trailerKey}
                    watchLink={watchLink}
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
