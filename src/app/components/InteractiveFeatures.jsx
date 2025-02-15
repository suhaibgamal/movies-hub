"use client";

import { useState } from "react";
import { FaFacebookF, FaTwitter, FaWhatsapp } from "react-icons/fa";
import WatchNowButton from "@/app/components/WatchNowButton";
import Image from "next/image";

export default function InteractiveFeatures({ trailerKey, cast, movie }) {
  const [isTrailerModalOpen, setTrailerModalOpen] = useState(false);

  return (
    <div className="space-y-6 min-w-0">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center max-w-3xl mx-auto w-full">
        <button
          onClick={() => setTrailerModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors cursor-pointer"
          disabled={!trailerKey}
          aria-label={trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        >
          {trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        </button>
        <WatchNowButton
          movie={movie}
          className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-full text-sm"
        />
      </div>

      {/* Cast Section */}
      {cast.length > 0 && (
        <div className="min-w-0">
          <h2 className="mb-3 text-xl font-semibold text-card-foreground px-2">
            Top Cast
          </h2>
          <div className="min-w-0 pb-4">
            <div className="flex gap-4 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-card/20 hover:scrollbar-thumb-muted-foreground/50 px-2 pb-2">
              {cast.map((member) => (
                <div
                  key={member.id}
                  className="flex-shrink-0 w-28 bg-card rounded-lg p-2 shadow-lg hover:shadow-xl transition-shadow border border-muted/20"
                >
                  <div className="relative aspect-square w-full mb-2">
                    <Image
                      src={
                        member.profile_path
                          ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                          : "/images/default.webp"
                      }
                      alt={member.name}
                      className="w-full h-full object-cover rounded-md"
                      loading="lazy"
                      unoptimized
                      layout="fill"
                    />
                  </div>
                  <h3 className="text-sm font-medium text-card-foreground truncate">
                    {member.name}
                  </h3>
                  <p className="text-xs text-muted-foreground/80 truncate">
                    {member.character}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Social Sharing */}
      <div className="text-center pt-4">
        <h2 className="mb-3 text-xl font-semibold text-card-foreground">
          Share This Movie
        </h2>
        <div className="flex justify-center gap-3">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              `https://movies.suhaeb.com/movie/${movie.id}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 transition-all"
          >
            <FaFacebookF className="text-sm" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              `https://movies.suhaeb.com/movie/${movie.id}`
            )}&text=${encodeURIComponent(
              `Check out ${movie.title} on Movies Hub!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-400 text-white hover:bg-blue-500 hover:scale-110 transition-all"
          >
            <FaTwitter className="text-sm" />
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Check out ${
                movie.title
              } on Movies Hub! ${`https://movies.suhaeb.com/movie/${movie.id}`}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-green-600 text-white hover:bg-green-700 hover:scale-110 transition-all"
          >
            <FaWhatsapp className="text-sm" />
          </a>
        </div>
      </div>

      {/* Trailer Modal */}
      {isTrailerModalOpen && trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl mx-4">
            <button
              onClick={() => setTrailerModalOpen(false)}
              className="absolute -top-8 right-0 text-white hover:text-gray-200 text-3xl"
              aria-label="Cencel"
            >
              &times;
            </button>
            <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
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
    </div>
  );
}
