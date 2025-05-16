// app/components/watchlistButton.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaRegBookmark, FaBookmark, FaSpinner } from "react-icons/fa";
import { useWatchlist, useWatchlistActions } from "@/app/store/watchlistStore";
import { useToast } from "@/app/components/ui/use-toast";

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
  const { toast } = useToast();
  const [watchlisted, setWatchlisted] = useState(initialWatchlisted);
  const [isLoading, setIsLoading] = useState(false);

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

      setIsLoading(true);
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
              genre_ids: movie.genre_ids,
              vote_average: movie.vote_average,
              release_date: movie.release_date,
            },
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error || `HTTP ${response.status}`);
        }
        if (onWatchlistChange) onWatchlistChange(newStatus);
        toast({
          title: newStatus ? "Added to Watchlist" : "Removed from Watchlist",
          description: movie.title,
          duration: 2000,
        });
      } catch (error) {
        setWatchlisted(currentStatus);
        currentStatus
          ? addToWatchlist(movie.id)
          : removeFromWatchlist(movie.id);
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
      movie,
      router,
      addToWatchlist,
      removeFromWatchlist,
      onWatchlistChange,
      toast,
    ]
  );

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
