// src/app/components/HeroSection.jsx
import Link from "next/link";
import Image from "next/image";
import { PlayCircle } from "lucide-react";

export default function HeroSection({ item }) {
  if (!item) return null;

  const imagePath = item.backdrop_path || item.poster_path;
  if (!imagePath) return null;

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] mb-10 group">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={`https://image.tmdb.org/t/p/original${imagePath}`}
          alt={item.title || item.name}
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
        />
        
        {/* Gradient Overlays:
          1. 'from-background' ensures it blends into your site color (White in Light Mode, Black in Dark Mode).
          2. We use distinct gradients for Light vs Dark to ensure text readability.
        */}
        
        {/* Bottom fade: Fades into the site background color */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Side fade: Darker in dark mode, lighter in light mode */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-12 md:pb-20 z-10">
        <div className="max-w-3xl space-y-4">
          
          {/* Title - Uses 'text-foreground' to auto-switch Black/White based on theme */}
          <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-md">
            {item.title || item.name}
          </h2>

          {/* Metadata */}
          <div className="flex items-center space-x-4 text-sm md:text-base text-muted-foreground font-medium">
            {item.vote_average > 0 && (
              <span className="text-green-600 dark:text-green-400 font-bold">
                {Math.round(item.vote_average * 10)}% Match
              </span>
            )}
            <span>
              {(item.release_date || item.first_air_date || "").substring(0, 4)}
            </span>
            <span className="border border-border px-2 py-0.5 rounded text-xs uppercase bg-background/50">
              HD
            </span>
          </div>

          {/* Overview */}
          <p className="text-foreground/80 text-sm md:text-lg line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-sm font-medium">
            {item.overview}
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href={`/${item.media_type === "tv" ? "tv" : "movie"}/${item.id}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-transform active:scale-95 shadow-lg"
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