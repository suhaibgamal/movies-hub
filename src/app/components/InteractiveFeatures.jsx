// app/components/InteractiveFeatures.jsx
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
    <div className="mt-8 space-y-8">
      {/* Trailer Section */}
      <div className="mb-8">
        <button
          onClick={openTrailerModal}
          className="flex items-center justify-center gap-3 rounded-lg bg-blue-500 p-4 text-white transition-all hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          aria-label="Watch Trailer"
        >
          <span className="font-semibold">
            {trailerKey ? "Watch Trailer" : "Trailer Not Available"}
          </span>
        </button>
        {isTrailerModalOpen && trailerKey && (
          <TrailerModal trailerKey={trailerKey} onClose={closeTrailerModal} />
        )}
      </div>

      {/* Cast Carousel */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-card-foreground">
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

      {/* Crew Carousel */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-card-foreground">
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

      {/* Social Sharing */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-card-foreground">
          Share This Movie
        </h2>
        <div className="flex space-x-4">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              `https://movies-hub-explore.vercel.app/movie/${movie.id}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white transition-all hover:scale-110 focus:outline-none"
            aria-label="Share on Facebook"
          >
            <FaFacebookF />
          </a>
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              `https://movies-hub-explore.vercel.app/movie/${movie.id}`
            )}&text=${encodeURIComponent(
              `Check out ${movie.title} on Movies Hub!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-400 text-white transition-all hover:scale-110 focus:outline-none"
            aria-label="Share on Twitter"
          >
            <FaTwitter />
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
              `https://movies-hub-explore.vercel.app/movie/${movie.id}`
            )}&title=${encodeURIComponent(
              `Check out ${movie.title} on Movies Hub!`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-700 text-white transition-all hover:scale-110 focus:outline-none"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Trailer Modal"
    >
      <div className="relative w-full max-w-3xl p-4">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl focus:outline-none"
          aria-label="Close Trailer Modal"
        >
          &times;
        </button>
        <div
          className="relative overflow-hidden"
          style={{ paddingTop: "56.25%" }}
        >
          <iframe
            src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
            title="Trailer Video"
            className="absolute top-0 left-0 w-full h-full rounded-lg"
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
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-40 bg-card rounded-lg p-2 transition transform hover:scale-105"
          >
            <img
              src={
                item.profile_path
                  ? `https://image.tmdb.org/t/p/w185${item.profile_path}`
                  : "/images/default-profile.webp"
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
