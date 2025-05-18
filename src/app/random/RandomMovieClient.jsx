// src/app/random/RandomMovieClient.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import MovieCard from "@/app/components/MovieCard";
import SeriesCard from "@/app/components/SeriesCard"; // Import SeriesCard
import { useWatchlist as useZustandWatchlist } from "@/app/store/watchlistStore"; // For initialWatchlisted prop
import SkeletonLoader from "@/app/components/SkeletonLoader"; // For card loading
import {
  Shuffle,
  Film,
  Tv as TvIcon,
  SearchX,
  Filter,
  ChevronDown,
} from "lucide-react";
import { GENRES, TV_GENRES } from "@/lib/constants";

// Helper to fetch items (movies or TV shows)
const fetchDiscoverItems = async (
  itemType = "MOVIE",
  genreId = "",
  pageLimit = 50
) => {
  try {
    const typePath = itemType === "TV" ? "tv" : "movie";
    const dateFilterKey =
      itemType === "TV" ? "first_air_date.gte" : "primary_release_date.gte";

    // Broader criteria for more randomness, but still some quality control
    let url = `https://api.themoviedb.org/3/discover/${typePath}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=en-US&sort_by=popularity.desc&vote_average.gte=6.0&vote_count.gte=100&${dateFilterKey}=1990-01-01&include_adult=false`;

    if (genreId) {
      url += `&with_genres=${genreId}`;
    }

    // Fetch page 1 to determine total_pages for random selection
    const initialRes = await fetch(url + "&page=1");
    if (!initialRes.ok) {
      console.error(
        `Failed to fetch initial page for ${itemType}:`,
        await initialRes.text()
      );
      throw new Error(`Failed to fetch initial page for ${itemType}`);
    }
    const initialData = await initialRes.json();
    const totalPages = initialData.total_pages;

    // TMDB API limits discover results to 500 pages. Pick a random page within this limit or total_pages.
    const availablePages = Math.min(
      totalPages,
      pageLimit > 0 ? pageLimit : 500
    ); // Use pageLimit if provided, else 500
    if (availablePages === 0) return []; // No items match criteria

    const randomPage = Math.floor(Math.random() * availablePages) + 1;
    const finalUrl = `${url}&page=${randomPage}`;

    const finalRes = await fetch(finalUrl);
    if (!finalRes.ok) {
      console.error(
        `Failed to fetch random page for ${itemType}:`,
        await finalRes.text()
      );
      throw new Error(`Failed to fetch random page for ${itemType}`);
    }
    const finalData = await finalRes.json();
    return (finalData.results || []).map((item) => ({
      ...item,
      media_type: itemType.toLowerCase(), // Ensure media_type is set
    }));
  } catch (error) {
    console.error(`Error in fetchDiscoverItems for ${itemType}:`, error);
    return []; // Return empty array on error
  }
};

export default function RandomClient() {
  const [selectedItemType, setSelectedItemType] = useState("MOVIE"); // "MOVIE" or "TV"
  const [selectedGenre, setSelectedGenre] = useState(""); // Genre ID

  const [itemCache, setItemCache] = useState({ MOVIE: [], TV: [] }); // Separate caches
  const [seenItems, setSeenItems] = useState({ MOVIE: [], TV: [] }); // Track seen {id} for each type

  const [randomItem, setRandomItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Initial load
  const [isPicking, setIsPicking] = useState(false); // For "Get Random" button click
  const [error, setError] = useState(null);

  const zustandWatchlist = useZustandWatchlist();

  const currentGenres = useMemo(() => {
    return selectedItemType === "TV" ? TV_GENRES : GENRES;
  }, [selectedItemType]);

  const pickRandomItem = useCallback(async () => {
    setIsPicking(true);
    setError(null);
    setRandomItem(null); // Clear previous item while loading new one

    let currentTypeCache = [...itemCache[selectedItemType]];
    let currentTypeSeen = [...seenItems[selectedItemType]];

    // Filter out already seen items from the cache that match the current genre
    let availableItems = currentTypeCache.filter(
      (item) =>
        (!selectedGenre ||
          (item.genre_ids && item.genre_ids.includes(Number(selectedGenre)))) &&
        !currentTypeSeen.includes(item.id)
    );

    // If not enough suitable items in cache, fetch more
    if (availableItems.length < 5) {
      // Fetch if fewer than 5 suitable items left
      const fetchedNewItems = await fetchDiscoverItems(
        selectedItemType,
        selectedGenre
      );
      if (fetchedNewItems.length > 0) {
        // Add to cache, avoiding duplicates
        const newCache = [...currentTypeCache];
        fetchedNewItems.forEach((newItem) => {
          if (!newCache.some((cachedItem) => cachedItem.id === newItem.id)) {
            newCache.push(newItem);
          }
        });
        setItemCache((prev) => ({ ...prev, [selectedItemType]: newCache }));
        currentTypeCache = newCache; // Update currentTypeCache for immediate use

        // Re-filter available items with new cache data
        availableItems = currentTypeCache.filter(
          (item) =>
            (!selectedGenre ||
              (item.genre_ids &&
                item.genre_ids.includes(Number(selectedGenre)))) &&
            !currentTypeSeen.includes(item.id)
        );
      }
    }

    // If all items matching filters have been seen, reset seen list for this type/genre combo
    if (
      availableItems.length === 0 &&
      currentTypeCache.filter(
        (item) =>
          !selectedGenre ||
          (item.genre_ids && item.genre_ids.includes(Number(selectedGenre)))
      ).length > 0
    ) {
      // console.log(`All ${selectedItemType}s (genre: ${selectedGenre || 'any'}) seen. Resetting seen list for this filter.`);
      currentTypeSeen = [];
      setSeenItems((prev) => ({ ...prev, [selectedItemType]: [] }));
      availableItems = currentTypeCache.filter(
        (item) =>
          (!selectedGenre ||
            (item.genre_ids &&
              item.genre_ids.includes(Number(selectedGenre)))) &&
          !currentTypeSeen.includes(item.id) // Should now include all items matching genre
      );
    }

    if (availableItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableItems.length);
      const chosenItem = availableItems[randomIndex];
      setRandomItem(chosenItem);
      setSeenItems((prev) => ({
        ...prev,
        [selectedItemType]: [...prev[selectedItemType], chosenItem.id],
      }));
    } else {
      setError(
        `No ${selectedItemType.toLowerCase()}s found for the selected criteria. Try a different genre or clear filters.`
      );
      setRandomItem(null);
    }
    setIsPicking(false);
  }, [itemCache, seenItems, selectedItemType, selectedGenre]);

  // Initial load
  useEffect(() => {
    const initialLoad = async () => {
      setIsLoading(true);
      await pickRandomItem(); // Pick one immediately on load
      setIsLoading(false);
    };
    initialLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch only on initial mount

  // Handler for button click
  const handleGetRandom = () => {
    pickRandomItem();
  };

  // Reset genre when item type changes
  useEffect(() => {
    setSelectedGenre("");
    // Optionally, auto-pick a new item when type changes if desired
    // pickRandomItem(); // This might be too eager, let user click "Get Random"
  }, [selectedItemType]);

  const isWatchlisted = useMemo(() => {
    if (!randomItem || !zustandWatchlist) return false;
    return zustandWatchlist.some(
      (watchItem) =>
        watchItem.id === randomItem.id &&
        watchItem.type === randomItem.media_type.toUpperCase()
    );
  }, [randomItem, zustandWatchlist]);

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row items-center justify-center p-4 overflow-hidden">
      {/* Controls Section */}
      <div className="w-full lg:w-1/3 xl:w-1/4 flex flex-col items-center justify-center p-4 space-y-4 sm:space-y-5 lg:h-full">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent py-2">
          Random Picker
        </h1>

        {/* Item Type Toggle */}
        <div className="flex space-x-1 sm:space-x-2 rounded-md bg-muted dark:bg-card/50 p-1 w-full max-w-xs">
          <button
            onClick={() => setSelectedItemType("MOVIE")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              selectedItemType === "MOVIE"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-background/70"
            }`}
          >
            <Film size={14} /> Movies
          </button>
          <button
            onClick={() => setSelectedItemType("TV")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
              selectedItemType === "TV"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-background/70"
            }`}
          >
            <TvIcon size={14} /> TV Shows
          </button>
        </div>

        {/* Genre Filter */}
        <div className="relative w-full max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
            <Filter size={16} />
          </span>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 sm:py-3 rounded-lg border bg-card text-card-foreground focus:ring-1 focus:ring-primary focus:border-primary transition-all text-sm appearance-none"
            aria-label="Select Genre"
          >
            <option value="">
              All {selectedItemType === "TV" ? "TV Genres" : "Movie Genres"}
            </option>
            {Object.entries(currentGenres).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 pointer-events-none">
            <ChevronDown size={18} />{" "}
            {/* Using ChevronDown from earlier example */}
          </span>
        </div>

        <button
          onClick={handleGetRandom}
          disabled={isPicking || isLoading}
          className="w-full max-w-xs px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-white hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
          aria-label={
            isPicking || isLoading
              ? "Picking..."
              : `Get Random ${selectedItemType === "TV" ? "TV Show" : "Movie"}`
          }
        >
          <Shuffle size={18} />
          {isPicking || isLoading
            ? "Picking..."
            : `Get Random ${selectedItemType === "TV" ? "TV Show" : "Movie"}`}
        </button>
      </div>

      {/* Display Area */}
      <div className="w-full lg:w-2/3 xl:w-3/4 flex justify-center items-center p-4 lg:h-full mt-6 lg:mt-0">
        {isLoading ? ( // Initial page load skeleton
          <div className="w-full max-w-xs sm:max-w-sm">
            <SkeletonLoader />
          </div>
        ) : isPicking ? ( // Skeleton while picking a new item after button press
          <div className="w-full max-w-xs sm:max-w-sm">
            <GridCardSkeleton small={false} /> {/* Use the card skeleton */}
          </div>
        ) : randomItem ? (
          <div className="w-full max-w-xs sm:max-w-sm transform transition-all duration-500 ease-out scale-100 animate-fadeIn">
            {randomItem.media_type === "tv" ? (
              <SeriesCard
                series={randomItem}
                href={`/tv/${randomItem.id}`}
                // genres prop is implicitly TV_GENRES used inside SeriesCard if it imports it,
                // or pass currentGenres if SeriesCard expects it as a prop
                small={false} // Use larger card style
                initialWatchlisted={isWatchlisted}
                isAbove={true} // Treat as high priority since it's the focus
              />
            ) : (
              <MovieCard
                movie={randomItem}
                href={`/movie/${randomItem.id}`}
                // genres prop is implicitly GENRES used inside MovieCard, or pass currentGenres
                small={false} // Use larger card style
                initialWatchlisted={isWatchlisted}
                isAbove={true}
              />
            )}
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-4 bg-destructive/10 rounded-lg max-w-md">
            <SearchX className="mx-auto h-12 w-12 mb-2" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-4">
            <SearchX className="mx-auto h-12 w-12 mb-2" />
            <p>Click the button to get a random suggestion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
