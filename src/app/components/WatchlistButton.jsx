// app/components/watchlistButton.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaRegBookmark, FaBookmark } from "react-icons/fa";
import { useWatchlist, useWatchlistActions } from "@/app/store/watchlistStore";

export default function WatchlistButton({
  movie,
  small = false,
  initialWatchlisted = false,
  onWatchlistChange,
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const watchlist = useWatchlist();
  const { addToWatchlist, removeFromWatchlist } = useWatchlistActions();
  const [watchlisted, setWatchlisted] = useState(initialWatchlisted);
  useEffect(() => {
    setWatchlisted(
      Array.isArray(watchlist) ? watchlist.includes(movie.id) : false
    );
  }, [watchlist, movie.id]);

  const handleToggleWatchlist = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (status === "loading") return;
      if (!session) return router.push("/api/auth/signin");

      const currentStatus = watchlisted;
      const newStatus = !currentStatus;
      setWatchlisted(newStatus);
      newStatus ? addToWatchlist(movie.id) : removeFromWatchlist(movie.id);

      try {
        const response = await fetch("/api/watchList", {
          method: newStatus ? "POST" : "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            movieId: movie.id,
            movieData: {
              id: movie.id,
              title: movie.title,
              poster_path: movie.poster_path,
              release_date: movie.release_date,
            },
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || `HTTP ${response.status}`);
        }
        if (onWatchlistChange) onWatchlistChange(newStatus);
      } catch (error) {
        setWatchlisted(currentStatus);
        currentStatus
          ? addToWatchlist(movie.id)
          : removeFromWatchlist(movie.id);
        console.error("Watchlist update failed:", error.message);
        alert(`Failed to update watchlist: ${error.message}`);
      }
    },
    [
      watchlisted,
      session,
      status,
      movie,
      router,
      addToWatchlist,
      removeFromWatchlist,
      onWatchlistChange,
    ]
  );

  return (
    <button
      onClick={handleToggleWatchlist}
      className={`p-2 dark:bg-black/80 bg-gray-300/80 rounded-full backdrop-blur-sm transition-colors ${
        watchlisted
          ? "text-yellow-400 hover:text-yellow-300"
          : "dark:text-white text-foreground hover:opacity-75"
      }`}
      aria-label={watchlisted ? "Remove from watchlist" : "Add to watchlist"}
      disabled={status === "loading"}
    >
      {watchlisted ? (
        <FaBookmark size={small ? 16 : 20} />
      ) : (
        <FaRegBookmark size={small ? 16 : 20} />
      )}
    </button>
  );
}
