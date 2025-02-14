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
    console.error("Metadata generation error:", error);
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
    const [movie, trailerData, creditsData] = await Promise.all([
      getCachedMovieData(id),
      getCachedTrailerData(id),
      getCachedCredits(id),
    ]);

    const heroName =
      creditsData.cast && creditsData.cast.length > 0
        ? creditsData.cast[0].name
        : "N/A";
    const director =
      creditsData.crew && creditsData.crew.length > 0
        ? creditsData.crew.find((person) => person.job === "Director")?.name ||
          "N/A"
        : "N/A";

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

    return (
      <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<SkeletonLoader />}>
            <article className="flex flex-col rounded-xl bg-card shadow-2xl overflow-hidden lg:flex-row transition-all duration-300">
              {/* Poster Section */}
              <div className="relative lg:w-1/2 flex-shrink-0">
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
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 50vw"
                />
              </div>
              {/* Content Section */}
              <div className="flex-1 p-6 lg:p-8 lg:w-1/2 flex flex-col">
                <header className="mb-6 relative">
                  <h1 className="mb-2 text-3xl font-bold text-card-foreground sm:text-4xl lg:text-5xl">
                    {movie.title}
                  </h1>
                  <div className="flex flex-wrap gap-4 mb-4">
                    <p className="text-xl font-medium text-card-foreground">
                      Hero Name:{" "}
                      <span className="text-muted-foreground">{heroName}</span>
                    </p>
                    <p className="text-xl font-medium text-card-foreground">
                      Director:{" "}
                      <span className="text-muted-foreground">{director}</span>
                    </p>
                  </div>
                  {/* New section for Rating, Year, and WatchList */}
                  <div className="flex flex-wrap items-center gap-4 mb-4">
                    <span className="text-lg font-medium text-card-foreground">
                      Rating:{" "}
                      <span className="text-muted-foreground">
                        {movie.vote_average
                          ? movie.vote_average.toFixed(1)
                          : "N/A"}
                      </span>
                    </span>
                    <span className="text-lg font-medium text-card-foreground">
                      Year:{" "}
                      <span className="text-muted-foreground">
                        {movie.release_date
                          ? new Date(movie.release_date).getFullYear()
                          : "N/A"}
                      </span>
                    </span>
                    <button className="inline-flex items-center gap-2 rounded-md border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors">
                      Add to WatchList
                    </button>
                  </div>
                  {/* Watch Now Button repositioned for large screens */}
                  <div className="hidden lg:block absolute top-4 right-4">
                    <WatchNowButton movie={movie} small={false} />
                  </div>
                </header>
                <section className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-card-foreground">
                    Overview
                  </h2>
                  <p className="text-muted-foreground leading-relaxed break-words">
                    {movie.overview || "No overview available..."}
                  </p>
                </section>
                {/* Secondary Watch Now Button for mobile */}
                <div className="mb-8 lg:hidden">
                  <WatchNowButton movie={movie} />
                </div>
                {/* Interactive Features Section */}
                <div className="pt-6 border-t border-muted-foreground">
                  <InteractiveFeatures
                    trailerUrl={trailerUrl}
                    trailerKey={trailerKey}
                    watchLink={watchLink}
                    creditsData={creditsData}
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
