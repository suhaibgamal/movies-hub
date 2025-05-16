"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useWatchlistActions } from "@/app/store/watchlistStore";
import MoviesGrid from "@/app/components/MoviesGrid";
import SkeletonLoader from "../components/SkeletonLoader";
import { BookmarkX } from "lucide-react";

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

  const handleWatchlistItemRemoved = useCallback(
    (itemIdToRemove, itemTypeToRemove) => {
      setWatchlistItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.itemId === itemIdToRemove &&
              item.itemType === itemTypeToRemove
            )
        )
      );
    },
    []
  );

  const aboveTheFoldCount = 6;

  const transformedItems = useMemo(() => {
    return watchlistItems.map((item) => ({
      ...item.itemData,
      id: item.itemId,
      media_type: item.itemType.toLowerCase(),
    }));
  }, [watchlistItems]);

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
        ) : transformedItems.length === 0 ? (
          <div className="text-center space-y-4 py-16">
            <BookmarkX className="mx-auto h-20 w-20 text-muted-foreground mb-4" />
            <h2 className="text-3xl font-bold text-foreground">
              Your watchlist is empty!
            </h2>
            <p className="text-lg text-muted-foreground">
              Add some movies or TV shows to see them here.
            </p>
          </div>
        ) : (
          <MoviesGrid
            movies={transformedItems}
            onWatchlistChange={(item, newStatus) => {
              if (!newStatus) {
                handleWatchlistItemRemoved(
                  item.id,
                  item.media_type.toUpperCase()
                );
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
