// app/components/watchlistButton.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaRegBookmark, FaBookmark, FaSpinner } from "react-icons/fa";
import { useWatchlist, useWatchlistActions } from "@/app/store/watchlistStore";
import { useToast } from "@/app/components/ui/use-toast";

export default function WatchlistButton({
  item,
  itemType = "MOVIE",
  small = false,
  initialWatchlisted = false,
  onWatchlistChange,
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const watchlist = useWatchlist();
  const { addToWatchlist, removeFromWatchlist } = useWatchlistActions();
  const { toast } = useToast();
  const [watchlisted, setWatchlisted] = useState(initialWatchlisted);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!item || typeof item.id === "undefined") return;
    const isItemInWatchlist = Array.isArray(watchlist)
      ? watchlist.some((watchlistItem) => {
          if (
            typeof watchlistItem === "object" &&
            watchlistItem !== null &&
            typeof watchlistItem.id !== "undefined" &&
            typeof watchlistItem.type !== "undefined"
          ) {
            return (
              watchlistItem.id === item.id && watchlistItem.type === itemType
            );
          }
          return watchlistItem === item.id;
        })
      : false;
    setWatchlisted(isItemInWatchlist);
  }, [watchlist, item, itemType]);

  const handleToggleWatchlist = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!item || typeof item.id === "undefined") {
        console.error("WatchlistButton: item or item.id is undefined.");
        return;
      }
      if (status === "loading") return;
      if (!session) return router.push("/api/auth/signin");

      setIsLoading(true);
      const currentStatus = watchlisted;
      const newStatus = !currentStatus;
      setWatchlisted(newStatus);

      const watchlistItemObject = { id: item.id, type: itemType };
      newStatus
        ? addToWatchlist(watchlistItemObject)
        : removeFromWatchlist(watchlistItemObject);

      try {
        const preparedItemData = {
          id: item.id,
          title: item.title || item.name,
          poster_path: item.poster_path,
          genre_ids: item.genre_ids,
          vote_average: item.vote_average,
          release_date:
            itemType === "TV" ? item.first_air_date : item.release_date,
        };

        const response = await fetch("/api/watchList", {
          method: newStatus ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            itemId: item.id,
            itemType: itemType,
            itemData: preparedItemData,
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(
            responseData.error || `HTTP error ${response.status}`
          );
        }
        if (onWatchlistChange) onWatchlistChange(newStatus);
        toast({
          title: newStatus ? "Added to Watchlist" : "Removed from Watchlist",
          description: item.title || item.name,
          duration: 2000,
        });
      } catch (error) {
        setWatchlisted(currentStatus);
        currentStatus
          ? addToWatchlist(watchlistItemObject)
          : removeFromWatchlist(watchlistItemObject);
        console.error("Watchlist update failed:", error.message);
        toast({
          variant: "destructive",
          title: "Error updating watchlist",
          description: error.message || "Please try again.",
          duration: 3000,
        });
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
      toast,
    ]
  );

  if (!item || typeof item.id === "undefined") {
    return null;
  }

  return (
    <button
      onClick={handleToggleWatchlist}
      className={`p-2 dark:bg-black/80 bg-gray-300/80 rounded-full backdrop-blur-sm transition-colors ${
        watchlisted
          ? "text-yellow-400 hover:text-yellow-300"
          : "dark:text-white text-foreground hover:opacity-75"
      } ${isLoading ? "cursor-not-allowed" : ""}`}
      aria-label={watchlisted ? "Remove from watchlist" : "Add to watchlist"}
      disabled={status === "loading" || isLoading}
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
