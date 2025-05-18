// src/app/components/WatchNowButton.jsx
"use client";

import { useState } from "react";
import { FiFilm, FiTv, FiPlayCircle } from "react-icons/fi";

export default function WatchNowButton({
  className,
  itemAvailable = true,
  itemId,
  itemType = "MOVIE",
  seasonNumber,
  episodeNumber,
  buttonText,
}) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemAvailable) {
      setShowModal(true);
    }
  };

  let watchLink = "";
  let Icon = FiFilm;
  let effectiveButtonText = buttonText || "";
  let unavailableText = `${
    itemType === "EPISODE" ? "Episode" : itemType === "TV" ? "Series" : "Movie"
  } Unavailable`;

  if (itemType === "MOVIE" && itemId) {
    watchLink = `https://vidsrc.xyz/embed/movie/${itemId}`;
    Icon = FiFilm;
    if (!effectiveButtonText) effectiveButtonText = "Watch Movie";
  } else if (itemType === "TV" && itemId) {
    watchLink = `https://vidsrc.xyz/embed/tv/${itemId}`;
    Icon = FiTv;
    if (!effectiveButtonText) effectiveButtonText = "Watch Series";
  } else if (
    itemType === "EPISODE" &&
    itemId &&
    seasonNumber &&
    episodeNumber
  ) {
    // itemId here is the TMDB Series ID
    watchLink = `https://vidsrc.xyz/embed/tv/${itemId}?s=${seasonNumber}&e=${episodeNumber}`;
    Icon = FiPlayCircle;
    if (!effectiveButtonText)
      effectiveButtonText = `S${seasonNumber} E${episodeNumber}`;
  } else {
    // If required props for a specific type are missing, consider link invalid
    itemAvailable = false;
  }

  const handleProceed = () => {
    if (watchLink) {
      window.open(watchLink, "_blank", "noopener,noreferrer");
    }
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const defaultClassName =
    "bg-gray-700 hover:bg-gray-600 px-5 py-2.5 rounded-full text-sm";
  const finalClassName = `flex items-center justify-center gap-2 transition-all ${
    className || defaultClassName
  }`;

  return (
    <>
      <button
        onClick={handleClick}
        className={finalClassName}
        aria-label={
          itemAvailable && watchLink ? effectiveButtonText : unavailableText
        }
        disabled={!itemAvailable || !watchLink}
      >
        <Icon className="h-4 w-4 text-white flex-shrink-0" />{" "}
        {/* Added flex-shrink-0 */}
        <span className="text-white truncate">
          {" "}
          {/* Added truncate */}
          {itemAvailable && watchLink ? effectiveButtonText : unavailableText}
        </span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
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
                ×
              </button>
            </div>
            <p className="text-muted-foreground mb-6">
              You are about to be redirected to an external website
              (`vidsrc.xyz`). We do not control and are not responsible for
              third-party content. Please proceed with caution.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-card-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleProceed}
                className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
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
