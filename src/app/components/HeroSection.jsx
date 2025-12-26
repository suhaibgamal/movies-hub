// src/app/components/HeroSection.jsx
import Link from "next/link";
import Image from "next/image";
import { Info, PlayCircle } from "lucide-react";

export default function HeroSection({ item }) {
  if (!item) return null;

  // Prefer high-res backdrop, fallback to poster
  const imagePath = item.backdrop_path || item.poster_path;
  
  if (!imagePath) return null;

  return (
    <div className="relative w-full h-[65vh] md:h-[80vh] mb-10 group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={`https://image.tmdb.org/t/p/original${imagePath}`}
          alt={item.title || item.name}
          fill
          className="object-cover object-top"
          priority // Load this image immediately as it's the LCP (Largest Contentful Paint)
          sizes="100vw"
        />
        {/* Gradient Overlay - Darkens the image for text readability and blends into the page */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-12 md:pb-20 z-10">
        <div className="max-w-3xl space-y-4">
          {/* Title */}
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg">
            {item.title || item.name}
          </h2>

          {/* Metadata (Rating, Date) */}
          <div className="flex items-center space-x-4 text-sm md:text-base text-gray-200">
            {item.vote_average > 0 && (
              <span className="text-green-400 font-bold">
                {Math.round(item.vote_average * 10)}% Match
              </span>
            )}
            <span>
              {(item.release_date || item.first_air_date || "").substring(0, 4)}
            </span>
            <span className="border border-gray-500 px-2 py-0.5 rounded text-xs uppercase">
              HD
            </span>
          </div>

          {/* Overview (Truncated) */}
          <p className="text-gray-300 text-sm md:text-lg line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-md">
            {item.overview}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href={`/${item.media_type === "tv" ? "tv" : "movie"}/${item.id}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-transform active:scale-95"
            >
              <PlayCircle className="w-5 h-5" />
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}