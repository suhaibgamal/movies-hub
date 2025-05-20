// src/app/components/MovieCard.jsx
"use client";

import { useMemo, useState, useEffect, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import WatchlistButton from "@/app/components/WatchlistButton";
import { GENRES } from "@/lib/constants";
import { Star as StarIcon } from "lucide-react"; // Import StarIcon

function MovieCard({
  movie,
  href,
  // GENRES will be passed as the 'genres' prop from parent components
  initialWatchlisted = false,
  small = false,
  deletable = false,
  onWatchlistChange,
  onDelete,
  isAbove = false,
}) {
  const [imgQuality, setImgQuality] = useState(70);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setImgQuality(50);
    } else {
      setImgQuality(70);
    }
  }, []);

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
      return `https://image.tmdb.org/t/p/w342${movie.poster_path}`;
    if (movie.backdrop_path)
      return `https://image.tmdb.org/t/p/w342${movie.backdrop_path}`;
    return "/images/default.webp";
  }, [movie.poster_path, movie.backdrop_path]);

  const releaseYear =
    movie.release_date && !isNaN(new Date(movie.release_date))
      ? new Date(movie.release_date).getFullYear()
      : "N/A";

  const containerBaseClass =
    "block overflow-hidden transition-all duration-300 shadow-md border border-border/30 group relative";
  const hoverClasses = small
    ? "hover:border-primary/70 hover:shadow-lg hover:-translate-y-0.5"
    : "hover:border-primary/70 hover:shadow-2xl hover:-translate-y-1";
  const roundedClass = small ? "rounded-xl" : "rounded-2xl";
  const containerClass = `${containerBaseClass} ${hoverClasses} ${roundedClass} bg-card`;

  const paddingClass = small ? "p-3" : "p-4 md:p-5";
  const titleClass = small
    ? "text-base font-semibold leading-tight"
    : "text-xl font-bold";
  const imageContainerClass = "relative aspect-[2/3] w-full bg-muted";

  return (
    <Link
      href={href}
      className={containerClass}
      prefetch={isAbove ? true : undefined}
    >
      <div className={imageContainerClass}>
        <Image
          src={imageUrl}
          alt={`${movie.title || "Movie"} poster`}
          fill
          quality={imgQuality}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          className="object-cover transition-opacity duration-200 group-hover:opacity-90"
          priority={isAbove}
          placeholder="blur"
          blurDataURL="/images/default-blur.webp"
        />
      </div>
      <div className={paddingClass}>
        <h3
          id={`movie-${movie.id}-title`}
          className={`${titleClass} text-card-foreground mb-1 line-clamp-2`}
        >
          {movie.title || "Untitled Movie"}
        </h3>
        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1.5">
          <span>{releaseYear}</span>
          <span
            className={`font-bold py-0.5 px-1.5 rounded-full ${ratingClass} text-white text-[10px] flex items-center gap-0.5`}
          >
            <StarIcon size={10} className="mt-[-1px]" /> {displayRating}{" "}
            {/* Used StarIcon */}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(movie.genre_ids || []).slice(0, small ? 1 : 2).map((genreId) => (
            <span
              key={genreId}
              className="px-1.5 py-0.5 bg-muted/70 rounded-full text-[10px] text-muted-foreground truncate"
            >
              {GENRES[genreId] || "Genre"}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute top-1.5 right-1.5 z-10">
        <WatchlistButton
          item={movie}
          itemType="MOVIE"
          small={small}
          initialWatchlisted={initialWatchlisted}
          onWatchlistChange={(newStatus) => {
            if (deletable && !newStatus && onDelete) {
              onDelete(movie.id, "MOVIE");
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

const MemoizedMovieCard = memo(MovieCard);
export default MemoizedMovieCard;
