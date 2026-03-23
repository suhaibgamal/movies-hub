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

export default function WatchlistClient({ initialItems = [] }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hydratedItems, setHydratedItems] = useState(initialItems);
  const { syncWatchlist: syncZustandWatchlist } = useWatchlistActions();

  const [filterType, setFilterType] = useState("ALL"); // "ALL", "MOVIE", "TV"

  // Redirect if unauthenticated
  useEffect(() => {
    if (status === "loading") return;
    if (!session && status === "unauthenticated") {
      router.push("/login?callbackUrl=/watchlist");
    }
  }, [session, status, router]);

  // Sync Zustand store with the server-provided items
  useEffect(() => {
    if (hydratedItems.length > 0) {
      const storeItems = hydratedItems.map((item) => ({
        id: item.id,
        type: item.media_type?.toUpperCase() || "MOVIE",
      }));
      syncZustandWatchlist(storeItems);
    }
  }, [hydratedItems, syncZustandWatchlist]);

  const handleWatchlistItemRemovedLocally = useCallback(
    (removedItemId, removedItemType) => {
      setHydratedItems((prevItems) =>
        prevItems.filter(
          (item) =>
            !(
              item.id === removedItemId &&
              item.media_type === removedItemType.toLowerCase()
            )
        )
      );
    },
    []
  );

  const filteredItems = useMemo(() => {
    return hydratedItems.filter((item) => {
      if (filterType === "ALL") return true;
      return item.media_type === filterType.toLowerCase();
    });
  }, [hydratedItems, filterType]);

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

        {filteredItems.length === 0 ? (
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
            movies={filteredItems}
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
                    "WatchlistClient onWatchlistChange: invalid item data.",
                    itemJustToggled
                  );
                }
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
