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

// --- Constants (RATING_OPTIONS_RANDOM, YEAR_OPTIONS_RANDOM) ---
const RATING_OPTIONS_RANDOM = [
  { value: "", label: "Any Rating" },
  { value: "8", label: "8+" },
  { value: "7", label: "7+" },
  { value: "6", label: "6+" },
  { value: "5", label: "5+" },
];
const currentDynamicYear = new Date().getFullYear();
const YEAR_OPTIONS_RANDOM = (() => {
  const options = [{ value: "", label: "Any Year" }];
  for (let year = currentDynamicYear; year >= 2010; year--) {
    options.push({ value: year.toString(), label: year.toString() });
  }
  const decades = [2000, 1990, 1980, 1970];
  decades.forEach((startYear) => {
    const endYear = startYear + 9;
    options.push({
      value: `${startYear}s`,
      label: `${startYear}-${endYear}`,
      gte: `${startYear}-01-01`,
      lte: `${endYear}-12-31`,
    });
  });
  return options;
})();

// API fetching logic
const fetchRandomDiscoverItems = async ({
  mediaType,
  genre,
  rating,
  year,
  pageLimit = 20,
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
        discoverUrl += `&${
          mediaType === "tv" ? "first_air_date_year" : "primary_release_year"
        }=${yearOption.value}`;
      }
    }

    const initialRes = await fetch(discoverUrl + "&page=1");
    if (!initialRes.ok) {
      const errorBody = await initialRes.text();
      throw new Error(
        `Failed to fetch initial discovery data (status ${
          initialRes.status
        }). URL: ${discoverUrl + "&page=1"}. Response: ${errorBody}`
      );
    }
    const initialData = await initialRes.json();
    let totalPages = Math.min(initialData.total_pages, 500);

    if (totalPages === 0) {
      return [];
    }

    const randomPageToFetch =
      Math.floor(Math.random() * Math.min(totalPages, pageLimit)) + 1;

    const finalUrl = `${discoverUrl}&page=${randomPageToFetch}`;

    const finalRes = await fetch(finalUrl);
    if (!finalRes.ok) {
      const errorBody = await finalRes.text();
      throw new Error(
        `Failed to fetch random page data (status ${finalRes.status}). URL: ${finalUrl}. Response: ${errorBody}`
      );
    }
    const finalData = await finalRes.json();
    const results = (finalData.results || []).map((item) => ({
      ...item,
      media_type: typePath,
    }));
    return results;
  } catch (error) {
    console.error(
      `Error in fetchRandomDiscoverItems for ${mediaType}:`,
      error.message
    );
    return [];
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

  const [showFilterInputs, setShowFilterInputs] = useState(true);
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
        const mobileCheck = window.innerWidth < 1024;
        setIsMobile(mobileCheck);
        if (!mobileCheck && !showFilterInputs) {
          setShowFilterInputs(true);
        }
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [showFilterInputs]);

  const pickAndSetRandomItem = useCallback(
    async (isInitialCall = false, forceRefetch = false) => {
      if (isInitialCall) setIsLoadingInitial(true);
      else setIsPicking(true);
      //setError(null); // Clear error later, only if a fetch is initiated or successful

      // Section 1: Try to serve from cache if not forcing a refetch
      if (!forceRefetch && !isInitialCall) {
        const currentCache = itemCache[mediaType]; // From closure (latest due to itemCache in deps)
        const currentSeen = seenItems[mediaType]; // From closure (latest due to seenItems in deps)

        let potentialItemsFromCache = currentCache.filter(
          (item) => !currentSeen.has(item.id)
        );

        if (
          potentialItemsFromCache.length === 0 &&
          currentCache.length > 0 &&
          currentSeen.size >= currentCache.length
        ) {
          // Reset seenItems for this type and re-evaluate potentialItems from the same currentCache
          setSeenItems((prevSeenGlobal) => {
            potentialItemsFromCache = currentCache; // All items in current cache are now potential
            return { ...prevSeenGlobal, [mediaType]: new Set() };
          });
        }

        if (potentialItemsFromCache.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * potentialItemsFromCache.length
          );
          const chosenItem = potentialItemsFromCache[randomIndex];
          setError(null); // Clear any previous error as we successfully picked from cache
          setRandomItem(chosenItem);
          setSeenItems((prevSeenGlobal) => ({
            ...prevSeenGlobal,
            [mediaType]: new Set(prevSeenGlobal[mediaType]).add(chosenItem.id),
          }));
          if (isInitialCall) setIsLoadingInitial(false);
          setIsPicking(false);
          return;
        }

        // If cache is empty or exhausted for current filters, and an error is already set
        // (meaning previous fetch for these exact filters failed), don't try to fetch again.
        if (error && !forceRefetch) {
          setIsPicking(false);
          // setIsLoadingInitial(false); // Not an initial call path
          return;
        }
      }

      // Section 2: Fetch new items
      setError(null); // Clear any previous error before attempting a new fetch
      if (!isInitialCall || forceRefetch) {
        // Clear item if it's a new fetch path (not initial, or forced)
        setRandomItem(null);
      }
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
          } found for the selected criteria. Please try different filters.`
        );
        if (forceRefetch) {
          // If this was a filter change that yielded no results
          setItemCache((prevCacheGlobal) => ({
            ...prevCacheGlobal,
            [mediaType]: [],
          }));
        }
      } else {
        if (forceRefetch) {
          setItemCache((prevCacheGlobal) => ({
            ...prevCacheGlobal,
            [mediaType]: [...newItems],
          }));
          // Seen items for this mediaType were already reset by the filter change `useEffect`.
        } else {
          setItemCache((prevCacheGlobal) => {
            const existingItemsForType = prevCacheGlobal[mediaType] || [];
            const combinedItems = Array.from(
              new Map([
                ...existingItemsForType.map((item) => [item.id, item]),
                ...newItems.map((item) => [item.id, item]),
              ]).values()
            );
            return { ...prevCacheGlobal, [mediaType]: combinedItems };
          });
        }

        // Pick from newItems.
        // `seenItems` state is a dependency, so `currentSeenForPickingNew` will be the latest.
        let currentSeenForPickingNew = seenItems[mediaType];
        let potentialNewItems = newItems.filter(
          (item) => !currentSeenForPickingNew.has(item.id)
        );

        if (potentialNewItems.length === 0 && newItems.length > 0) {
          setSeenItems((prevSeenGlobal) => {
            potentialNewItems = newItems;
            return { ...prevSeenGlobal, [mediaType]: new Set() };
          });
        }

        if (potentialNewItems.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * potentialNewItems.length
          );
          const chosenItem = potentialNewItems[randomIndex];
          setRandomItem(chosenItem);
          setSeenItems((prevSeenGlobal) => ({
            ...prevSeenGlobal,
            [mediaType]: new Set(prevSeenGlobal[mediaType]).add(chosenItem.id),
          }));
        } else {
          setError(
            `No new ${
              mediaType === "tv" ? "TV shows" : "movies"
            } could be picked after filtering. Try again or adjust filters.`
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
      itemCache, // Now a dependency
      seenItems, // Now a dependency
      error, // Add error as a dependency for the check before re-fetching
    ]
  );

  useEffect(() => {
    // Initial fetch. pickAndSetRandomItem will have initial state values in its closure.
    pickAndSetRandomItem(true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount. Dependencies for pickAndSetRandomItem handled by useCallback.

  useEffect(() => {
    if (isMounted.current) {
      setItemCache((prevCache) => ({ ...prevCache, [mediaType]: [] }));
      setSeenItems((prevSeen) => ({ ...prevSeen, [mediaType]: new Set() }));

      setIsPicking(true);
      // pickAndSetRandomItem will be a new function here because its filter dependencies changed (and possibly itemCache/seenItems from clearing).
      pickAndSetRandomItem(false, true);
    } else {
      isMounted.current = true;
    }
    // pickAndSetRandomItem itself is not a dependency here, to prevent this effect
    // from running just because itemCache/seenItems changed from within pickAndSetRandomItem.
    // The primary trigger should be the user changing filter selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, selectedGenre, selectedRating, selectedYear]);

  const handleMediaTypeChange = (newType) => {
    if (mediaType === newType) return;
    setMediaType(newType);
    setSelectedGenre("");
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
            onClick={() => pickAndSetRandomItem(false, false)}
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
      <div className="w-full lg:flex-grow flex flex-col items-center p-4 sm:p-6 lg:h-screen">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary text-center mb-6 sm:mb-8 lg:mb-10">
          Random Movie and TV Show Picker
        </h1>

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
          <div
            className="text-center p-6 bg-destructive/10 text-destructive rounded-lg max-w-md mx-auto"
            role="alert"
          >
            <SearchX size={40} className="mx-auto mb-3 opacity-70" />
            <p className="font-semibold text-base">{error}</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground p-6">
            <SearchX size={40} className="mx-auto mb-3 opacity-50" />
            <p>Use the filters and click the button for a suggestion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
