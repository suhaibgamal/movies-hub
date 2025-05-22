// src/app/components/WatchNowButton.jsx
"use client";
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
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (itemAvailable && watchLink) {
      window.open(watchLink, "_blank", "noopener,noreferrer");
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
    </>
  );
}
