// src/app/components/InteractiveFeatures.jsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { FaFacebookF, FaTwitter, FaWhatsapp, FaTimes } from "react-icons/fa";
import WatchNowButton from "@/app/components/WatchNowButton";
import Image from "next/image";
import { getActorCombinedCredits } from "@/lib/tmdb";
import dynamic from "next/dynamic";

const ActorFilmographyModal = dynamic(() => import("./ActorFilmographyModal"), {
  ssr: false,
  loading: () => (
    <div className="p-4 text-center">Loading actor details...</div>
  ),
});

export default function InteractiveFeatures({
  item,
  itemType,
  trailerKey,
  cast,
  itemFound,
  recommendations,
}) {
  const [isTrailerModalOpen, setTrailerModalOpen] = useState(false);
  const [isRecModalOpen, setRecModalOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState(null);
  const [isActorModalOpen, setIsActorModalOpen] = useState(false);
  // MODIFIED: State to hold combined credits
  const [actorCredits, setActorCredits] = useState([]);
  const [actorCreditsLoading, setActorCreditsLoading] = useState(false);
  const [actorCreditsError, setActorCreditsError] = useState(null);

  const trailerModalRef = useRef(null);
  const recModalRef = useRef(null);

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

  const handleCastMemberClick = useCallback((actor) => {
    setSelectedActor(actor);
    setIsActorModalOpen(true);
    // MODIFIED: Clear combined credits
    setActorCredits([]);
    setActorCreditsError(null);
  }, []);

  useEffect(() => {
    if (selectedActor && isActorModalOpen) {
      const fetchActorCombinedFilmography = async () => {
        setActorCreditsLoading(true);
        try {
          const filmographyData = await getActorCombinedCredits(
            selectedActor.id
          );
          setActorCredits(filmographyData);
        } catch (err) {
          // MODIFIED: Error state for combined credits
          setActorCreditsError(err.message || "Failed to load filmography.");
        } finally {
          setActorCreditsLoading(false);
        }
      };
      fetchActorCombinedFilmography();
    }
  }, [selectedActor, isActorModalOpen]);

  // ... (useEffect hooks for modals remain the same)

  useEffect(() => {
    let prevActiveElement;
    if (isTrailerModalOpen && trailerModalRef.current) {
      prevActiveElement = document.activeElement;
      trailerModalRef.current.focus();
      const handleEsc = (event) => {
        if (event.key === "Escape") setTrailerModalOpen(false);
      };
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        if (prevActiveElement instanceof HTMLElement) prevActiveElement.focus();
      };
    }
  }, [isTrailerModalOpen]);

  useEffect(() => {
    let prevActiveElement;
    if (isRecModalOpen && recModalRef.current) {
      prevActiveElement = document.activeElement;
      recModalRef.current.focus();
      const handleEsc = (event) => {
        if (event.key === "Escape") setRecModalOpen(false);
      };
      document.addEventListener("keydown", handleEsc);
      return () => {
        document.removeEventListener("keydown", handleEsc);
        if (prevActiveElement instanceof HTMLElement) prevActiveElement.focus();
      };
    }
  }, [isRecModalOpen]);

  if (!item || typeof item.id === "undefined") {
    return (
      <div className="py-4 text-center text-muted-foreground">
        Loading item features...
      </div>
    );
  }

  const displayTitle = item.title || item.name;
  const itemPagePath =
    itemType === "TV" ? `/tv/${item.id}` : `/movie/${item.id}`;
  const fullItemUrl = `https://movies.suhaeb.com${itemPagePath}`;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Button Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        {trailerKey && (
          <button
            onClick={() => setTrailerModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-blue-500 transition-all active:bg-blue-800 active:scale-95"
            aria-label="Watch Trailer"
          >
            Watch Trailer
          </button>
        )}
        <WatchNowButton
          className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2 rounded-full text-sm font-medium text-white shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-gray-500"
          itemAvailable={itemFound}
          itemId={item.id}
          itemType={itemType}
        />
        {recommendations &&
          recommendations.results &&
          recommendations.results.length > 0 && (
            <button
              onClick={() => setRecModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-full bg-green-600 hover:bg-green-700 px-4 py-2 text-sm font-medium text-white shadow transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-green-500"
            >
              View Recommendations
            </button>
          )}
      </div>

      {/* Top Billed Cast Section */}
      {cast && cast.length > 0 && (
        <div className="mt-5 sm:mt-6">
          <h2 className="mb-3 sm:mb-4 pl-1 text-lg sm:text-xl font-semibold text-card-foreground">
            Top Billed Cast
          </h2>
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex gap-3 sm:gap-4 pl-1 pb-2">
              {cast.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleCastMemberClick(member)}
                  className="flex-shrink-0 w-[90px] sm:w-[100px] md:w-[110px] bg-card rounded-lg p-1.5 sm:p-2 shadow hover:shadow-md transition-all duration-200 border border-border/30 hover:border-primary/70 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer text-left group"
                  aria-label={`View filmography for ${member.name}`}
                >
                  <div className="relative w-full aspect-[2/3] rounded-md overflow-hidden mb-1.5 bg-muted group-hover:opacity-90 transition-opacity">
                    <Image
                      src={
                        member.profile_path
                          ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
                          : "/images/user_profile.png"
                      }
                      alt={member.name || "Cast member"}
                      fill
                      className="object-cover"
                      loading="lazy"
                      unoptimized
                    />
                  </div>
                  <h3 className="text-xs sm:text-sm font-medium text-card-foreground truncate group-hover:text-primary transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                    {member.character}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share Section */}
      <div className="text-center pt-2">
        <h2 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold text-card-foreground">
          Share This {itemType === "TV" ? "Series" : "Movie"}
        </h2>
        <div className="flex justify-center gap-3 sm:gap-4">
          {[
            {
              Icon: FaFacebookF,
              color: "bg-blue-600",
              label: "Facebook",
              url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                fullItemUrl
              )}`,
            },
            {
              Icon: FaTwitter,
              color: "bg-sky-500",
              label: "Twitter",
              url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
                fullItemUrl
              )}&text=${encodeURIComponent(
                `Check out ${displayTitle} on Movies Hub!`
              )}`,
            },
            {
              Icon: FaWhatsapp,
              color: "bg-green-500",
              label: "WhatsApp",
              url: `https://api.whatsapp.com/send?text=${encodeURIComponent(
                `Check out ${displayTitle} on Movies Hub! ${fullItemUrl}`
              )}`,
            },
          ].map((social) => (
            <a
              key={social.label}
              href={social.url}
              onClick={(e) => {
                e.preventDefault();
                openSharePopup(social.url);
              }}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full ${social.color} text-white shadow hover:shadow-md transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-current`}
              aria-label={`Share on ${social.label}`}
            >
              <social.Icon className="text-sm sm:text-base" />
            </a>
          ))}
        </div>
      </div>

      {/* Trailer Modal */}
      {isTrailerModalOpen && trailerKey && (
        <div
          ref={trailerModalRef}
          tabIndex={-1}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 outline-none"
          aria-modal="true"
          role="dialog"
          aria-labelledby="trailer-modal-title"
        >
          <div className="relative w-full max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto rounded-lg bg-background p-3 sm:p-4 shadow-2xl">
            <h2
              id="trailer-modal-title"
              className="sr-only"
            >{`${displayTitle} Trailer`}</h2>
            <button
              type="button"
              onClick={() => setTrailerModalOpen(false)}
              className="absolute -top-2.5 -right-2.5 sm:top-2 sm:right-2 text-white bg-black/60 rounded-full p-1 hover:text-gray-300 text-xl focus:outline-none z-10 transition-colors"
              aria-label="Close Trailer"
            >
              <FaTimes size={16} />
            </button>
            <div className="aspect-video rounded-md overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                title={`${displayTitle} Trailer`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {isRecModalOpen &&
        recommendations &&
        recommendations.results &&
        recommendations.results.length > 0 && (
          <div
            ref={recModalRef}
            tabIndex={-1}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto outline-none"
            aria-modal="true"
            role="dialog"
            aria-labelledby="recommendations-modal-title"
          >
            <div className="relative w-full max-w-4xl lg:max-w-5xl mx-auto rounded-lg bg-background p-6 shadow-2xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-4 flex-shrink-0">
                <h2
                  id="recommendations-modal-title"
                  className="text-xl sm:text-2xl font-bold text-card-foreground"
                >
                  You Might Also Like
                </h2>
                <button
                  onClick={() => setRecModalOpen(false)}
                  className="text-muted-foreground hover:text-card-foreground bg-transparent hover:bg-muted/50 rounded-full p-1 text-2xl focus:outline-none transition-colors"
                  aria-label="Close Recommendations"
                >
                  <FaTimes size={18} />
                </button>
              </div>
              <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {recommendations.results.map((recItem) => {
                  const recItemTypeResolved =
                    recItem.media_type ||
                    (itemType === "MOVIE" ? "movie" : "tv");
                  const recDisplayTitle = recItem.title || recItem.name;
                  const recHref =
                    recItemTypeResolved === "tv"
                      ? `/tv/${recItem.id}`
                      : `/movie/${recItem.id}`;
                  const dateString =
                    recItemTypeResolved === "tv"
                      ? recItem.first_air_date
                      : recItem.release_date;
                  const year = dateString
                    ? new Date(dateString).getFullYear()
                    : null;

                  return (
                    <div
                      key={recItem.id}
                      className="overflow-hidden rounded-lg bg-card shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-transparent hover:border-primary"
                    >
                      <Link href={recHref} legacyBehavior>
                        <a
                          className="block"
                          onClick={() => setRecModalOpen(false)}
                        >
                          <div className="relative aspect-[2/3] w-full bg-muted">
                            <Image
                              src={
                                recItem.poster_path
                                  ? `https://image.tmdb.org/t/p/w300${recItem.poster_path}`
                                  : "/images/default.webp"
                              }
                              alt={`${recDisplayTitle} poster`}
                              fill
                              className="object-cover"
                              unoptimized
                              loading="lazy"
                            />
                          </div>
                          <div className="p-2 sm:p-3 text-center">
                            <h3 className="text-xs sm:text-sm font-medium text-card-foreground truncate">
                              {recDisplayTitle}
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
            </div>
          </div>
        )}

      {/* MODIFIED: Pass combined credits and related states to ActorFilmographyModal */}
      <ActorFilmographyModal
        isOpen={isActorModalOpen}
        onClose={() => setIsActorModalOpen(false)}
        actorName={selectedActor?.name}
        credits={actorCredits} // Renamed from movies
        isLoading={actorCreditsLoading} // Renamed from actorMoviesLoading
        error={actorCreditsError} // Renamed from actorMoviesError
      />
    </div>
  );
}
