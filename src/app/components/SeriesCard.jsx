"use client";

import { useMemo, useState, useEffect, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import WatchlistButton from "@/app/components/WatchlistButton";

function SeriesCard({
  series,
  href,
  genres, // Assuming genres list is passed similarly
  initialWatchlisted = false,
  small = false,
  deletable = false, // If needed for watchlist page
  onWatchlistChange,
  onDelete, // If needed for watchlist page
  isAbove = false, // Marks if the card is above the fold
}) {
  const [imgQuality, setImgQuality] = useState(70);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setImgQuality(50); // Lower quality for mobile
    } else {
      setImgQuality(70);
    }
  }, []);

  const ratingClass = useMemo(() => {
    const rating = Number(series.vote_average) || 0;
    if (rating >= 7) return "bg-blue-600";
    if (rating >= 5) return "bg-purple-600";
    return "bg-red-600";
  }, [series.vote_average]);

  const displayRating = useMemo(() => {
    const rating = Number(series.vote_average);
    return isNaN(rating)
      ? "N/A"
      : rating % 1 === 0
      ? rating
      : rating.toFixed(1);
  }, [series.vote_average]);

  const imageUrl = useMemo(() => {
    if (series.poster_path)
      return `https://image.tmdb.org/t/p/w500${series.poster_path}`;
    if (series.backdrop_path)
      return `https://image.tmdb.org/t/p/w500${series.backdrop_path}`;
    return "/images/default.webp"; // Ensure you have this default image
  }, [series.poster_path, series.backdrop_path]);

  const firstAirYear =
    series.first_air_date && !isNaN(new Date(series.first_air_date))
      ? new Date(series.first_air_date).getFullYear()
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
          alt={`${series.name} poster`}
          fill
          quality={imgQuality}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          className="object-contain transition-opacity duration-200 opacity-100"
          priority={isAbove}
          placeholder="blur"
          blurDataURL="/default-blur.webp" // Ensure you have this default blur image
        />
      </div>
      <div className={paddingClass}>
        <h3
          id={`series-${series.id}-title`}
          className={`${titleClass} text-card-foreground mb-2 line-clamp-2`}
        >
          {series.name} {/* Changed from movie.title */}
        </h3>
        <div className="flex items-center justify-between text-gray-400 mb-4">
          <time className="text-xs">{firstAirYear}</time>{" "}
          {/* Changed from releaseYear */}
          <span
            className={`text-xs font-bold py-1 px-3 rounded-full ${ratingClass} text-white`}
          >
            ⭐ {displayRating}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(series.genre_ids || []).slice(0, 3).map((genreId) => (
            <span
              key={genreId}
              className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground"
            >
              {genres[genreId] || "Other"}{" "}
              {/* Assuming genres object maps TV genre IDs too */}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute top-2 right-2">
        <WatchlistButton
          item={{ ...series, title: series.name }} // Pass series data, ensure title is present for WatchlistButton if it expects it
          itemType="TV" // Specify itemType as TV
          small={small}
          initialWatchlisted={initialWatchlisted}
          onWatchlistChange={(newStatus) => {
            if (deletable && !newStatus && onDelete) {
              onDelete(series.id, "TV"); // Pass itemType if onDelete needs it
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

const MemoizedSeriesCard = memo(SeriesCard);
export default MemoizedSeriesCard;
