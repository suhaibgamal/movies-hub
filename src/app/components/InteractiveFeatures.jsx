"use client";

import { useState } from "react";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";

export default function InteractiveFeatures({
  trailerUrl,
  trailerKey,
  watchLink,
  creditsData,
  movie,
}) {
  const [isTrailerModalOpen, setTrailerModalOpen] = useState(false);

  const openTrailerModal = () => setTrailerModalOpen(true);
  const closeTrailerModal = () => setTrailerModalOpen(false);

  const cast = creditsData.cast || [];
  const crew = creditsData.crew || [];

  return (
    <div className="mt-10 space-y-10">
      {/* Trailer Section */}
      <div className="text-center">
        <button
          onClick={openTrailerModal}
          className="inline-flex items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white shadow hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          aria-label="Watch Trailer"
          disabled={!trailerKey}
        >
          {trailerKey ? "Watch Trailer" : "Trailer Not Available"}
        </button>
        {isTrailerModalOpen && trailerKey && (
          <TrailerModal trailerKey={trailerKey} onClose={closeTrailerModal} />
        )}
      </div>

      {/* Cast Carousel */}
      {cast.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-card-foreground">
            Cast
          </h2>
          <CastCrewCarousel
            items={cast.map((member) => ({
              id: member.id,
              name: member.name,
              role: member.character,
              profile_path: member.profile_path,
            }))}
          />
        </div>
      )}

      {/* Crew Carousel */}
      {crew.length > 0 && (
        <div>
          <h2 className="mb-4 text-2xl font-semibold text-card-foreground">
            Crew
          </h2>
          <CastCrewCarousel
            items={crew.map((member) => ({
              id: member.id,
              name: member.name,
              role: member.job,
              profile_path: member.profile_path,
            }))}
          />
        </div>
      )}

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
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 text-white hover:scale-110 transition-transform"
            aria-label="Share on Facebook"
          >
            <FaFacebookF />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              `https://movies.suhaeb.com/movie/${movie.id}`
            )}&text=${encodeURIComponent(
              `Check out ${movie.title} on Movies Hub!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-400 text-white hover:scale-110 transition-transform"
            aria-label="Share on Twitter"
          >
            <FaTwitter />
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
              `https://movies.suhaeb.com/movie/${movie.id}`
            )}&title=${encodeURIComponent(
              `Check out ${movie.title} on Movies Hub!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-700 text-white hover:scale-110 transition-transform"
            aria-label="Share on LinkedIn"
          >
            <FaLinkedinIn />
          </a>
        </div>
      </div>
    </div>
  );
}

function TrailerModal({ trailerKey, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Trailer Modal"
    >
      <div className="relative w-full max-w-3xl p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-3xl font-bold hover:text-gray-300 focus:outline-none"
          aria-label="Close Trailer Modal"
        >
          &times;
        </button>
        <div
          className="relative overflow-hidden rounded-lg"
          style={{ paddingTop: "56.25%" }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
            title="Trailer Video"
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
}

function CastCrewCarousel({ items }) {
  return (
    <div className="relative">
      <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-32 sm:w-36 md:w-40 bg-card rounded-lg p-3 transition-transform hover:scale-105"
          >
            <img
              src={
                item.profile_path
                  ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                  : "/images/default.webp"
              }
              alt={`${item.name}'s profile`}
              className="w-full h-40 object-cover rounded-md mb-2"
              loading="lazy"
            />
            <h3
              className="text-sm font-bold text-card-foreground truncate"
              title={item.name}
            >
              {item.name}
            </h3>
            <p
              className="text-xs text-muted-foreground truncate"
              title={item.role}
            >
              {item.role}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
