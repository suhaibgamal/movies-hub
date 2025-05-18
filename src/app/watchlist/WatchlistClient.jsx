// src/app/watchlist/WatchlistClient.jsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  useWatchlistActions,
  useWatchlist as useZustandWatchlist,
} from "@/app/store/watchlistStore";
import MoviesGrid from "@/app/components/MoviesGrid";
import GridCardSkeleton from "@/app/components/GridCardSkeleton";
import { BookmarkX, Film, Tv as TvIcon, ListFilter } from "lucide-react";

// ToggleButton component (can be shared or defined locally if only used here)
const ToggleButton = ({
  label,
  icon: Icon,
  isActive,
  onClick,
  value,
  disabled = false,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={isActive}
    onClick={() => onClick(value)}
    disabled={disabled}
    className={`
      flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-150 ease-in-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background
      disabled:opacity-50 disabled:cursor-not-allowed
      ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "bg-card text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/50"
      }
    `}
  >
    {Icon && <Icon size={14} className="shrink-0" />}
    <span className="truncate">{label}</span>
  </button>
);

export default function WatchlistClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [apiWatchlistItems, setApiWatchlistItems] = useState([]); // Raw items from API
  const [loading, setLoading] = useState(true);
  const { syncWatchlist: syncZustandWatchlist } = useWatchlistActions();

  const [filterType, setFilterType] = useState("ALL"); // "ALL", "MOVIE", "TV"

  useEffect(() => {
    if (status === "loading") return; // Wait until session status is determined
    if (!session && status === "unauthenticated") {
      // If definitely unauthenticated
      router.push("/login?callbackUrl=/watchlist");
      return;
    }
    if (session) {
      // Only fetch if session exists
      const fetchWatchlist = async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/watchList");
          if (!res.ok) {
            console.error("Failed to fetch watchlist:", res.statusText);
            throw new Error(`Failed to fetch watchlist: ${res.statusText}`);
          }
          const data = await res.json();
          const fetchedItems = data.watchlist || [];
          setApiWatchlistItems(fetchedItems);

          // Sync with Zustand store
          const storeItems = fetchedItems.map((item) => ({
            id: item.itemId,
            type: item.itemType, // API returns "MOVIE" or "TV"
          }));
          syncZustandWatchlist(storeItems);
        } catch (error) {
          console.error("Fetch Watchlist Error:", error);
          setApiWatchlistItems([]); // Set to empty on error to avoid processing undefined
        } finally {
          setLoading(false);
        }
      };
      fetchWatchlist();
    }
  }, [session, status, router, syncZustandWatchlist]);

  const handleWatchlistItemRemovedLocally = useCallback(
    (removedItemId, removedItemType) => {
      // removedItemType is expected to be UPPERCASE ("MOVIE" or "TV")
      setApiWatchlistItems((prevItems) =>
        prevItems.filter(
          (item) =>
            !(
              item.itemId === removedItemId && item.itemType === removedItemType
            )
        )
      );
    },
    []
  );

  const filteredAndTransformedItems = useMemo(() => {
    return apiWatchlistItems
      .filter((item) => {
        if (filterType === "ALL") return true;
        // Ensure item.itemType is a string before comparing
        return (
          typeof item.itemType === "string" && item.itemType === filterType
        );
      })
      .map((item) => {
        const itemData =
          typeof item.itemData === "object" && item.itemData !== null
            ? item.itemData
            : {};
        const mediaTypeString =
          typeof item.itemType === "string"
            ? item.itemType.toLowerCase()
            : "unknown";

        // Explicitly pull all necessary fields for cards from itemData, with fallbacks
        return {
          // Core fields expected by cards
          id: item.itemId,
          media_type: mediaTypeString,
          title: itemData.title || itemData.name || "Untitled", // For MovieCard and general display
          name: itemData.name || itemData.title || "Untitled", // For SeriesCard
          poster_path: itemData.poster_path || null,
          vote_average:
            typeof itemData.vote_average === "number"
              ? itemData.vote_average
              : 0,
          genre_ids: Array.isArray(itemData.genre_ids)
            ? itemData.genre_ids
            : [],
          overview: itemData.overview || "", // Good for WatchlistButton's preparedItemData

          // Type-specific date fields
          release_date: itemData.release_date, // For MovieCard year
          first_air_date: itemData.first_air_date, // For SeriesCard year (ensure this is in itemData for TV!)

          // Include other fields from itemData if cards use them directly
          // This spread includes everything else from itemData, but above ensures critical ones are present
          ...itemData,
        };
      });
  }, [apiWatchlistItems, filterType]);

  const aboveTheFoldCount = useMemo(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 2;
      if (window.innerWidth < 768) return 3;
      if (window.innerWidth < 1024) return 4;
      if (window.innerWidth < 1280) return 5;
      return 6;
    }
    return 6;
  }, []);

  if (status === "loading") {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading Watchlist...</p>
        </div>
      </main>
    );
  }

  if (!session && status === "unauthenticated") {
    // Should have been redirected by useEffect, but this is a fallback UI.
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-lg text-muted-foreground">
          Please log in to view your watchlist.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 md:flex md:items-center md:justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4 md:mb-0">
            My Watchlist
          </h1>
          <div className="flex space-x-1 sm:space-x-2 rounded-md bg-muted dark:bg-card/50 p-1 w-full md:w-auto">
            <ToggleButton
              label="All"
              icon={ListFilter}
              isActive={filterType === "ALL"}
              onClick={setFilterType}
              value="ALL"
            />
            <ToggleButton
              label="Movies"
              icon={Film}
              isActive={filterType === "MOVIE"}
              onClick={setFilterType}
              value="MOVIE"
            />
            <ToggleButton
              label="TV Shows"
              icon={TvIcon}
              isActive={filterType === "TV"}
              onClick={setFilterType}
              value="TV"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {/* Show a few skeletons based on typical items or a fixed number */}
            {Array.from({
              length: Math.min(
                filteredAndTransformedItems.length || aboveTheFoldCount,
                12
              ),
            }).map((_, index) => (
              <GridCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        ) : filteredAndTransformedItems.length === 0 ? (
          <div className="text-center space-y-4 py-16 sm:py-20">
            <BookmarkX className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-muted-foreground/70 mb-4" />
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              {filterType === "ALL" && "Your watchlist is empty!"}
              {filterType === "MOVIE" && "No movies in your watchlist."}
              {filterType === "TV" && "No TV shows in your watchlist."}
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              {filterType === "ALL"
                ? "Add some movies or TV shows to see them here."
                : `Browse and add some ${
                    filterType === "MOVIE" ? "movies" : "TV shows"
                  }!`}
            </p>
          </div>
        ) : (
          <MoviesGrid
            movies={filteredAndTransformedItems}
            onWatchlistChange={(itemJustToggled, newStatus) => {
              if (!newStatus) {
                if (
                  itemJustToggled &&
                  typeof itemJustToggled.id !== "undefined" &&
                  typeof itemJustToggled.media_type === "string"
                ) {
                  handleWatchlistItemRemovedLocally(
                    itemJustToggled.id,
                    itemJustToggled.media_type.toUpperCase()
                  );
                } else {
                  console.error(
                    "WatchlistClient onWatchlistChange: itemJustToggled or its properties (id, media_type) are undefined/invalid. Cannot update local list.",
                    itemJustToggled
                  );
                  // Fallback: To ensure UI consistency if local removal fails, you might trigger a full refetch.
                  // For now, relying on the next full fetch/sync or store update from other interactions.
                }
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
