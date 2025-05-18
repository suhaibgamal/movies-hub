// src/app/random/RandomMovieClient.jsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react"; // Added useRef
import MovieCard from "@/app/components/MovieCard";
import SeriesCard from "@/app/components/SeriesCard";
import { useWatchlist as useZustandWatchlist } from "@/app/store/watchlistStore";
import GridCardSkeleton from "@/app/components/GridCardSkeleton";
import {
  Shuffle,
  Film,
  Tv as TvIcon,
  SearchX,
  Filter as FilterIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GENRES as MOVIE_GENRES, TV_GENRES } from "@/lib/constants";

// Define Rating options
const RATING_OPTIONS_RANDOM = [
  { value: "", label: "Any Rating" },
  { value: "8", label: "8+" },
  { value: "7", label: "7+" },
  { value: "6", label: "6+" },
  { value: "5", label: "5+" },
];

// Generate Year options
const currentYear = new Date().getFullYear();
const YEAR_OPTIONS_RANDOM = [
  { value: "", label: "Any Year" },
  ...Array.from({ length: 30 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  })),
  { value: "2000s", label: "2000-2009", gte: "2000-01-01", lte: "2009-12-31" },
  { value: "1990s", label: "1990-1999", gte: "1990-01-01", lte: "1999-12-31" },
  { value: "1980s", label: "1980-1989", gte: "1980-01-01", lte: "1989-12-31" }, // Corrected lte date
];

// API fetching logic
const fetchRandomDiscoverItems = async ({
  mediaType,
  genre,
  rating,
  year,
  pageLimit = 20, // How many API pages to consider for random selection
}) => {
  try {
    const typePath = mediaType === "tv" ? "tv" : "movie";
    const dateFilterKey =
      mediaType === "tv" ? "first_air_date" : "primary_release_date";

    let discoverUrl = `https://api.themoviedb.org/3/discover/${typePath}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=en-US&sort_by=popularity.desc&vote_count.gte=100&include_adult=false`;

    if (genre) discoverUrl += `&with_genres=${genre}`;
    if (rating) discoverUrl += `&vote_average.gte=${rating}`;

    const yearOption = YEAR_OPTIONS_RANDOM.find((y) => y.value === year);
    if (yearOption) {
      if (yearOption.gte && yearOption.lte) {
        discoverUrl += `&${dateFilterKey}.gte=${yearOption.gte}&${dateFilterKey}.lte=${yearOption.lte}`;
      } else if (
        !yearOption.gte &&
        !yearOption.lte &&
        yearOption.value !== ""
      ) {
        discoverUrl += `&${
          mediaType === "tv" ? "first_air_date_year" : "primary_release_year"
        }=${year}`;
      }
    }

    const initialRes = await fetch(discoverUrl + "&page=1");
    if (!initialRes.ok) {
      const errorBody = await initialRes.text();
      console.error(
        `Failed to fetch initial page for ${mediaType} discovery: ${initialRes.status}`,
        errorBody
      );
      throw new Error(
        `Failed to fetch initial page for ${mediaType} (status ${initialRes.status})`
      );
    }
    const initialData = await initialRes.json();
    let totalPages = initialData.total_pages;

    totalPages = Math.min(totalPages, 500); // TMDB limit
    if (totalPages === 0) return [];

    const randomPageToFetch =
      Math.floor(Math.random() * Math.min(totalPages, pageLimit)) + 1;

    const finalRes = await fetch(`${discoverUrl}&page=${randomPageToFetch}`);
    if (!finalRes.ok) {
      const errorBody = await finalRes.text();
      console.error(
        `Failed to fetch random page ${randomPageToFetch} for ${mediaType}: ${finalRes.status}`,
        errorBody
      );
      throw new Error(
        `Failed to fetch random page for ${mediaType} (status ${finalRes.status})`
      );
    }
    const finalData = await finalRes.json();
    return (finalData.results || []).map((item) => ({
      ...item,
      media_type: typePath,
    }));
  } catch (error) {
    console.error(`Error in fetchRandomDiscoverItems for ${mediaType}:`, error);
    return []; // Propagate empty array on error to handle upstream
  }
};

export default function RandomClient() {
  const [randomItem, setRandomItem] = useState(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true); // For the very first load
  const [isPicking, setIsPicking] = useState(false); // For subsequent picks or filter changes
  const [error, setError] = useState(null);

  const [mediaType, setMediaType] = useState("movie");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Controls visibility of filter *input fields* on mobile.
  const [showFilterInputs, setShowFilterInputs] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const [itemCache, setItemCache] = useState({ movie: [], tv: [] });
  const [seenItems, setSeenItems] = useState({
    movie: new Set(),
    tv: new Set(),
  });

  const zustandWatchlist = useZustandWatchlist();
  const isMounted = useRef(false); // To prevent filter useEffect from running on initial mount

  const currentGenreOptions = useMemo(
    () => (mediaType === "movie" ? MOVIE_GENRES : TV_GENRES),
    [mediaType]
  );

  // Effect to determine if on mobile for layout adjustments
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        const mobileCheck = window.innerWidth < 1024; // lg breakpoint
        setIsMobile(mobileCheck);
        if (!mobileCheck) {
          // If on desktop
          setShowFilterInputs(true); // Always show filter inputs on desktop
        }
      }
    };
    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const pickAndSetRandomItem = useCallback(
    async (isInitialCall = false) => {
      if (isInitialCall) {
        setIsLoadingInitial(true);
      } else {
        setIsPicking(true);
      }
      setError(null);
      // setRandomItem(null); // Clear previous item visually slightly later or let skeleton handle it

      let currentCache = itemCache[mediaType];
      let currentSeen = seenItems[mediaType];

      // Try to find an item from the current cache that hasn't been seen
      let potentialItemsFromCache = currentCache.filter(
        (item) => !currentSeen.has(item.id)
      );

      if (
        potentialItemsFromCache.length === 0 &&
        currentCache.length > 0 &&
        currentSeen.size >= currentCache.length
      ) {
        // All items in cache for this media type have been seen, reset seen set for this media type
        // console.log(`Resetting seen items for ${mediaType} as all cached items were seen.`);
        setSeenItems((prev) => ({ ...prev, [mediaType]: new Set() }));
        currentSeen = new Set(); // Use the new empty set for this pick
        potentialItemsFromCache = currentCache.filter(
          (item) => !currentSeen.has(item.id)
        ); // Re-filter
      }

      if (
        potentialItemsFromCache.length > 0 &&
        !isInitialCall &&
        !isMounted.current
      ) {
        // isMounted.current helps avoid using cache if filters just changed
        // Use from cache if available and not an initial call or immediate filter change
        const randomIndex = Math.floor(
          Math.random() * potentialItemsFromCache.length
        );
        const chosenItem = potentialItemsFromCache[randomIndex];
        setRandomItem(chosenItem);
        setSeenItems((prev) => ({
          ...prev,
          [mediaType]: new Set(prev[mediaType]).add(chosenItem.id),
        }));
      } else {
        // Fetch new items:
        // - If cache is empty
        // - If all cached items were seen (and seen list was reset) but we still need one (e.g. on a direct "get another" click)
        // - If filters changed (isMounted.current would be true, and this block is hit)
        // - On initial call
        setRandomItem(null); // Clear item before fetching new batch to show loading/skeleton
        const newItems = await fetchRandomDiscoverItems({
          mediaType,
          genre: selectedGenre,
          rating: selectedRating,
          year: selectedYear,
        });

        if (newItems.length === 0) {
          setError(
            `No ${
              mediaType === "tv" ? "TV shows" : "movies"
            } found for the selected criteria. Try different filters!`
          );
          setRandomItem(null); // Ensure no item is displayed
        } else {
          // Add new items to cache, avoiding duplicates by ID with existing cache
          const updatedCacheMap = new Map(
            currentCache.map((item) => [item.id, item])
          );
          newItems.forEach((newItem) => {
            if (!updatedCacheMap.has(newItem.id)) {
              updatedCacheMap.set(newItem.id, newItem);
            }
          });
          const newCombinedCache = Array.from(updatedCacheMap.values());
          setItemCache((prev) => ({ ...prev, [mediaType]: newCombinedCache }));

          let potentialNewItems = newItems.filter(
            (item) => !currentSeen.has(item.id)
          );

          if (potentialNewItems.length === 0) {
            // All newly fetched items were already seen (highly unlikely but possible if seen set is large)
            // console.log(`All newly fetched items for ${mediaType} were already seen. Picking from new items anyway and resetting seen for this batch.`);
            setSeenItems((prev) => ({ ...prev, [mediaType]: new Set() })); // Reset seen for this type
            potentialNewItems = newItems; // Use the new items directly
          }

          const randomIndex = Math.floor(
            Math.random() * potentialNewItems.length
          );
          const chosenItem = potentialNewItems[randomIndex];
          setRandomItem(chosenItem);
          setSeenItems((prev) => ({
            ...prev,
            [mediaType]: new Set(prev[mediaType]).add(chosenItem.id),
          }));
        }
      }

      if (isInitialCall) setIsLoadingInitial(false);
      setIsPicking(false);
    },
    [
      mediaType,
      selectedGenre,
      selectedRating,
      selectedYear,
      itemCache,
      seenItems, // zustandWatchlist is not needed here
    ]
  );

  // Initial fetch on mount
  useEffect(() => {
    pickAndSetRandomItem(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array: runs only once on mount

  // Effect for filter changes (mediaType, genre, rating, year)
  useEffect(() => {
    if (isMounted.current) {
      // Only run if component has mounted and it's not the initial call
      // setIsLoadingInitial(true); // Show main loader when filters cause a full re-fetch
      setIsPicking(true); // Or use isPicking
      pickAndSetRandomItem(false); // Pass false, not an initial call
    } else {
      isMounted.current = true; // Set to true after the first render cycle
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, selectedGenre, selectedRating, selectedYear]);

  const handleMediaTypeChange = (newType) => {
    if (mediaType === newType) return;
    setMediaType(newType);
    setSelectedGenre(""); // Reset genre when media type changes
    // setRandomItem(null); // Cleared by pickAndSetRandomItem if it fetches
    // itemCache and seenItems are already per mediaType, so they are implicitly handled.
    // The useEffect for filter changes (which includes mediaType) will trigger pickAndSetRandomItem.
  };

  const isWatchlisted = useMemo(() => {
    if (!randomItem || !zustandWatchlist || !randomItem.media_type)
      return false;
    return zustandWatchlist.some(
      (watchItem) =>
        watchItem.id === randomItem.id &&
        watchItem.type === randomItem.media_type.toUpperCase()
    );
  }, [randomItem, zustandWatchlist]);

  // isLoading state for UI (skeleton display)
  const displayLoadingState = isLoadingInitial || isPicking;

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      {/* Filters Panel */}
      <div
        className={`w-full lg:w-[320px] xl:w-[360px] bg-card lg:h-screen flex flex-col flex-shrink-0 
                    border-b lg:border-b-0 lg:border-r border-border/30`}
      >
        {/* Panel Header (Always Visible) */}
        <div className="p-4 pt-5 sm:p-6 flex justify-between items-center border-b border-border/30 lg:mb-0">
          <h2 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
            <FilterIcon size={22} className="mt-[-2px]" /> Filters
          </h2>
          {isMobile && ( // Only show toggle button on mobile
            <button
              onClick={() => setShowFilterInputs(!showFilterInputs)}
              className="p-1.5 rounded-md hover:bg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
              aria-label={
                showFilterInputs ? "Hide Filter Inputs" : "Show Filter Inputs"
              }
              aria-expanded={showFilterInputs}
            >
              {showFilterInputs ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
          )}
        </div>

        {/* Scrollable Area for Filter Inputs (Collapsible on Mobile) */}
        <div
          className={`flex-grow lg:overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out
                      ${
                        showFilterInputs || !isMobile
                          ? "opacity-100 max-h-[calc(100vh-220px)] sm:max-h-[calc(100vh-240px)] lg:max-h-none p-4 sm:p-6 pt-3 sm:pt-4" // Padding when visible
                          : "opacity-0 max-h-0 overflow-hidden p-0 lg:opacity-100 lg:max-h-none lg:p-4 sm:lg:p-6 lg:pt-3" // No padding on mobile when hidden, but keep for desktop
                      }`}
        >
          {/* Conditional rendering of the inputs themselves, not just styling */}
          {(showFilterInputs || !isMobile) && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
              {/* Media Type Selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Media Type
                </label>
                <div className="flex space-x-2 bg-muted p-1 rounded-lg">
                  <button
                    onClick={() => handleMediaTypeChange("movie")}
                    className={`flex-1 p-2 rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      mediaType === "movie"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-background/70 dark:hover:bg-card"
                    }`}
                  >
                    <Film size={16} /> Movies
                  </button>
                  <button
                    onClick={() => handleMediaTypeChange("tv")}
                    className={`flex-1 p-2 rounded-md text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                      mediaType === "tv"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-background/70 dark:hover:bg-card"
                    }`}
                  >
                    <TvIcon size={16} /> TV Shows
                  </button>
                </div>
              </div>

              {/* Genre Filter */}
              <div className="relative">
                <label
                  htmlFor="genre"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Genre
                </label>
                <select
                  id="genre"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full p-2.5 pl-3 pr-8 border bg-input border-border rounded-md focus:ring-1 focus:ring-primary outline-none text-sm appearance-none"
                >
                  <option value="">
                    Any {mediaType === "tv" ? "TV" : "Movie"} Genre
                  </option>
                  {Object.entries(currentGenreOptions).map(
                    (
                      [key, genreObj] // Use key and genreObj
                    ) => (
                      <option key={genreObj.id} value={String(genreObj.id)}>
                        {genreObj.name}
                      </option>
                    )
                  )}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 mt-[3px] text-muted-foreground pointer-events-none"
                />
              </div>

              {/* Rating Filter */}
              <div className="relative">
                <label
                  htmlFor="rating"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  Min. Rating
                </label>
                <select
                  id="rating"
                  value={selectedRating}
                  onChange={(e) => setSelectedRating(e.target.value)}
                  className="w-full p-2.5 pl-3 pr-8 border bg-input border-border rounded-md focus:ring-1 focus:ring-primary outline-none text-sm appearance-none"
                >
                  {RATING_OPTIONS_RANDOM.map((rate) => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 mt-[3px] text-muted-foreground pointer-events-none"
                />
              </div>

              {/* Year Filter */}
              <div className="relative">
                <label
                  htmlFor="year"
                  className="block text-sm font-medium text-foreground mb-1.5"
                >
                  {mediaType === "tv" ? "First Air Year" : "Release Year"}
                </label>
                <select
                  id="year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full p-2.5 pl-3 pr-8 border bg-input border-border rounded-md focus:ring-1 focus:ring-primary outline-none text-sm appearance-none"
                >
                  {YEAR_OPTIONS_RANDOM.map((yearOpt) => (
                    <option key={yearOpt.value} value={yearOpt.value}>
                      {yearOpt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 mt-[3px] text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pick Button Area (Always visible at the bottom of the filter panel) */}
        <div className="p-4 sm:p-6 pt-2 sm:pt-3 mt-auto">
          {" "}
          {/* mt-auto pushes to bottom if panel has extra space */}
          <button
            onClick={() => pickAndSetRandomItem(false)} // isInitialCall is false here
            disabled={isLoadingInitial || isPicking}
            className="w-full p-3 sm:p-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            aria-label="Get another random pick"
          >
            <Shuffle size={18} className="mr-2" />
            {isPicking
              ? "Picking..."
              : isLoadingInitial && !randomItem // Only on very first load and no item yet
              ? "Loading Suggestion..."
              : `Get Another ${mediaType === "tv" ? "Show" : "Movie"}`}
          </button>
        </div>
      </div>

      {/* Display Area */}
      <div className="w-full lg:flex-grow flex flex-col justify-center items-center p-4 sm:p-6 lg:h-screen">
        {displayLoadingState ? (
          <div className="w-full max-w-[220px] sm:max-w-[250px]">
            <GridCardSkeleton small={false} />
          </div>
        ) : randomItem ? (
          <div className="w-full max-w-[220px] sm:max-w-[250px] transform transition-all duration-300 ease-out animate-fadeInUp">
            {randomItem.media_type === "tv" ? (
              <SeriesCard
                series={randomItem}
                href={`/tv/${randomItem.id}`}
                small={false}
                initialWatchlisted={isWatchlisted}
                isAbove={true}
              />
            ) : (
              <MovieCard
                movie={randomItem}
                href={`/movie/${randomItem.id}`}
                small={false}
                initialWatchlisted={isWatchlisted}
                isAbove={true}
              />
            )}
          </div>
        ) : error ? (
          <div className="text-center p-6 bg-destructive/10 text-destructive rounded-lg max-w-md mx-auto">
            <SearchX size={40} className="mx-auto mb-3 opacity-70" />
            <p className="font-semibold text-base">{error}</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-6">
            <SearchX size={40} className="mx-auto mb-3 opacity-50" />
            <p>Click "Get Another" or adjust filters for a suggestion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
