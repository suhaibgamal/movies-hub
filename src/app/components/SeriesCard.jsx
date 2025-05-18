// src/app/components/SeriesCard.jsx
"use client";

import { useMemo, useState, useEffect, memo } from "react";
import Image from "next/image";
import Link from "next/link";
import WatchlistButton from "@/app/components/WatchlistButton";
import { Tv as TvIcon, Star as StarIcon } from "lucide-react"; // Import TvIcon and StarIcon
import { TV_GENRES } from "@/lib/constants";

function SeriesCard({
  series,
  href,
  // TV_GENRES will be passed as the 'genres' prop from parent components
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
    return "/images/default.webp";
  }, [series.poster_path, series.backdrop_path]);

  const firstAirYear =
    series.first_air_date && !isNaN(new Date(series.first_air_date))
      ? new Date(series.first_air_date).getFullYear()
      : "N/A";

  const containerBaseClass =
    "block overflow-hidden transition-all duration-300 shadow-md border border-border/30 group relative";
  const hoverClasses = small
    ? "hover:border-primary/70 hover:shadow-lg hover:-translate-y-0.5"
    : "hover:border-primary/70 hover:shadow-2xl hover:-translate-y-1";
  const roundedClass = small ? "rounded-xl" : "rounded-2xl";
  const containerClass = `${containerBaseClass} ${hoverClasses} ${roundedClass} bg-muted`; // Use bg-muted for SeriesCard

  const paddingClass = small ? "p-3" : "p-4 md:p-5";
  const titleClass = small
    ? "text-base font-semibold leading-tight"
    : "text-xl font-bold";
  const imageContainerClass = "relative aspect-[2/3] w-full bg-card"; // Image placeholder contrast for muted card

  return (
    <Link
      href={href}
      className={containerClass}
      prefetch={isAbove ? true : undefined}
    >
      <div className={imageContainerClass}>
        <Image
          src={imageUrl}
          alt={`${series.name || "Series"} poster`}
          fill
          quality={imgQuality}
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
          className="object-cover transition-opacity duration-200 group-hover:opacity-90"
          priority={isAbove}
          placeholder="blur"
          blurDataURL="/images/default-blur.webp"
        />
        <div className="absolute top-1.5 left-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-md flex items-center gap-0.5 z-10">
          <TvIcon size={9} className="mr-0.5" />
          <span>TV</span>
        </div>
      </div>
      <div className={paddingClass}>
        <h3
          id={`series-${series.id}-title`}
          className={`${titleClass} text-foreground mb-1 line-clamp-2`}
        >
          {series.name || "Untitled Series"}
        </h3>
        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1.5">
          <span>{firstAirYear}</span>
          {typeof series.number_of_seasons === "number" && small && (
            <span className="truncate_ mx-1">
              {" "}
              {/* Changed class to truncate_ if that was intended */}
              {series.number_of_seasons}S
            </span>
          )}
          {typeof series.number_of_seasons === "number" && !small && (
            <span className="truncate_ mx-1">
              {series.number_of_seasons} Season
              {series.number_of_seasons !== 1 ? "s" : ""}
            </span>
          )}
          <span
            className={`font-bold py-0.5 px-1.5 rounded-full ${ratingClass} text-white text-[10px] flex items-center gap-0.5`}
          >
            <StarIcon size={10} className="mt-[-1px]" /> {displayRating}{" "}
            {/* Used StarIcon */}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(series.genre_ids || []).slice(0, small ? 1 : 2).map((genreId) => (
            <span
              key={genreId}
              className="px-1.5 py-0.5 bg-card/70 dark:bg-background/70 rounded-full text-[10px] text-foreground/80 truncate"
            >
              {TV_GENRES[genreId] || "Genre"}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute top-1.5 right-1.5 z-10">
        <WatchlistButton
          item={{ ...series, title: series.name }}
          itemType="TV"
          small={small}
          initialWatchlisted={initialWatchlisted}
          onWatchlistChange={(newStatus) => {
            if (deletable && !newStatus && onDelete) {
              onDelete(series.id, "TV");
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
