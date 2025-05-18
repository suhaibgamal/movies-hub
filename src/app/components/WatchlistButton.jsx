// src/app/components/WatchlistButton.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaRegBookmark, FaBookmark, FaSpinner } from "react-icons/fa";
import {
  useWatchlist as useZustandWatchlist,
  useWatchlistActions,
} from "@/app/store/watchlistStore";

export default function WatchlistButton({
  item,
  itemType = "MOVIE", // Default to MOVIE, will be overridden by props
  small = false,
  initialWatchlisted = false,
  onWatchlistChange,
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const zustandWatchlist = useZustandWatchlist();
  const { addToWatchlist, removeFromWatchlist } = useWatchlistActions();

  const [watchlisted, setWatchlisted] = useState(initialWatchlisted);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && item && typeof item.id !== "undefined") {
      const isItemInStore = zustandWatchlist.some(
        (storeItem) =>
          storeItem.id === item.id && storeItem.type === itemType.toUpperCase()
      );
      setWatchlisted(isItemInStore);
    } else if (status !== "loading") {
      // If not authenticated or item is invalid, default to not watchlisted
      setWatchlisted(false);
    }
    // Do not include initialWatchlisted in dependencies to avoid overriding store-driven state after mount
  }, [zustandWatchlist, item, itemType, status]);

  const handleToggleWatchlist = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!item || typeof item.id === "undefined") {
        console.error("WatchlistButton: item or item.id is undefined.");
        return;
      }
      if (status === "loading") return; // Don't do anything if session is still loading
      if (!session) {
        // If no session, redirect to login
        router.push(
          "/login?callbackUrl=" +
            encodeURIComponent(
              window.location.pathname + window.location.search
            )
        );
        return;
      }

      setIsLoading(true);
      const currentStatus = watchlisted;
      const newStatus = !currentStatus;

      // Optimistic UI update and Zustand store update
      setWatchlisted(newStatus);
      const watchlistItemForStore = {
        id: item.id,
        type: itemType.toUpperCase(),
      };
      if (newStatus) {
        addToWatchlist(watchlistItemForStore);
      } else {
        removeFromWatchlist(watchlistItemForStore);
      }

      try {
        // Prepare itemData carefully, ensuring all fields expected by the backend are present
        // and that fields specific to movies or TV shows are handled.
        const preparedItemData = {
          id: item.id, // TMDB ID
          title: item.title || item.name, // Generic title
          name:
            itemType.toUpperCase() === "TV"
              ? item.name || item.title
              : undefined, // Specifically for TV
          poster_path: item.poster_path,
          genre_ids: item.genre_ids,
          vote_average: item.vote_average,
          release_date:
            itemType.toUpperCase() === "MOVIE" ? item.release_date : undefined, // For movies
          first_air_date:
            itemType.toUpperCase() === "TV" ? item.first_air_date : undefined, // For TV
          // Add any other common fields you want to store in itemData for quick display from watchlist
          overview: item.overview, // Good to have for watchlist display
        };

        const response = await fetch("/api/watchList", {
          method: newStatus ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: item.id,
            itemType: itemType.toUpperCase(),
            itemData: newStatus ? preparedItemData : undefined, // Only send itemData on POST
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.error || `API Error: ${response.status}`
          );
        }

        // console.log(`Item ${newStatus ? 'added to' : 'removed from'} watchlist via API.`); // Alert removed
        if (onWatchlistChange) onWatchlistChange(item, newStatus);
      } catch (error) {
        // Revert optimistic UI update and Zustand store on error
        setWatchlisted(currentStatus);
        if (currentStatus) {
          addToWatchlist(watchlistItemForStore);
        } else {
          removeFromWatchlist(watchlistItemForStore);
        }
        console.error("Watchlist update failed:", error.message);
        // alert(`Error updating watchlist: ${error.message || "Please try again."}`); // Alert removed
        if (onWatchlistChange) onWatchlistChange(item, currentStatus); // Revert status in parent too
      } finally {
        setIsLoading(false);
      }
    },
    [
      watchlisted,
      session,
      status,
      item,
      itemType,
      router,
      addToWatchlist,
      removeFromWatchlist,
      onWatchlistChange,
    ]
  );

  if (!item || typeof item.id === "undefined") {
    return null;
  }

  return (
    <button
      onClick={handleToggleWatchlist}
      className={`p-2 dark:bg-black/70 bg-gray-300/70 rounded-full backdrop-blur-sm transition-all duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
        watchlisted
          ? "text-yellow-400 hover:text-yellow-300 scale-105"
          : "dark:text-white text-foreground hover:text-primary dark:hover:text-yellow-400"
      } ${
        isLoading
          ? "cursor-not-allowed opacity-70"
          : "hover:scale-110 active:scale-100"
      }`}
      aria-label={watchlisted ? "Remove from watchlist" : "Add to watchlist"}
      disabled={status === "loading" || isLoading} // Disable while session is loading or button is processing
      title={watchlisted ? "Remove from watchlist" : "Add to watchlist"}
    >
      {status === "loading" && isLoading ? ( // Show spinner if session is loading AND button is processing
        <FaSpinner className="animate-spin" size={small ? 16 : 20} />
      ) : isLoading ? ( // Show spinner if only button is processing
        <FaSpinner className="animate-spin" size={small ? 16 : 20} />
      ) : watchlisted ? (
        <FaBookmark size={small ? 16 : 20} />
      ) : (
        <FaRegBookmark size={small ? 16 : 20} />
      )}
    </button>
  );
}
