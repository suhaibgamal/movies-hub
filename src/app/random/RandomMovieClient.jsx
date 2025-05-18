"use client";

import { useState, useEffect, useCallback } from "react";
import MovieCard from "@/app/components/MovieCard";
import SeriesCard from "@/app/components/SeriesCard";
import { useWatchlist as useZustandWatchlist } from "@/app/store/watchlistStore";
import SkeletonLoader from "@/app/components/SkeletonLoader"; // Generic skeleton for initial load
import GridCardSkeleton from "@/app/components/GridCardSkeleton"; // Card-specific skeleton
import {
  Shuffle,
  Film,
  TvIcon,
  SearchX,
  Filter as FilterIcon, // Renamed to avoid conflict with array.filter
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Assume these are imported from a constants file, e.g., '@/lib/constants'
// Simplified for brevity
const MOVIE_GENRES = [
  { id: "28", name: "Action" },
  { id: "12", name: "Adventure" },
  { id: "35", name: "Comedy" },
  { id: "18", name: "Drama" },
  { id: "14", name: "Fantasy" },
  { id: "27", name: "Horror" },
  { id: "878", name: "Science Fiction" },
  { id: "53", name: "Thriller" },
  // Add more movie genres as needed
];
const TV_GENRES = [
  { id: "10759", name: "Action & Adventure" },
  { id: "16", name: "Animation" },
  { id: "35", name: "Comedy" },
  { id: "80", name: "Crime" },
  { id: "18", name: "Drama" },
  { id: "10765", name: "Sci-Fi & Fantasy" },
  // Add more TV genres as needed
];
const RATINGS = [
  { id: "9", name: "9+" },
  { id: "8", name: "8+" },
  { id: "7", name: "7+" },
  { id: "6", name: "6+" },
  { id: "5", name: "5+" },
];
// Generate years dynamically or have a predefined list
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 50 }, (_, i) => ({
  id: (currentYear - i).toString(),
  name: (currentYear - i).toString(),
}));

// Mock fetchRandomItem function - replace with actual API call logic
// This function would typically interact with your backend or TMDB API directly
// and respect all the filters.
const fetchRandomItemAPI = async ({ mediaType, genre, rating, year }) => {
  console.log("Fetching random item with filters:", {
    mediaType,
    genre,
    rating,
    year,
  });
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Simulate API response
  const isMovie = mediaType === "movie";
  const items = [
    {
      id: 1,
      title: isMovie ? "Awesome Random Movie" : undefined,
      name: !isMovie ? "Amazing Random Series" : undefined,
      poster_path: "/qA5kPYZA7wCIX7Cs1g4BGEtGfz.jpg", // Example poster
      vote_average: 8.5,
      release_date: isMovie ? "2023-05-15" : undefined,
      first_air_date: !isMovie ? "2022-10-20" : undefined,
      overview:
        "A thrilling adventure that will keep you on the edge of your seat. Discover secrets, face dangers, and emerge victorious.",
      media_type: mediaType,
      genre_ids: genre ? [parseInt(genre)] : isMovie ? [28] : [10759], // Example genre
    },
    {
      id: 2,
      title: isMovie ? "Another Great Movie Pick" : undefined,
      name: !isMovie ? "Must-Watch TV Show" : undefined,
      poster_path: "/uS1AIL7I1Ycgs8tWRQvKy1H0Bq2.jpg", // Example poster
      vote_average: parseFloat(rating || "7.8"),
      release_date: isMovie ? `${year || "2021"}-07-21` : undefined,
      first_air_date: !isMovie ? `${year || "2020"}-03-10` : undefined,
      overview:
        "An epic tale of heroes and villains, with stunning visuals and a captivating story. Perfect for a movie night.",
      media_type: mediaType,
      genre_ids: genre ? [parseInt(genre)] : isMovie ? [12] : [10765],
    },
  ];
  // Simulate finding an item or not
  if (Math.random() > 0.2) {
    // 80% chance of finding an item
    return items[Math.floor(Math.random() * items.length)];
  }
  return null; // Simulate no item found
};

export default function RandomMovieClient() {
  const [randomItem, setRandomItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // For initial page load
  const [isPicking, setIsPicking] = useState(false); // When "pick" button is clicked
  const [error, setError] = useState(null);

  const [mediaType, setMediaType] = useState("movie"); // 'movie' or 'tv'
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedRating, setSelectedRating] = useState(""); // e.g., "7" for 7+
  const [selectedYear, setSelectedYear] = useState("");

  const [showFilters, setShowFilters] = useState(true); // Filters visible by default on larger screens

  const { watchlist: zustandWatchlist, addOrRemoveFromWatchlist } =
    useZustandWatchlist();

  const currentGenres = mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;

  const fetchAndSetRandomItem = useCallback(async () => {
    setIsPicking(true);
    setError(null);
    setRandomItem(null); // Clear previous item immediately
    try {
      const item = await fetchRandomItemAPI({
        mediaType,
        genre: selectedGenre,
        rating: selectedRating,
        year: selectedYear,
      });
      setRandomItem(item);
    } catch (err) {
      console.error("Failed to fetch random item:", err);
      setError("Could not fetch a random item. Please try again.");
      setRandomItem(null);
    } finally {
      setIsPicking(false);
      setIsLoading(false); // Ensure initial loading is also turned off
    }
  }, [mediaType, selectedGenre, selectedRating, selectedYear]);

  useEffect(() => {
    // Fetch an initial random item when the component mounts or core filters change
    setIsLoading(true); // Use isLoading for the very first load
    fetchAndSetRandomItem();
  }, []); // Fetch only on mount initially. Subsequent fetches via button.

  const handlePickRandom = () => {
    fetchAndSetRandomItem();
  };

  const isWatchlisted = randomItem
    ? zustandWatchlist.some(
        (watchlistItem) =>
          watchlistItem.id === randomItem.id &&
          watchlistItem.media_type === randomItem.media_type
      )
    : false;

  // Toggle filter visibility on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // lg breakpoint
        setShowFilters(true);
      } else {
        // setShowFilters(false); // Or keep current state on resize for mobile
      }
    };
    handleResize(); // Set initial state
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:flex-row overflow-hidden">
      {/* Filters Panel */}
      <div
        className={`w-full lg:w-1/3 xl:w-1/4 p-4 lg:p-6 bg-card lg:h-screen lg:overflow-y-auto transition-all duration-300 ease-in-out ${
          showFilters
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 lg:max-h-screen lg:opacity-100 overflow-hidden"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary">Random Picker</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            aria-label={showFilters ? "Hide Filters" : "Show Filters"}
          >
            {showFilters ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
        </div>

        <div className="space-y-6">
          {/* Media Type Selector */}
          <div>
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="mediaType"
            >
              Media Type
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setMediaType("movie");
                  setSelectedGenre("");
                }}
                className={`flex-1 p-3 rounded-md text-sm font-semibold transition-colors ${
                  mediaType === "movie"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Film size={18} className="inline mr-2" /> Movies
              </button>
              <button
                onClick={() => {
                  setMediaType("tv");
                  setSelectedGenre("");
                }}
                className={`flex-1 p-3 rounded-md text-sm font-semibold transition-colors ${
                  mediaType === "tv"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <TvIcon size={18} className="inline mr-2" /> TV Shows
              </button>
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <label
              htmlFor="genre"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Genre
            </label>
            <select
              id="genre"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="w-full p-3 border bg-input border-border rounded-md focus:ring-2 focus:ring-primary outline-none text-sm"
            >
              <option value="">Any Genre</option>
              {currentGenres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <label
              htmlFor="rating"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Minimum Rating
            </label>
            <select
              id="rating"
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="w-full p-3 border bg-input border-border rounded-md focus:ring-2 focus:ring-primary outline-none text-sm"
            >
              <option value="">Any Rating</option>
              {RATINGS.map((rate) => (
                <option key={rate.id} value={rate.id}>
                  {rate.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label
              htmlFor="year"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Release/Air Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-3 border bg-input border-border rounded-md focus:ring-2 focus:ring-primary outline-none text-sm"
            >
              <option value="">Any Year</option>
              {YEARS.map((year) => (
                <option key={year.id} value={year.id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>

          {/* Pick Button */}
          <button
            onClick={handlePickRandom}
            disabled={isPicking || isLoading}
            className="w-full p-4 bg-primary text-primary-foreground rounded-md font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-base"
            aria-label="Get Random Pick"
          >
            <Shuffle size={20} className="mr-2" />
            {isPicking ? "Picking..." : "Pick Random"}
          </button>
        </div>
      </div>

      {/* Display Area */}
      <div className="w-full lg:w-2/3 xl:w-3/4 flex justify-center items-center p-4 lg:h-screen mt-6 lg:mt-0">
        {isLoading ? ( // Initial page load skeleton
          <div className="w-48 sm:w-56 lg:w-64">
            <SkeletonLoader /> {/* Generic loader */}
          </div>
        ) : isPicking ? ( // Skeleton while picking a new item after button press
          <div className="w-48 sm:w-56 lg:w-64">
            <GridCardSkeleton small={true} /> {/* Card-like skeleton */}
          </div>
        ) : randomItem ? (
          <div className="w-48 sm:w-56 lg:w-64 transform transition-all duration-500 ease-out scale-100 animate-fadeIn">
            {randomItem.media_type === "tv" ? (
              <SeriesCard
                series={randomItem}
                small={true}
                initialWatchlisted={isWatchlisted}
                isAbove={true} // Treat as high priority since it's the focus
              />
            ) : (
              <MovieCard
                movie={randomItem}
                href={`/${randomItem.media_type}/${randomItem.id}`}
                small={true}
                initialWatchlisted={isWatchlisted}
                isAbove={true}
              />
            )}
          </div>
        ) : error ? (
          <div className="text-center text-destructive">
            <SearchX size={48} className="mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <SearchX size={48} className="mx-auto mb-2" />
            <p>No item found matching your criteria.</p>
            <p>Try adjusting filters or picking again!</p>
          </div>
        )}
      </div>
    </div>
  );
}
