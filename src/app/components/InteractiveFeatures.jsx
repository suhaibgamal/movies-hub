"use client";

import { useState } from "react";
import { FaFacebookF, FaTwitter, FaWhatsapp } from "react-icons/fa";

export default function InteractiveFeatures({
  trailerUrl,
  trailerKey,
  watchLink,
  movie,
}) {
  const [isTrailerModalOpen, setTrailerModalOpen] = useState(false);

  const openTrailerModal = () => setTrailerModalOpen(true);
  const closeTrailerModal = () => setTrailerModalOpen(false);

  return (
    <div className="mt-8 space-y-8">
      {/* Trailer Section */}
      <div className="text-center">
        <button
          onClick={openTrailerModal}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          aria-label="Watch Trailer"
          disabled={!trailerKey}
        >
          {trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        </button>
        {isTrailerModalOpen && trailerKey && (
          <TrailerModal trailerKey={trailerKey} onClose={closeTrailerModal} />
        )}
      </div>

      {/* Social Sharing */}
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-semibold text-card-foreground">
          Share This Movie
        </h2>
        <div className="flex justify-center space-x-4">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              `https://movies.suhaeb.com/movie/${movie.id}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 transition-all"
            aria-label="Share on Facebook"
          >
            <FaFacebookF className="text-lg" />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              `https://movies.suhaeb.com/movie/${movie.id}`
            )}&text=${encodeURIComponent(
              `Check out ${movie.title} on Movies Hub!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-400 text-white hover:bg-blue-500 hover:scale-110 transition-all"
            aria-label="Share on Twitter"
          >
            <FaTwitter className="text-lg" />
          </a>
          <a
            href={
              movie && movie.title && movie.id
                ? `https://wa.me/?text=${encodeURIComponent(
                    `Check out ${movie.title} on Movies Hub! https://movies.suhaeb.com/movie/${movie.id}`
                  )}`
                : ""
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-green-600 text-white hover:bg-green-700 hover:scale-110 transition-all"
            aria-label="Share on WhatsApp"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75 5.385 0 9.75 4.365 9.75 9.75 0 4.867-3.414 8.942-7.875 9.542V21h-2.125v-2.092c-1.058-.29-2.052-.71-2.972-1.257l-.01-.01C4.561 18.282 2.25 15.828 2.25 12zm6.354 1.47a.75.75 0 01-.96-.032l-.015-.019-.004-.004C5.69 11.94 5 10.752 5 9.5c0-1.654 1.346-3 3-3s3 1.346 3 3c0 .524-.169 1.029-.467 1.47a.75.75 0 11-.96.032l.015.019.004.004C9.31 10.06 10 11.248 10 12.5c0 1.654-1.346 3-3 3z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function TrailerModal({ trailerKey, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl mx-4">
        <button
          onClick={onClose}
          className="absolute -top-8 right-0 text-white hover:text-gray-200 transition-colors"
          aria-label="Close trailer"
        >
          <span className="text-4xl">&times;</span>
        </button>
        <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
          />
        </div>
      </div>
    </div>
  );
}
