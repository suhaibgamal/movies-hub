// app/movie/[id]/page.jsx
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
  const { id } = await params;
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
  const { id } = await params;
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
                  <h1 className="mb-2 text-3xl font-bold text-card-foreground sm:text-4xl lg:text-5xl">
                    {movie.title}
                  </h1>
                  <p className="mb-2 text-xl font-medium text-card-foreground">
                    Hero Name:{" "}
                    <span className="text-muted-foreground">{heroName}</span>
                  </p>
                  <p className="mb-4 text-xl font-medium text-card-foreground">
                    Director:{" "}
                    <span className="text-muted-foreground">{director}</span>
                  </p>
                  <div className="absolute top-0 right-0">
                    <WatchNowButton movie={movie} small={false} />
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
                <div className="mt-auto">
                  <WatchNowButton
                    watchLink={watchLink}
                    imdb_id={movie.imdb_id}
                    movieTitle={movie.title}
                  />
                </div>
                <InteractiveFeatures
                  trailerUrl={trailerUrl}
                  trailerKey={trailerKey}
                  watchLink={watchLink}
                  creditsData={creditsData}
                  movie={movie}
                />
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
