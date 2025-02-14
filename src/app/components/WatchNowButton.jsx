"use client";

import { useState } from "react";
import { FiFilm } from "react-icons/fi";

export default function WatchNowButton({ movie, className }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const watchLink = movie.imdb_id
    ? `https://vidsrc.xyz/embed/movie/${movie.imdb_id}`
    : `https://www.google.com/search?q=${encodeURIComponent(
        movie.title + " watch full movie"
      )}`;

  const checkLinkStability = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(watchLink, { method: "HEAD", mode: "cors" });
      return response.ok;
    } catch (err) {
      setError("Link unavailable - redirecting to Google search...");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const isValid = await checkLinkStability();
    isValid ? setShowModal(true) : handleProceed();
  };

  const handleProceed = () => {
    window.open(watchLink, "_blank");
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setError(null);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center justify-center gap-2 transition-all ${
          className ||
          "bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-full text-sm"
        }`}
        aria-label="Watch movie"
        disabled={loading}
      >
        <FiFilm className="h-4 w-4" />
        <span>{loading ? "Checking..." : "Watch Now"}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
          <div className="bg-card border border-muted rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-card-foreground">
                Disclaimer
              </h2>
              <button
                onClick={handleCancel}
                className="text-muted-foreground hover:text-card-foreground transition-colors"
                aria-label="Close disclaimer"
              >
                &times;
              </button>
            </div>

            <p className="text-muted-foreground mb-4">
              We do not control third-party content. You are about to be
              redirected to an external website. Proceed at your own risk.
            </p>

            {error && (
              <div className="bg-red-500/20 text-red-300 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-card-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
