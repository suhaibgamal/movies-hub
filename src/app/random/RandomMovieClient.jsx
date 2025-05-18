// src/app/random/RandomMovieClient.jsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import MovieCard from "@/app/components/MovieCard";
import SeriesCard from "@/app/components/SeriesCard";
import { useWatchlist as useZustandWatchlist } from "@/app/store/watchlistStore";
import GridCardSkeleton from "@/app/components/GridCardSkeleton"; // Using GridCardSkeleton for a card-like loading state
import {
  Shuffle,
  Film,
  Tv as TvIcon,
  SearchX,
  Filter as FilterIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GENRES as MOVIE_GENRES, TV_GENRES } from "@/lib/constants"; // Use actual constants

// Define Rating options similar to MoviesListClient for consistency
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
    // Last 30 years
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  })),
  { value: "2000s", label: "2000-2009", gte: "2000-01-01", lte: "2009-12-31" },
  { value: "1990s", label: "1990-1999", gte: "1990-01-01", lte: "1999-12-31" },
  { value: "1980s", label: "1980-1979", gte: "1980-01-01", lte: "1989-12-31" },
];

// Actual API fetching logic
const fetchRandomDiscoverItems = async ({
  mediaType,
  genre,
  rating,
  year,
  pageLimit = 20,
}) => {
  // pageLimit here means how many pages to consider for random selection, not items per page from API.
  // TMDB returns 20 items per page by default.
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
        // For ranges like "2000s"
        discoverUrl += `&${dateFilterKey}.gte=${yearOption.gte}&${dateFilterKey}.lte=${yearOption.lte}`;
      } else if (
        !yearOption.gte &&
        !yearOption.lte &&
        yearOption.value !== ""
      ) {
        // For specific year
        discoverUrl += `&${
          mediaType === "tv" ? "first_air_date_year" : "primary_release_year"
        }=${year}`;
      }
    }

    const initialRes = await fetch(discoverUrl + "&page=1");
    if (!initialRes.ok) {
      console.error(
        `Failed to fetch initial page for ${mediaType} discovery:`,
        await initialRes.text()
      );
      throw new Error(`Failed to fetch initial page for ${mediaType}`);
    }
    const initialData = await initialRes.json();
    let totalPages = initialData.total_pages;

    // TMDB limits discover to 500 pages.
    totalPages = Math.min(totalPages, 500);
    if (totalPages === 0) return [];

    const randomPage =
      Math.floor(Math.random() * Math.min(totalPages, pageLimit)) + 1;

    const finalRes = await fetch(`${discoverUrl}&page=${randomPage}`);
    if (!finalRes.ok) {
      console.error(
        `Failed to fetch random page for ${mediaType}:`,
        await finalRes.text()
      );
      throw new Error(`Failed to fetch random page for ${mediaType}`);
    }
    const finalData = await finalRes.json();
    return (finalData.results || []).map((item) => ({
      ...item,
      media_type: typePath, // Ensure media_type is set ('movie' or 'tv')
    }));
  } catch (error) {
    console.error(`Error in fetchRandomDiscoverItems for ${mediaType}:`, error);
    return [];
  }
};

export default function RandomClient() {
  const [randomItem, setRandomItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState(null);

  const [mediaType, setMediaType] = useState("movie");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedRating, setSelectedRating] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [showFilters, setShowFilters] = useState(true);
  const [itemCache, setItemCache] = useState({ movie: [], tv: [] });
  const [seenItems, setSeenItems] = useState({
    movie: new Set(),
    tv: new Set(),
  });

  const zustandWatchlist = useZustandWatchlist();

  const currentGenreOptions = useMemo(
    () => (mediaType === "movie" ? MOVIE_GENRES : TV_GENRES),
    [mediaType]
  );

  const pickAndSetRandomItem = useCallback(async () => {
    setIsPicking(true);
    setError(null);
    setRandomItem(null);

    let cacheForType = itemCache[mediaType];
    let seenForType = seenItems[mediaType];

    let potentialItems = cacheForType.filter(
      (item) => !seenForType.has(item.id)
    );

    if (potentialItems.length === 0) {
      // console.log(`Cache empty or all seen for ${mediaType}, fetching new batch...`);
      const newItems = await fetchRandomDiscoverItems({
        mediaType,
        genre: selectedGenre,
        rating: selectedRating,
        year: selectedYear,
      });
      if (
        newItems.length === 0 &&
        cacheForType.length > 0 &&
        seenForType.size >= cacheForType.length
      ) {
        // All items from cache matching current filters have been seen, reset seen list for this type
        // console.log(`All cached items for ${mediaType} (filters applied) seen. Resetting seen list.`);
        setSeenItems((prev) => ({ ...prev, [mediaType]: new Set() }));
        seenForType = new Set(); // Use the reset set for this pick
        potentialItems = cacheForType.filter(
          (item) => !seenForType.has(item.id)
        ); // Re-filter from cache
      } else if (newItems.length > 0) {
        // Add new items to cache, avoiding duplicates by ID with existing cache
        const updatedCache = [...cacheForType];
        newItems.forEach((newItem) => {
          if (
            !updatedCache.some((cachedItem) => cachedItem.id === newItem.id)
          ) {
            updatedCache.push(newItem);
          }
        });
        setItemCache((prev) => ({ ...prev, [mediaType]: updatedCache }));
        potentialItems = newItems.filter((item) => !seenForType.has(item.id)); // Use fresh items primarily
        if (potentialItems.length === 0 && newItems.length > 0) {
          // All newly fetched items already seen (edge case)
          potentialItems = newItems; // Allow repeat from newly fetched batch if all were seen
          setSeenItems((prev) => ({ ...prev, [mediaType]: new Set() })); // Reset seen for this batch
        }
      }
    }

    if (potentialItems.length > 0) {
      const randomIndex = Math.floor(Math.random() * potentialItems.length);
      const chosenItem = potentialItems[randomIndex];
      setRandomItem(chosenItem);
      setSeenItems((prev) => ({
        ...prev,
        [mediaType]: new Set(prev[mediaType]).add(chosenItem.id),
      }));
    } else {
      setError(
        `No ${
          mediaType === "tv" ? "TV shows" : "movies"
        } found for the selected criteria. Try different filters!`
      );
      setRandomItem(null);
    }

    setIsPicking(false);
    if (isLoading) setIsLoading(false); // Turn off initial loading state
  }, [
    mediaType,
    selectedGenre,
    selectedRating,
    selectedYear,
    itemCache,
    seenItems,
    isLoading,
  ]);

  useEffect(() => {
    setIsLoading(true);
    pickAndSetRandomItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, selectedGenre, selectedRating, selectedYear]); // Re-pick if filters change

  const handleMediaTypeChange = (newType) => {
    setMediaType(newType);
    setSelectedGenre(""); // Reset genre when media type changes
    // No need to reset rating or year as they are generic
    setRandomItem(null); // Clear current item
    // pickAndSetRandomItem will be called by the useEffect above
  };

  // Responsive filter toggle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setShowFilters(true);
      } else {
        // setShowFilters(false); // uncomment if you want filters to hide by default on mobile after resize
      }
    };
    if (typeof window !== "undefined") {
      handleResize(); // Set initial state based on window size
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const isWatchlisted = useMemo(() => {
    if (!randomItem || !zustandWatchlist || !randomItem.media_type)
      return false;
    return zustandWatchlist.some(
      (watchItem) =>
        watchItem.id === randomItem.id &&
        watchItem.type === randomItem.media_type.toUpperCase()
    );
  }, [randomItem, zustandWatchlist]);

  const getGenreName = (genreId) => {
    const source = mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;
    const genre = source.find((g) => String(g.id) === String(genreId));
    return genre ? genre.name : "Unknown Genre";
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      {/* Filters Panel */}
      <div
        className={`w-full lg:w-[320px] xl:w-[360px] p-4 pt-5 sm:p-6 bg-card lg:h-screen lg:overflow-y-auto transition-all duration-300 ease-in-out border-b lg:border-b-0 lg:border-r border-border/30 flex-shrink-0 ${
          showFilters || window.innerWidth >= 1024 // Always show on lg+
            ? "max-h-[80vh] lg:max-h-none opacity-100" // Increased max-h for mobile when shown
            : "max-h-0 opacity-0 overflow-hidden lg:max-h-none lg:opacity-100" // Collapse on mobile when hidden
        }`}
      >
        <div className="flex justify-between items-center mb-5 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-primary flex items-center gap-2">
            <FilterIcon size={22} className="mt-[-2px]" /> Random Picker Filters
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden p-1.5 rounded-md hover:bg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            aria-label={showFilters ? "Hide Filters" : "Show Filters"}
            aria-expanded={showFilters}
          >
            {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {(showFilters ||
          (typeof window !== "undefined" && window.innerWidth >= 1024)) && ( // Conditionally render content
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
                {Object.entries(currentGenreOptions).map(([id, nameOrObj]) => {
                  const name =
                    typeof nameOrObj === "string" ? nameOrObj : nameOrObj.name; // Handle both GENRES and TV_GENRES structure
                  const genreId =
                    typeof nameOrObj === "string" ? id : nameOrObj.id;
                  return (
                    <option key={genreId} value={genreId}>
                      {name}
                    </option>
                  );
                })}
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

            {/* Pick Button */}
            <button
              onClick={pickAndSetRandomItem} // Changed from handleGetRandom for clarity
              disabled={isPicking || isLoading}
              className="w-full p-3 sm:p-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base mt-2"
              aria-label="Get another random pick"
            >
              <Shuffle size={18} className="mr-2" />
              {isPicking
                ? "Picking..."
                : `Get Another ${mediaType === "tv" ? "Show" : "Movie"}`}
            </button>
          </div>
        )}
      </div>

      {/* Display Area */}
      <div className="w-full lg:flex-grow flex flex-col justify-center items-center p-4 sm:p-6 lg:h-screen">
        {" "}
        {/* Added flex-grow */}
        {isLoading ? (
          <div className="w-full max-w-[220px] sm:max-w-[250px]">
            <GridCardSkeleton small={false} />
          </div>
        ) : isPicking ? (
          <div className="w-full max-w-[220px] sm:max-w-[250px]">
            <GridCardSkeleton small={false} />
          </div>
        ) : randomItem ? (
          <div className="w-full max-w-[220px] sm:max-w-[250px] transform transition-all duration-300 ease-out animate-fadeInUp">
            {" "}
            {/* Simple fade in up */}
            {randomItem.media_type === "tv" ? (
              <SeriesCard
                series={randomItem}
                href={`/tv/${randomItem.id}`}
                small={false} // Use larger card for focused display
                initialWatchlisted={isWatchlisted}
                isAbove={true}
              />
            ) : (
              <MovieCard
                movie={randomItem}
                href={`/movie/${randomItem.id}`}
                small={false} // Use larger card for focused display
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
            <p>Click the button to get a random suggestion!</p>
          </div>
        )}
      </div>
    </div>
  );
}
