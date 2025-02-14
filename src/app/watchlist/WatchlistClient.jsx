"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MovieCard from "@/app/components/MovieCard";
import { useSession } from "next-auth/react";
import { useWatchlistActions } from "@/app/store/watchlistStore";

const GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export default function WatchlistClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [watchlistItems, setWatchlistItems] = useState([]);
  const { syncWatchlist } = useWatchlistActions();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/api/auth/signin");
      return;
    }
    const fetchWatchlist = async () => {
      try {
        const res = await fetch("/api/watchList", {
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(res.statusText);
        const { watchlist } = await res.json();
        setWatchlistItems(watchlist || []);
        const movieIds = (watchlist || []).map((item) => item.movieId);
        syncWatchlist(movieIds);
      } catch (error) {
        console.error("Fetch Error:", error);
      }
    };
    fetchWatchlist();
  }, [session, status, router, syncWatchlist]);

  const handleDelete = useCallback((movieId) => {
    setWatchlistItems((prev) =>
      prev.filter((item) => item.movieId !== movieId)
    );
  }, []);

  if (status === "loading")
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        Loading...
      </div>
    );
  if (!session) return null;

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-foreground">
          My WatchList
        </h1>
        {watchlistItems.length === 0 ? (
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Your watchlist is empty!
            </h2>
            <p className="text-lg font-semibold text-foreground">
              Add Movies to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlistItems.map((item) => (
              <MovieCard
                key={item.id}
                movie={{ ...item.movieData, id: item.movieId }}
                href={`/movie/${item.movieId}`}
                genres={GENRES}
                initialWatchlisted={true}
                small={true}
                deletable={true}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
