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
  itemType = "MOVIE",
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
      setWatchlisted(false);
    }
  }, [zustandWatchlist, item, itemType, status]);

  const handleToggleWatchlist = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!item || typeof item.id === "undefined") {
        console.error("WatchlistButton: item or item.id is undefined.");
        return;
      }
      if (status === "loading") return;
      if (!session) {
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

      // Optimistic UI update
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
        // Only send itemId and itemType — no metadata needed
        const response = await fetch("/api/watchList", {
          method: newStatus ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId: item.id,
            itemType: itemType.toUpperCase(),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `API Error: ${response.status}`
          );
        }
        if (onWatchlistChange) onWatchlistChange(item, newStatus);
      } catch (error) {
        // Revert optimistic update on error
        setWatchlisted(currentStatus);
        if (currentStatus) {
          addToWatchlist(watchlistItemForStore);
        } else {
          removeFromWatchlist(watchlistItemForStore);
        }
        console.error("Watchlist update failed:", error.message);
        if (onWatchlistChange) onWatchlistChange(item, currentStatus);
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
      disabled={status === "loading" || isLoading}
      title={watchlisted ? "Remove from watchlist" : "Add to watchlist"}
    >
      {isLoading ? (
        <FaSpinner className="animate-spin" size={small ? 16 : 20} />
      ) : watchlisted ? (
        <FaBookmark size={small ? 16 : 20} />
      ) : (
        <FaRegBookmark size={small ? 16 : 20} />
      )}
    </button>
  );
}
