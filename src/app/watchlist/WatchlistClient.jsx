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
// Skeleton for card grid loading
import GridCardSkeleton from "@/app/components/GridCardSkeleton"; // Use the grid card skeleton
import { BookmarkX, Film, Tv as TvIcon, ListFilter } from "lucide-react"; // Icons for empty state and toggles

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
  const { syncWatchlist: syncZustandWatchlist } = useWatchlistActions(); // From Zustand
  const zustandWatchlist = useZustandWatchlist(); // Get current Zustand watchlist for initial state or comparison

  const [filterType, setFilterType] = useState("ALL"); // "ALL", "MOVIE", "TV"

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login?callbackUrl=/watchlist"); // Redirect to login with callback
      return;
    }

    const fetchWatchlist = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/watchList"); // GET request by default
        if (!res.ok) {
          console.error("Failed to fetch watchlist:", res.statusText);
          throw new Error(`Failed to fetch watchlist: ${res.statusText}`);
        }
        const data = await res.json();
        setApiWatchlistItems(data.watchlist || []);

        // Sync with Zustand store - ensure IDs and types match store structure
        const storeItems = (data.watchlist || []).map((item) => ({
          id: item.itemId, // Assuming your API returns itemId
          type: item.itemType, // Assuming your API returns itemType ("MOVIE" or "TV")
        }));
        syncZustandWatchlist(storeItems);
      } catch (error) {
        console.error("Fetch Watchlist Error:", error);
        // Optionally set an error state here to display to the user
      } finally {
        setLoading(false);
      }
    };
    fetchWatchlist();
  }, [session, status, router, syncZustandWatchlist]);

  // This callback is passed to MoviesGrid -> WatchlistButton
  // It ensures that if an item is removed from the watchlist page itself,
  // the UI updates immediately without needing a full refetch from the API.
  const handleWatchlistItemRemovedLocally = useCallback(
    (removedItemId, removedItemType) => {
      setApiWatchlistItems((prevItems) =>
        prevItems.filter(
          (item) =>
            !(
              item.itemId === removedItemId && item.itemType === removedItemType
            )
        )
      );
      // Zustand store is updated by WatchlistButton itself
    },
    []
  );

  const filteredAndTransformedItems = useMemo(() => {
    return apiWatchlistItems
      .filter((item) => {
        if (filterType === "ALL") return true;
        return item.itemType === filterType; // API returns "MOVIE" or "TV"
      })
      .map((item) => {
        // Ensure itemData exists and is an object before spreading
        const itemData =
          typeof item.itemData === "object" && item.itemData !== null
            ? item.itemData
            : {};
        return {
          ...itemData, // Spread the actual movie/TV details
          id: item.itemId,
          media_type: item.itemType.toLowerCase(), // "movie" or "tv" for Card components
          // Add any other transformations needed for MovieCard/SeriesCard if itemData is minimal
          // For example, if WatchlistButton expects a 'title' for alerts:
          title: itemData.title || itemData.name,
          name: itemData.name || itemData.title, // For SeriesCard
        };
      });
  }, [apiWatchlistItems, filterType]);

  const aboveTheFoldCount = useMemo(() => {
    // Calculate based on typical grid items visible
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return 2; // sm
      if (window.innerWidth < 768) return 3; // md
      if (window.innerWidth < 1024) return 4; // lg
      if (window.innerWidth < 1280) return 5; // xl
      return 6; // 2xl+
    }
    return 6; // Default for SSR or if window is not defined
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
    // This case should ideally be handled by the redirect in useEffect,
    // but as a fallback or if redirect hasn't completed.
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
            {Array.from({
              length: Math.min(
                apiWatchlistItems.length || aboveTheFoldCount,
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
                : `Browse and add some ${filterType.toLowerCase()}s!`}
            </p>
          </div>
        ) : (
          <MoviesGrid
            movies={filteredAndTransformedItems}
            // The onWatchlistChange for MoviesGrid is essentially to react if an item is removed
            // The WatchlistButton itself handles API calls and Zustand store updates
            onWatchlistChange={(itemJustToggled, newStatus) => {
              if (!newStatus) {
                // If item was removed (newStatus is false)
                handleWatchlistItemRemovedLocally(
                  itemJustToggled.id,
                  itemJustToggled.media_type.toUpperCase()
                );
              }
              // If added, the API fetch on next load or Zustand sync should handle it
            }}
          />
        )}
      </div>
    </main>
  );
}
