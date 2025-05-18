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
// Assuming GENRES is aliased as MOVIE_GENRES upon import if GENRES is for movies.
// If your import is `import { GENRES, TV_GENRES } from "@/lib/constants";`
// you'd use `mediaType === "movie" ? GENRES : TV_GENRES`
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

// Generate Year options (Current year is 2025 based on context)
const currentDynamicYear = new Date().getFullYear();
const YEAR_OPTIONS_RANDOM = (() => {
  const options = [{ value: "", label: "Any Year" }];

  // Individual years from current year down to 2010
  for (let year = currentDynamicYear; year >= 2010; year--) {
    options.push({
      value: year.toString(),
      label: year.toString(),
    });
  }

  // Decades
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

    // Ensure NEXT_PUBLIC_TMDB_KEY is available
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
      console.error(
        `TMDB API Error (Initial Page): ${initialRes.status} - ${typePath}`,
        { url: discoverUrl + "&page=1", errorBody }
      );
      throw new Error(
        `Failed to fetch initial discovery data (status ${initialRes.status})`
      );
    }
    const initialData = await initialRes.json();
    let totalPages = initialData.total_pages;

    totalPages = Math.min(totalPages, 500);
    if (totalPages === 0) return [];

    const randomPageToFetch =
      Math.floor(Math.random() * Math.min(totalPages, pageLimit)) + 1;

    const finalRes = await fetch(`${discoverUrl}&page=${randomPageToFetch}`);
    if (!finalRes.ok) {
      const errorBody = await finalRes.text();
      console.error(
        `TMDB API Error (Random Page): ${finalRes.status} - ${typePath}`,
        { url: `${discoverUrl}&page=${randomPageToFetch}`, errorBody }
      );
      throw new Error(
        `Failed to fetch random page data (status ${finalRes.status})`
      );
    }
    const finalData = await finalRes.json();
    return (finalData.results || []).map((item) => ({
      ...item,
      media_type: typePath,
    }));
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
      if (isInitialCall) {
        setIsLoadingInitial(true);
      } else {
        setIsPicking(true);
      }
      setError(null);

      if (!forceRefetch && !isInitialCall) {
        let currentCache = itemCache[mediaType];
        let currentSeen = seenItems[mediaType];
        let potentialItemsFromCache = currentCache.filter(
          (item) => !currentSeen.has(item.id)
        );

        if (
          potentialItemsFromCache.length === 0 &&
          currentCache.length > 0 &&
          currentSeen.size >= currentCache.length
        ) {
          const newSeenSet = new Set();
          setSeenItems((prev) => ({ ...prev, [mediaType]: newSeenSet }));
          currentSeen = newSeenSet;
          potentialItemsFromCache = currentCache.filter(
            (item) => !currentSeen.has(item.id)
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

      setRandomItem(null);
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
      } else {
        const newCombinedCache = Array.from(
          new Map([
            ...itemCache[mediaType].map((item) => [item.id, item]),
            ...newItems.map((item) => [item.id, item]),
          ]).values()
        );
        setItemCache((prev) => ({ ...prev, [mediaType]: newCombinedCache }));

        let currentSeenForPick = seenItems[mediaType];
        let potentialNewItems = newItems.filter(
          (item) => !currentSeenForPick.has(item.id)
        );

        if (potentialNewItems.length === 0 && newItems.length > 0) {
          const newSeenSetForBatch = new Set();
          setSeenItems((prev) => ({
            ...prev,
            [mediaType]: newSeenSetForBatch,
          }));
          potentialNewItems = newItems;
        }

        if (potentialNewItems.length > 0) {
          // Ensure there's something to pick
          const randomIndex = Math.floor(
            Math.random() * potentialNewItems.length
          );
          const chosenItem = potentialNewItems[randomIndex];
          setRandomItem(chosenItem);
          setSeenItems((prev) => ({
            ...prev,
            [mediaType]: new Set(prev[mediaType]).add(chosenItem.id),
          }));
        } else {
          // Fallback if even after reset, no items (e.g. newItems was empty initially after all)
          setError(
            `No ${
              mediaType === "tv" ? "TV shows" : "movies"
            } found after attempting to fetch new items. Please adjust filters.`
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
      itemCache,
      seenItems,
    ]
  );

  useEffect(() => {
    pickAndSetRandomItem(true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickAndSetRandomItem]);

  useEffect(() => {
    if (isMounted.current) {
      setIsPicking(true);
      pickAndSetRandomItem(false, true);
    } else {
      isMounted.current = true;
    }
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
      <div
        className={`w-full lg:w-[320px] xl:w-[360px] bg-card lg:h-screen flex flex-col flex-shrink-0 
                    border-b lg:border-b-0 lg:border-r border-border/30`}
      >
        <div className="p-4 pt-5 sm:p-6 flex justify-between items-center border-b border-border/30 lg:mb-0 shrink-0">
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

        <div
          className={`flex-grow lg:overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out
                      ${
                        showFilterInputs || !isMobile
                          ? "opacity-100 p-4 sm:p-6 pt-3 sm:pt-4"
                          : "opacity-0 max-h-0 overflow-hidden p-0 lg:opacity-100 lg:max-h-none lg:p-4 sm:lg:p-6 lg:pt-3"
                      }`}
        >
          {(showFilterInputs || !isMobile) && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
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

        <div className="p-4 sm:p-6 pt-3 sm:pt-4 mt-auto lg:mt-6 lg:mb-4 shrink-0">
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
            <p>Use the filters and click "Get Another" for a suggestion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
