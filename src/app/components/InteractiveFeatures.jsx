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
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          disabled={!trailerKey}
          aria-label={trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        >
          {trailerKey ? "Watch Trailer" : "Trailer Unavailable"}
        </button>
        <WatchNowButton
          className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow transition-all focus:outline-none focus:ring-2 focus:ring-gray-600"
          movieFound={movieFound}
          id={movie.id}
        />
        {recommendations &&
          recommendations.results &&
          recommendations.results.length > 0 && (
            <button
              onClick={() => setRecModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium text-white shadow transition-all focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              View Recommendations
            </button>
          )}
      </div>

      {/* Cast Section */}
      {cast.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-4 pl-2 text-xl font-bold text-card-foreground">
            Top Cast
          </h2>
          <div className="overflow-x-auto">
            <div className="flex gap-4 pl-2">
              {cast.map((member) => (
                <div
                  key={member.id}
                  className="flex-shrink-0 w-20 sm:w-24 md:w-28 bg-card rounded-lg p-2 shadow hover:shadow-lg transition-shadow border border-muted/20"
                >
                  <div className="relative w-full aspect-square rounded-md overflow-hidden mb-2">
                    <Image
                      src={
                        member.profile_path
                          ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                          : "/images/default.webp"
                      }
                      alt={member.name}
                      fill
                      className="object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-card-foreground truncate">
                    {member.name}
                  </h3>
                  <p className="text-[9px] text-muted-foreground truncate">
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
        <h2 className="mb-4 text-xl font-bold text-card-foreground">
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow hover:shadow-lg transition-transform hover:scale-110"
          >
            <FaFacebookF className="text-base" />
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-400 text-white shadow hover:shadow-lg transition-transform hover:scale-110"
          >
            <FaTwitter className="text-base" />
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white shadow hover:shadow-lg transition-transform hover:scale-110"
          >
            <FaWhatsapp className="text-base" />
          </a>
        </div>
      </div>

      {/* Trailer Modal */}
      {isTrailerModalOpen && trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl mx-auto rounded-lg bg-background p-4 shadow-2xl">
            <button
              onClick={() => setTrailerModalOpen(false)}
              className="absolute -top-4 right-4 text-white hover:text-gray-300 text-3xl focus:outline-none"
              aria-label="Close Trailer"
            >
              &times;
            </button>
            <div className="aspect-video rounded-md overflow-hidden">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl mx-auto rounded-lg bg-background p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-muted pb-3 mb-4">
              <h2 className="text-2xl font-bold text-card-foreground">
                Recommended Movies
              </h2>
              <button
                onClick={() => setRecModalOpen(false)}
                className="text-white hover:text-gray-300 text-3xl focus:outline-none"
                aria-label="Close Recommendations"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto">
              {recommendations.results.map((recMovie) => (
                <div
                  key={recMovie.id}
                  className="overflow-hidden rounded-lg bg-card shadow hover:shadow-lg transition transform hover:scale-105"
                >
                  <Link href={`/movie/${recMovie.id}`} legacyBehavior>
                    <a className="block">
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
                      <div className="p-2">
                        <h3 className="text-center text-xs font-medium text-card-foreground">
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
