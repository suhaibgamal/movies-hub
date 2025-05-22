// src/app/components/ActorFilmographyModal.jsx
import Link from "next/link";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";
import { Tv as TvIcon } from "lucide-react";
import { useEffect, useRef, useMemo } from "react";

export default function ActorFilmographyModal({
  isOpen,
  onClose,
  actorName,
  credits,
  isLoading,
  error,
}) {
  const modalRef = useRef(null);
  const prevActiveElementRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      prevActiveElementRef.current = document.activeElement;
      if (modalRef.current) {
        modalRef.current.focus();
      }

      const handleEsc = (event) => {
        if (event.key === "Escape") {
          onClose();
        }
      };

      const handleTabKey = (event) => {
        if (event.key === "Tab" && modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus();
              event.preventDefault();
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus();
              event.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleEsc);
      document.addEventListener("keydown", handleTabKey);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        document.removeEventListener("keydown", handleTabKey);
        if (prevActiveElementRef.current) {
          prevActiveElementRef.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  const displayCredits = useMemo(() => {
    if (!credits || credits.length === 0) {
      return [];
    }
    const seen = new Set();
    return credits.filter((credit) => {
      // Ensure it's a movie or TV show
      if (credit.media_type !== "movie" && credit.media_type !== "tv") {
        return false;
      }
      // Check for duplicates based on media_type and id
      const key = `${credit.media_type}-${credit.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [credits]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto outline-none transition-opacity duration-300 ease-in-out ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`relative w-full max-w-4xl mx-auto rounded-lg bg-background p-6 shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-muted pb-3 mb-4 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-card-foreground">
            {actorName}'s Filmography
          </h2>
          <button
            onClick={onClose}
            className="text-white bg-black/50 rounded-full p-1 hover:text-gray-300 text-3xl focus:outline-none"
            aria-label={`Close ${actorName}'s filmography`}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {isLoading && (
          <div className="flex-grow flex items-center justify-center py-10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="flex-grow flex flex-col items-center justify-center py-10 text-center">
            <p className="text-destructive text-lg mb-2">
              Failed to load filmography.
            </p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && displayCredits.length === 0 && (
          <div className="flex-grow flex items-center justify-center py-10">
            <p className="text-muted-foreground text-lg">
              No filmography found for {actorName}.
            </p>
          </div>
        )}
        {!isLoading && !error && displayCredits.length > 0 && (
          <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {displayCredits.map((credit) => {
              const displayTitle = credit.title || credit.name;
              const itemPath =
                credit.media_type === "tv"
                  ? `/tv/${credit.id}`
                  : `/movie/${credit.id}`;
              const dateString = credit.release_date || credit.first_air_date;
              const year = dateString
                ? new Date(dateString).getFullYear()
                : null;

              return (
                <div
                  key={`${credit.media_type}-${credit.id}`}
                  className="overflow-hidden rounded-lg bg-card shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-transparent hover:border-primary"
                >
                  <Link href={itemPath} legacyBehavior>
                    <a className="block" onClick={onClose}>
                      <div className="relative aspect-[2/3] w-full bg-muted">
                        <Image
                          src={
                            credit.poster_path
                              ? `https://image.tmdb.org/t/p/w300${credit.poster_path}`
                              : "/images/default.webp"
                          }
                          alt={`${displayTitle} poster`}
                          fill
                          className="object-cover"
                          unoptimized
                          loading="lazy"
                        />
                        {/* TV Show Icon added here */}
                        {credit.media_type === "tv" && (
                          <div
                            className="absolute top-1.5 left-1.5 bg-primary/90 backdrop-blur-sm text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm shadow-md flex items-center gap-0.5 z-10"
                            title="TV Series" // Added title attribute for accessibility
                          >
                            <TvIcon size={9} className="mr-0.5" />
                            <span>TV</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2 sm:p-3 text-center">
                        <h3 className="text-xs sm:text-sm font-medium text-card-foreground truncate">
                          {displayTitle}
                        </h3>
                        {year && (
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {year}
                          </p>
                        )}
                      </div>
                    </a>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
