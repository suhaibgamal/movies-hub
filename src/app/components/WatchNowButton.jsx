"use client";

import { useState } from "react";
import { FiFilm } from "react-icons/fi";

export default function WatchNowButton({ watchLink, imdb_id, movieTitle }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkLinkStability = async () => {
    setLoading(true);
    let valid = false;
    try {
      const response = await fetch(watchLink, {
        method: "HEAD",
        mode: "cors",
      });
      if (response.status !== 404) {
        valid = true;
      }
    } catch (err) {
      valid = false;
      setError("The link is not valid. Redirecting to Google search...");
    } finally {
      setLoading(false);
    }
    return valid;
  };

  const handleClick = async (e) => {
    e.preventDefault();
    const isValid = await checkLinkStability();
    if (isValid) {
      setShowModal(true);
    } else {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(
          movieTitle + " watch full movie"
        )}`,
        "_blank"
      );
    }
  };

  const handleProceed = () => {
    window.open(watchLink, "_blank");
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <>
      <a
        href={watchLink}
        onClick={handleClick}
        className="flex items-center justify-center gap-3 rounded-lg bg-gray-700 p-4 text-white transition-all hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        aria-label="Watch movie"
      >
        <FiFilm className="h-6 w-6" />
        <span className="font-semibold">Watch Now on VidSrc</span>
      </a>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full text-white">
            <h2 className="text-xl font-bold mb-4">Disclaimer</h2>
            <p className="mb-4">
              We do not control third-party content, including content provided
              by VidSrc. You are about to be redirected to a third-party
              website. Proceed at your own risk.
            </p>
            {error && <p className="mb-4 text-red-500">{error}</p>}
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? "Checking..." : "Proceed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
