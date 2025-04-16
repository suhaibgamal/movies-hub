"use client";

import { useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaTwitter, FaWhatsapp } from "react-icons/fa";
import WatchNowButton from "@/app/components/WatchNowButton";
import Image from "next/image";

export default function InteractiveFeatures({
  trailerKey,
  cast,
  movieFound,
  movie,
  recommendations,
}) {
  const [isTrailerModalOpen, setTrailerModalOpen] = useState(false);
  const [isRecModalOpen, setRecModalOpen] = useState(false);

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
    <div className="space-y-8">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => setTrailerModalOpen(true)}
          className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          disabled={!trailerKey}
          aria-label={trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        >
          {trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        </button>
        <WatchNowButton
          className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full text-sm"
          movieFound={movieFound}
          id={movie.id}
        />
        {recommendations &&
          recommendations.results &&
          recommendations.results.length > 0 && (
            <button
              onClick={() => setRecModalOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
            >
              View Recommendations
            </button>
          )}
      </div>

      {/* Cast Section */}
      {cast.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-4 px-2 text-xl font-semibold text-card-foreground">
            Top Cast
          </h2>
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 px-2">
              {cast.map((member) => (
                <div
                  key={member.id}
                  className="flex-shrink-0 w-24 sm:w-28 md:w-32 bg-card rounded-xl p-3 shadow-md hover:shadow-lg transition-shadow border border-muted/20"
                >
                  <div className="relative aspect-square w-full mb-3">
                    <Image
                      src={
                        member.profile_path
                          ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                          : "/images/default.webp"
                      }
                      alt={member.name}
                      className="object-cover rounded-md"
                      loading="lazy"
                      unoptimized
                      fill
                    />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-card-foreground truncate">
                    {member.name}
                  </h3>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {member.character}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Social Sharing */}
      <div className="text-center">
        <h2 className="mb-4 text-xl font-semibold text-card-foreground">
          Share This Movie
        </h2>
        <div className="flex justify-center gap-4">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              `https://movies.suhaeb.com/movie/${movie.id}`
            )}`}
            onClick={(e) => {
              e.preventDefault();
              openSharePopup(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `https://movies.suhaeb.com/movie/${movie.id}`
                )}`
              );
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-transform hover:scale-110 hover:bg-blue-700"
          >
            <FaFacebookF className="text-sm" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              `https://movies.suhaeb.com/movie/${movie.id}`
            )}&text=${encodeURIComponent(
              `Check out ${movie.title} on Movies Hub!`
            )}`}
            onClick={(e) => {
              e.preventDefault();
              openSharePopup(
                `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  `https://movies.suhaeb.com/movie/${movie.id}`
                )}&text=${encodeURIComponent(
                  `Check out ${movie.title} on Movies Hub!`
                )}`
              );
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400 text-white transition-transform hover:scale-110 hover:bg-blue-500"
          >
            <FaTwitter className="text-sm" />
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Check out ${movie.title} on Movies Hub! https://movies.suhaeb.com/movie/${movie.id}`
            )}`}
            onClick={(e) => {
              e.preventDefault();
              openSharePopup(
                `https://wa.me/?text=${encodeURIComponent(
                  `Check out ${movie.title} on Movies Hub! https://movies.suhaeb.com/movie/${movie.id}`
                )}`
              );
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white transition-transform hover:scale-110 hover:bg-green-700"
          >
            <FaWhatsapp className="text-sm" />
          </a>
        </div>
      </div>

      {/* Trailer Modal */}
      {isTrailerModalOpen && trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl p-4">
            <button
              onClick={() => setTrailerModalOpen(false)}
              className="absolute -top-6 right-0 text-white hover:text-gray-200 text-4xl"
              aria-label="Close Trailer"
            >
              &times;
            </button>
            <div className="aspect-video rounded-xl overflow-hidden shadow-2xl">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {isRecModalOpen && recommendations && recommendations.results && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
          <div className="relative w-full max-w-6xl rounded-xl bg-background shadow-xl p-6">
            <button
              onClick={() => setRecModalOpen(false)}
              className="absolute -top-6 right-0 text-white hover:text-gray-200 text-4xl"
              aria-label="Close Recommendations"
            >
              &times;
            </button>
            <h2 className="mb-6 text-center text-2xl font-bold text-card-foreground">
              Recommended Movies
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {recommendations.results.map((recMovie) => (
                <div
                  key={recMovie.id}
                  className="overflow-hidden rounded-xl bg-card shadow-md hover:shadow-xl transition-shadow"
                >
                  <Link href={`/movie/${recMovie.id}`} legacyBehavior>
                    <a className="block transition-transform hover:scale-105">
                      <Image
                        src={
                          recMovie.poster_path
                            ? `https://image.tmdb.org/t/p/w300${recMovie.poster_path}`
                            : "/images/default.webp"
                        }
                        alt={recMovie.title}
                        width={300}
                        height={450}
                        className="object-cover"
                      />
                      <div className="p-3">
                        <h3 className="text-sm font-semibold text-card-foreground">
                          {recMovie.title}
                        </h3>
                      </div>
                    </a>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
