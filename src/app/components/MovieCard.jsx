// app/components/MovieCard.jsx
"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import WatchlistButton from "@/app/components/WatchlistButton";

function MovieCard({
  movie,
  href,
  genres,
  initialWatchlisted = false,
  small = false,
  deletable = false,
  onWatchlistChange,
  onDelete,
  isAbove = false, // new prop to mark if the card is above the fold
}) {
  const ratingClass = useMemo(() => {
    const rating = Number(movie.vote_average) || 0;
    if (rating >= 7) return "bg-blue-600";
    if (rating >= 5) return "bg-purple-600";
    return "bg-red-600";
  }, [movie.vote_average]);

  const displayRating = useMemo(() => {
    const rating = Number(movie.vote_average);
    return isNaN(rating)
      ? "N/A"
      : rating % 1 === 0
      ? rating
      : rating.toFixed(1);
  }, [movie.vote_average]);

  const imageUrl = useMemo(() => {
    if (movie.poster_path)
      return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    if (movie.backdrop_path)
      return `https://image.tmdb.org/t/p/w500${movie.backdrop_path}`;
    return "/images/default.webp";
  }, [movie.poster_path, movie.backdrop_path]);

  const releaseYear =
    movie.release_date && !isNaN(new Date(movie.release_date))
      ? new Date(movie.release_date).getFullYear()
      : "N/A";

  const containerClass = small
    ? "block bg-card rounded-xl overflow-hidden transition-all duration-300 shadow-md border hover:shadow-lg hover:-translate-y-0.5 group relative"
    : "block bg-card rounded-2xl overflow-hidden transition-all duration-300 shadow-md border hover:shadow-2xl hover:-translate-y-1 group relative";
  const paddingClass = small ? "p-4" : "p-6 md:p-8";
  const titleClass = small ? "text-xl font-bold" : "text-2xl font-bold";
  const imageContainerClass = "relative aspect-[2/3] w-full";

  return (
    <Link href={href} className={containerClass} prefetch>
      <div className={imageContainerClass}>
        <Image
          src={imageUrl}
          alt={`${movie.title} poster`}
          fill
          quality={70}
          // Updated sizes attribute based on your grid layout:
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          className="object-contain transition-opacity duration-200 opacity-100"
          loading="lazy"
          priority={isAbove} // Use the new prop instead of movie.isAbove
          placeholder="blur"
          blurDataURL="/default-blur.webp"
        />
      </div>
      <div className={paddingClass}>
        <h3
          id={`movie-${movie.id}-title`}
          className={`${titleClass} text-card-foreground mb-2 line-clamp-2`}
        >
          {movie.title}
        </h3>
        <div className="flex items-center justify-between text-gray-400 mb-4">
          <time className="text-xs">{releaseYear}</time>
          <span
            className={`text-xs font-bold py-1 px-3 rounded-full ${ratingClass} text-white`}
          >
            ⭐ {displayRating}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(movie.genre_ids || []).slice(0, 3).map((genre) => (
            <span
              key={genre}
              className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground"
            >
              {genres[genre] || "Other"}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute top-2 right-2">
        <WatchlistButton
          movie={movie}
          small={small}
          initialWatchlisted={initialWatchlisted}
          onWatchlistChange={(newStatus) => {
            if (deletable && !newStatus && onDelete) {
              onDelete(movie.id);
            }
            if (onWatchlistChange) {
              onWatchlistChange(newStatus);
            }
          }}
        />
      </div>
    </Link>
  );
}

export default MovieCard;
