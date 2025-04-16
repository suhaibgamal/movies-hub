"use client";

import { useState, useEffect, useRef } from "react";
import { FaFacebookF, FaTwitter, FaWhatsapp } from "react-icons/fa";
import WatchNowButton from "@/app/components/WatchNowButton";
import Image from "next/image";
import Link from "next/link";

export default function InteractiveFeatures({
  trailerKey,
  cast,
  movieFound,
  movie,
  recommendations,
}) {
  const [isTrailerModalOpen, setTrailerModalOpen] = useState(false);
  const [isRecModalOpen, setRecModalOpen] = useState(false);

  const trailerRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setTrailerModalOpen(false);
        setRecModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const openSharePopup = (url) => {
    const width = 600;
    const height = 400;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    window.open(
      url,
      "ShareWindow",
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  return (
    <div className="space-y-8 min-w-0 max-w-7xl mx-auto px-4 md:px-6">
      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => setTrailerModalOpen(true)}
          className="px-4 py-2 text-sm font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50"
          disabled={!trailerKey}
          aria-label={trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        >
          {trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        </button>
        <WatchNowButton
          className="px-4 py-2 text-sm rounded-full bg-gray-700 hover:bg-gray-600 text-white"
          movieFound={movieFound}
          id={movie.id}
        />
        {recommendations?.results?.length > 0 && (
          <button
            onClick={() => setRecModalOpen(true)}
            className="px-4 py-2 text-sm font-medium rounded-full bg-green-600 text-white hover:bg-green-700 transition"
          >
            View Recommendations
          </button>
        )}
      </div>

      {/* Cast Section */}
      {cast?.length > 0 && (
        <div>
          <h2 className="mb-3 text-xl font-semibold text-card-foreground">
            Top Cast
          </h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-thin px-1 pb-2">
            {cast.map((member) => (
              <div
                key={member.id}
                className="flex-shrink-0 w-24 md:w-28 bg-card rounded-lg p-2 border border-muted/20 shadow-sm hover:shadow-md"
              >
                <div className="relative aspect-square mb-2">
                  <Image
                    src={
                      member.profile_path
                        ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                        : "/images/default.webp"
                    }
                    alt={member.name}
                    className="rounded-md object-cover"
                    fill
                    sizes="(max-width: 768px) 96px, 112px"
                    loading="lazy"
                    unoptimized
                  />
                </div>
                <h3 className="text-sm font-medium truncate">{member.name}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {member.character}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Sharing */}
      <div className="text-center">
        <h2 className="mb-3 text-xl font-semibold">Share This Movie</h2>
        <div className="flex justify-center gap-4">
          {[
            {
              icon: <FaFacebookF className="text-sm" />,
              url: `https://www.facebook.com/sharer/sharer.php?u=https://movies.suhaeb.com/movie/${movie.id}`,
              bg: "bg-blue-600 hover:bg-blue-700",
            },
            {
              icon: <FaTwitter className="text-sm" />,
              url: `https://twitter.com/intent/tweet?url=https://movies.suhaeb.com/movie/${movie.id}&text=Check out ${movie.title} on Movies Hub!`,
              bg: "bg-blue-400 hover:bg-blue-500",
            },
            {
              icon: <FaWhatsapp className="text-sm" />,
              url: `https://wa.me/?text=Check out ${movie.title} on Movies Hub! https://movies.suhaeb.com/movie/${movie.id}`,
              bg: "bg-green-600 hover:bg-green-700",
            },
          ].map((social, i) => (
            <button
              key={i}
              onClick={(e) => {
                e.preventDefault();
                openSharePopup(social.url);
              }}
              className={`w-10 h-10 flex items-center justify-center text-white rounded-full transition-all hover:scale-110 ${social.bg}`}
              aria-label="Share"
            >
              {social.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Trailer Modal */}
      {isTrailerModalOpen && (
        <div
          ref={trailerRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-3xl mx-4">
            <button
              onClick={() => setTrailerModalOpen(false)}
              className="absolute -top-10 right-0 text-white text-3xl"
              aria-label="Close Trailer"
            >
              &times;
            </button>
            <div className="aspect-video rounded-lg overflow-hidden shadow-2xl bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {isRecModalOpen && recommendations?.results && (
        <div
          ref={recRef}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-auto flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-6xl mx-4 sm:mx-8 bg-background rounded-xl p-6">
            <button
              onClick={() => setRecModalOpen(false)}
              className="absolute -top-10 right-0 text-white text-3xl"
              aria-label="Close Recommendations"
            >
              &times;
            </button>
            <h2 className="text-center text-2xl font-bold mb-6">
              Recommended Movies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendations.results.map((recMovie) => (
                <Link
                  key={recMovie.id}
                  href={`/movie/${recMovie.id}`}
                  className="group rounded-lg overflow-hidden bg-card hover:shadow-lg transition-all border border-muted/20"
                  onClick={() => setRecModalOpen(false)}
                >
                  <div className="relative aspect-[2/3] w-full">
                    <Image
                      src={
                        recMovie.poster_path
                          ? `https://image.tmdb.org/t/p/w300${recMovie.poster_path}`
                          : "/images/default.webp"
                      }
                      alt={recMovie.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                      className="object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                  <div className="p-2">
                    <h3 className="text-sm font-medium truncate text-card-foreground">
                      {recMovie.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
