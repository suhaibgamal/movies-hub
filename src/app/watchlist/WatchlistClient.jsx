"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MovieCard from "@/app/components/MovieCard";
import SeriesCard from "@/app/components/SeriesCard";
import { useSession } from "next-auth/react";
import { useWatchlistActions } from "@/app/store/watchlistStore";
import SkeletonLoader from "../components/SkeletonLoader";
import { BookmarkX } from "lucide-react";
import { GENRES } from "@/lib/constants";

export default function WatchlistClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
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
        const storeItems = (watchlist || []).map((item) => ({
          id: item.itemId,
          type: item.itemType,
        }));
        syncWatchlist(storeItems);
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [session, status, router, syncWatchlist]);

  const handleDelete = useCallback((itemIdToDelete, itemTypeToDelete) => {
    setWatchlistItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.itemId === itemIdToDelete && item.itemType === itemTypeToDelete
          )
      )
    );
  }, []);

  const aboveTheFoldCount = 6;

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
          My Watchlist
        </h1>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: aboveTheFoldCount }).map((_, index) => (
              <SkeletonLoader key={index} />
            ))}
          </div>
        ) : watchlistItems.length === 0 ? (
          <div className="text-center space-y-4">
            <BookmarkX className="mx-auto h-20 w-20 text-muted-foreground mb-4" />
            <h2 className="text-3xl font-bold text-foreground">
              Your watchlist is empty!
            </h2>
            <p className="text-lg font-semibold text-foreground">
              Add items to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchlistItems.map((item, index) => {
              if (item.itemType === "MOVIE") {
                return (
                  <MovieCard
                    key={`${item.itemType}-${item.itemId}`}
                    movie={{ ...item.itemData, id: item.itemId }}
                    href={`/movie/${item.itemId}`}
                    genres={GENRES}
                    initialWatchlisted={true}
                    small={true}
                    deletable={true}
                    onDelete={() => handleDelete(item.itemId, item.itemType)}
                    isAbove={index < aboveTheFoldCount}
                  />
                );
              } else if (item.itemType === "TV") {
                return (
                  <SeriesCard
                    key={`${item.itemType}-${item.itemId}`}
                    series={{ ...item.itemData, id: item.itemId }}
                    href={`/tv/${item.itemId}`}
                    genres={GENRES}
                    initialWatchlisted={true}
                    small={true}
                    deletable={true}
                    onDelete={() => handleDelete(item.itemId, item.itemType)}
                    isAbove={index < aboveTheFoldCount}
                  />
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    </main>
  );
}
