// src/app/random/RandomMovieClient.jsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
import {
  GENRES as MOVIE_GENRES_OBJ,
  TV_GENRES as TV_GENRES_OBJ,
} from "@/lib/constants";

// Define Rating options
const RATING_OPTIONS_RANDOM = [
  { value: "", label: "Any Rating" },
  { value: "8", label: "8+" },
  { value: "7", label: "7+" },
  { value: "6", label: "6+" },
  { value: "5", label: "5+" },
];

// Generate Year options
const currentDynamicYear = new Date().getFullYear();
const YEAR_OPTIONS_RANDOM = (() => {
  const options = [{ value: "", label: "Any Year" }];
  for (let year = currentDynamicYear; year >= 2010; year--) {
    options.push({ value: year.toString(), label: year.toString() });
  }
  options.push(
    {
      value: "2000s",
      label: "2000-2009",
      gte: "2000-01-01",
      lte: "2009-12-31",
    },
    {
      value: "1990s",
      label: "1990-1999",
      gte: "1990-01-01",
      lte: "1999-12-31",
    },
    {
      value: "1980s",
      label: "1980-1989",
      gte: "1980-01-01",
      lte: "1989-12-31",
    },
    { value: "1970s", label: "1970-1979", gte: "1970-01-01", lte: "1979-12-31" }
  );
  return options;
})();

// API fetching logic (ensure NEXT_PUBLIC_TMDB_KEY is set in .env)
const fetchRandomDiscoverItems = async ({
  mediaType,
  genre,
  rating,
  year,
  pageLimit = 20, // Consider making pageLimit higher for more randomness, up to 500
}) => {
  try {
    const typePath = mediaType === "tv" ? "tv" : "movie";
    const dateFilterKey =
      mediaType === "tv" ? "first_air_date" : "primary_release_date";
    const apiKey = process.env.NEXT_PUBLIC_TMDB_KEY;

    if (!apiKey) {
      console.error(
        "TMDB API key is missing. Please set NEXT_PUBLIC_TMDB_KEY."
      );
      throw new Error("TMDB API key is not configured.");
    }

    let discoverUrl = `https://api.themoviedb.org/3/discover/${typePath}?api_key=${apiKey}&language=en-US&sort_by=popularity.desc&vote_count.gte=100&include_adult=false`;
    if (genre) discoverUrl += `&with_genres=${genre}`;
    if (rating) discoverUrl += `&vote_average.gte=${rating}`;

    const yearOption = YEAR_OPTIONS_RANDOM.find((y) => y.value === year);
    if (yearOption) {
      if (yearOption.gte && yearOption.lte) {
        discoverUrl += `&${dateFilterKey}.gte=${yearOption.gte}&${dateFilterKey}.lte=${yearOption.lte}`;
      } else if (yearOption.value !== "") {
        // Specific year
        discoverUrl += `&${
          mediaType === "tv" ? "first_air_date_year" : "primary_release_year"
        }=${yearOption.value}`;
      }
    }

    // First, fetch page 1 to get total_pages
    const initialRes = await fetch(discoverUrl + "&page=1");
    if (!initialRes.ok)
      throw new Error(
        `Failed to fetch initial discovery data (status ${
          initialRes.status
        }) for URL: ${discoverUrl + "&page=1"}`
      );
    const initialData = await initialRes.json();
    let totalPages = Math.min(initialData.total_pages, 500); // TMDB caps at 500 pages for discover

    if (totalPages === 0) return []; // No results found

    // Pick a random page up to the determined totalPages or the specified pageLimit
    const randomPageToFetch =
      Math.floor(Math.random() * Math.min(totalPages, pageLimit)) + 1;

    const finalRes = await fetch(`${discoverUrl}&page=${randomPageToFetch}`);
    if (!finalRes.ok)
      throw new Error(
        `Failed to fetch random page data (status ${finalRes.status}) for URL: ${discoverUrl}&page=${randomPageToFetch}`
      );
    const finalData = await finalRes.json();
    return (finalData.results || []).map((item) => ({
      ...item,
      media_type: typePath, // Ensure media_type is set for consistency
    }));
  } catch (error) {
    console.error(
      `Error in fetchRandomDiscoverItems for ${mediaType}:`,
      error.message
    );
    return []; // Return empty array on error
  }
};

export default function RandomClient() {
  const [randomItem, setRandomItem] = useState(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState(null);

  const [mediaType, setMediaType] = useState("movie");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [showFilterInputs, setShowFilterInputs] = useState(true); // Default to true
  const [isMobile, setIsMobile] = useState(false);

  const [itemCache, setItemCache] = useState({ movie: [], tv: [] });
  const [seenItems, setSeenItems] = useState({
    movie: new Set(),
    tv: new Set(),
  });

  const zustandWatchlist = useZustandWatchlist();
  const isMounted = useRef(false);

  const currentGenreObject = useMemo(
    () => (mediaType === "movie" ? MOVIE_GENRES_OBJ : TV_GENRES_OBJ),
    [mediaType]
  );

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        const mobileCheck = window.innerWidth < 1024; // lg breakpoint
        setIsMobile(mobileCheck);
        // If not mobile and filters were hidden (e.g. by resize), show them.
        if (!mobileCheck && !showFilterInputs) {
          setShowFilterInputs(true);
        }
      }
    };
    checkMobile(); // Initial check
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [showFilterInputs]); // Re-run if showFilterInputs changes, to handle edge cases.

  const pickAndSetRandomItem = useCallback(
    async (isInitialCall = false, forceRefetch = false) => {
      if (isInitialCall) setIsLoadingInitial(true);
      else setIsPicking(true);
      setError(null);

      if (!forceRefetch && !isInitialCall) {
        const currentMediaTypeCache = itemCache[mediaType];
        const currentMediaTypeSeen = seenItems[mediaType];
        let potentialItemsFromCache = currentMediaTypeCache.filter(
          (item) => !currentMediaTypeSeen.has(item.id)
        );

        if (
          potentialItemsFromCache.length === 0 &&
          currentMediaTypeCache.length > 0 &&
          currentMediaTypeSeen.size >= currentMediaTypeCache.length
        ) {
          // All items in cache have been seen, reset seen for this type
          const newSeenSet = new Set();
          setSeenItems((prev) => ({ ...prev, [mediaType]: newSeenSet }));
          potentialItemsFromCache = currentMediaTypeCache.filter(
            (item) => !newSeenSet.has(item.id) // Re-filter with the new empty seen set
          );
        }

        if (potentialItemsFromCache.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * potentialItemsFromCache.length
          );
          const chosenItem = potentialItemsFromCache[randomIndex];
          setRandomItem(chosenItem);
          setSeenItems((prev) => ({
            ...prev,
            [mediaType]: new Set(prev[mediaType]).add(chosenItem.id),
          }));
          if (isInitialCall) setIsLoadingInitial(false);
          setIsPicking(false);
          return;
        }
      }

      // If not served from cache or if forceRefetch is true:
      if (!isInitialCall || forceRefetch) {
        setRandomItem(null); // Clear previous item before fetching new one if not served from cache
      }

      const newItems = await fetchRandomDiscoverItems({
        mediaType, // from closure (guaranteed up-to-date by useCallback deps)
        genre: selectedGenre,
        rating: selectedRating,
        year: selectedYear,
      });

      if (newItems.length === 0) {
        setError(
          `No ${
            mediaType === "tv" ? "TV shows" : "movies"
          } found for the selected criteria. Please try different filters.`
        );
      } else {
        // Update cache: If filters changed, existingCacheForType was cleared.
        // This will populate the cache with newly fetched items.
        setItemCache((prev) => {
          const existingCacheForType = prev[mediaType] || [];
          const newCombinedCache = Array.from(
            new Map([
              ...existingCacheForType.map((item) => [item.id, item]),
              ...newItems.map((item) => [item.id, item]),
            ]).values()
          );
          return { ...prev, [mediaType]: newCombinedCache };
        });

        // Pick from the newly fetched items, considering items already seen *within this new context*
        let currentSeenForPick = seenItems[mediaType]; // This set was potentially just cleared if filters changed
        let potentialNewItems = newItems.filter(
          (item) => !currentSeenForPick.has(item.id)
        );

        if (potentialNewItems.length === 0 && newItems.length > 0) {
          // This case means all 'newItems' were in 'currentSeenForPick'.
          // If 'currentSeenForPick' was just cleared because filters changed, this is unlikely unless newItems is small and duplicates a previous small fetch.
          // Or, if 'Get Another' was clicked, and the new fetch happened to return only already seen items from this same filter batch.
          // Resetting seenItems for this specific batch of newItems to ensure a pick.
          const newSeenSetForThisBatch = new Set();
          setSeenItems((prev) => ({
            ...prev,
            [mediaType]: newSeenSetForThisBatch,
          }));
          potentialNewItems = newItems; // Use all new items as potential picks
        }

        if (potentialNewItems.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * potentialNewItems.length
          );
          const chosenItem = potentialNewItems[randomIndex];
          setRandomItem(chosenItem);
          setSeenItems((prev) => ({
            // Add the chosen item to the (potentially just reset) seen set
            ...prev,
            [mediaType]: new Set(prev[mediaType]).add(chosenItem.id),
          }));
        } else {
          // This means newItems was empty, or all newItems were already seen and couldn't be reset.
          setError(
            `No new ${
              mediaType === "tv" ? "TV shows" : "movies"
            } could be picked. Try adjusting filters.`
          );
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
      // itemCache, seenItems are intentionally NOT dependencies here.
      // Their state is managed such that the closure values are appropriate
      // or they are reset before this callback uses them in critical paths.
      // State setters (setIsLoadingInitial, setError, etc.) are stable.
    ]
  );

  // Initial fetch on mount
  useEffect(() => {
    // pickAndSetRandomItem will have the initial filter values in its closure.
    pickAndSetRandomItem(true, true); // isInitialCall=true, forceRefetch=true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount.

  // Effect for filter changes
  useEffect(() => {
    if (isMounted.current) {
      // Only run on updates, not initial mount
      // Filters have changed. Clear cache and seen items for the current mediaType
      // to ensure the new fetch operates on a clean slate.
      setItemCache((prevCache) => ({ ...prevCache, [mediaType]: [] }));
      setSeenItems((prevSeen) => ({ ...prevSeen, [mediaType]: new Set() }));

      setIsPicking(true);
      // `pickAndSetRandomItem` is recreated when its dependencies (filters) change,
      // so it will have the latest filter values. `forceRefetch=true` makes it fetch.
      pickAndSetRandomItem(false, true); // isInitialCall=false, forceRefetch=true
    } else {
      isMounted.current = true; // Set to true after initial mount.
    }
    // pickAndSetRandomItem is not needed as a dependency because this effect's role
    // is to react to filter changes and then *call* the latest version of pickAndSetRandomItem.
    // The eslint-disable comment is acceptable here given this specific pattern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, selectedGenre, selectedRating, selectedYear]);

  const handleMediaTypeChange = (newType) => {
    if (mediaType === newType) return;
    setMediaType(newType);
    setSelectedGenre(""); // Reset genre as it's type-specific
    // Rating and Year can often be kept as they are more generic,
    // but if they should also reset, add them here.
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

  const displayLoadingState = isLoadingInitial || isPicking;

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:flex-row overflow-x-hidden">
      {/* Filters Panel */}
      <div
        className={`w-full lg:w-[320px] xl:w-[360px] bg-card lg:h-screen flex flex-col flex-shrink-0 
                    border-b lg:border-b-0 lg:border-r border-border/30`}
      >
        {/* Panel Header */}
        <div className="p-4 pt-5 sm:p-6 flex justify-between items-center border-b border-border/30 shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
            <FilterIcon size={22} className="mt-[-2px]" /> Filters
          </h2>
          {isMobile && (
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

        {/* Scrollable Area for Filter Inputs */}
        <div
          className={`lg:overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out
                      ${
                        showFilterInputs || !isMobile
                          ? "opacity-100 p-4 sm:p-6 pt-3 sm:pt-4"
                          : "opacity-0 max-h-0 overflow-hidden p-0 lg:opacity-100 lg:max-h-auto lg:p-4 sm:lg:p-6 lg:pt-3"
                      }`}
        >
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
                    aria-pressed={mediaType === "movie"}
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
                    aria-pressed={mediaType === "tv"}
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
                  name="genre"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full p-2.5 pl-3 pr-8 border bg-input border-border rounded-md focus:ring-1 focus:ring-primary outline-none text-sm appearance-none"
                >
                  <option value="">
                    Any {mediaType === "tv" ? "TV" : "Movie"} Genre
                  </option>
                  {Object.entries(currentGenreObject).map(
                    ([genreId, genreName]) => (
                      <option key={genreId} value={String(genreId)}>
                        {genreName}
                      </option>
                    )
                  )}
                </select>
                <ChevronDown
                  size={18}
                  className="absolute right-3 top-1/2 mt-[3px] text-muted-foreground pointer-events-none"
                  aria-hidden="true"
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
                  name="rating"
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
                  aria-hidden="true"
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
                  name="year"
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
                  aria-hidden="true"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pick Button Area */}
        <div className="p-4 sm:p-6 pt-3 sm:pt-4 shrink-0 mt-auto lg:mt-6 lg:mb-4">
          <button
            onClick={() => pickAndSetRandomItem(false, false)} // isInitialCall=false, forceRefetch=false
            disabled={isLoadingInitial || isPicking}
            className="w-full p-3 sm:p-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            aria-label="Get another random pick"
          >
            <Shuffle size={18} className="mr-2" />
            {isPicking && !isLoadingInitial
              ? "Picking..."
              : isLoadingInitial
              ? "Loading Suggestion..."
              : `Get Another ${mediaType === "tv" ? "Show" : "Movie"}`}
          </button>
        </div>
      </div>

      {/* Display Area */}
      <div className="w-full lg:flex-grow flex flex-col justify-center items-center p-4 sm:p-6 lg:h-screen">
        {displayLoadingState ? (
          <div
            className="w-full max-w-[220px] sm:max-w-[250px]"
            aria-live="polite"
            aria-busy="true"
          >
            <GridCardSkeleton small={false} />
          </div>
        ) : randomItem ? (
          <div
            className="w-full max-w-[220px] sm:max-w-[250px] transform transition-all duration-300 ease-out animate-fadeInUp"
            aria-live="polite"
          >
            {randomItem.media_type === "tv" ? (
              <SeriesCard
                series={randomItem}
                href={`/tv/${randomItem.id}`}
                small={false}
                initialWatchlisted={isWatchlisted}
                isAbove={true} // Assuming this prop is for z-index or similar above other elements
              />
            ) : (
              <MovieCard
                movie={randomItem}
                href={`/movie/${randomItem.id}`}
                small={false}
                initialWatchlisted={isWatchlisted}
                isAbove={true} // Assuming this prop is for z-index or similar
              />
            )}
          </div>
        ) : error ? (
          <div
            className="text-center p-6 bg-destructive/10 text-destructive rounded-lg max-w-md mx-auto"
            role="alert"
          >
            <SearchX size={40} className="mx-auto mb-3 opacity-70" />
            <p className="font-semibold text-base">{error}</p>
          </div>
        ) : (
          // Fallback for when there's no item and no error (e.g., initial state before first pick if not auto-picking)
          // Or if a pick somehow resulted in no item and no error.
          <div className="text-center text-muted-foreground p-6">
            <SearchX size={40} className="mx-auto mb-3 opacity-50" />
            <p>Use the filters and click the button for a suggestion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
