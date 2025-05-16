"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import { useSeriesListContext } from "@/app/context/SeriesListContext"; // Potential new context
import MoviesGrid from "@/app/components/MoviesGrid"; // This will render SeriesCard via props
import SeriesCard from "@/app/components/SeriesCard"; // Direct import for clarity, though MoviesGrid will use it
import { TV_GENRES } from "@/lib/constants"; // Centralized genres
import { SearchX } from "lucide-react";

// Rating options - can be shared or made TV-specific if needed
const RATING_OPTIONS = {
  All: { min: 0, max: 10 },
  Good: { min: 7, max: 10 },
  Ok: { min: 5, max: 7 },
  Bad: { min: 0, max: 5 },
};

// Year groups for filtering - adapt for first_air_date if necessary
const YEAR_GROUPS = [
  { value: "All", label: "All Years" },
  {
    value: "2020-2024",
    label: "2020-2024",
    from: "2020-01-01",
    to: "2024-12-31",
  },
  {
    value: "2010-2019",
    label: "2010-2019",
    from: "2010-01-01",
    to: "2019-12-31",
  },
  {
    value: "2000-2009",
    label: "2000-2009",
    from: "2000-01-01",
    to: "2009-12-31",
  },
  {
    value: "1970-1999",
    label: "1970-1999",
    from: "1970-01-01",
    to: "1999-12-31",
  },
];

// Blocklist of keywords for unsuitable content - can be shared
const BLOCKLIST = [
  "porn",
  "adult",
  "xxx",
  "explicit",
  "sex",
  "erotic",
  "incest",
  "nude",
  "nudity",
  "naked",
  "erotica",
  "hentai",
  "bdsm",
  "fetish",
  "hardcore",
  "masturbation",
  "orgy",
  "swinger",
  "stripper",
  "stripping",
  "dildo",
  "vibrator",
  "anal",
  "cum",
  "masturbate",
  "pornographic",
  "obscene",
  "x-rated",
  "smut",
  "sexploitation",
  "boobs",
  "ass",
  "breasts",
  "cleavage",
  "jerk",
  "dick",
  "cock",
  "pussy",
  "tits",
  "sexy",
  "kink",
  "orgasm",
  "cunnilingus",
  "fellatio",
  "penis",
  "vagina",
  "clitoris",
  "sperm",
  "ejaculation",
  "fuck",
];

export default function SeriesListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // const { seriesState, setSeriesState } = useSeriesListContext(); // If using context

  // Initialize state from URL params or defaults
  const [series, setSeries] = useState([]); // seriesState.series || []
  const [page, setPage] = useState(1); // seriesState.page || 1
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [selectedGenre, setSelectedGenre] = useState(
    searchParams.get("genre") || "All"
  );
  const [selectedRating, setSelectedRating] = useState(
    searchParams.get("rating") || "All"
  );
  const [selectedYear, setSelectedYear] = useState(
    searchParams.get("year") || "All"
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Memoize filtersKey to prevent unnecessary re-renders/resets
  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        search: debouncedSearchTerm,
        genre: selectedGenre,
        rating: selectedRating,
        year: selectedYear,
      }),
    [debouncedSearchTerm, selectedGenre, selectedRating, selectedYear]
  );

  // Effect for debouncing search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms delay
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Effect for updating URL when filters change and resetting series list
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (selectedGenre !== "All") params.set("genre", selectedGenre);
    if (selectedRating !== "All") params.set("rating", selectedRating);
    if (selectedYear !== "All") params.set("year", selectedYear);
    router.replace(`?${params.toString()}`, { scroll: false });

    // Reset series and page when filters change
    setSeries([]);
    setPage(1);
    setHasMore(true); // Assume there might be new results
  }, [filtersKey, router]); // debouncedSearchTerm, selectedGenre, selectedRating, selectedYear are captured by filtersKey

  // Function to filter series based on blocklist (client-side)
  const filterBlockedContent = useCallback((seriesArray) => {
    if (!Array.isArray(seriesArray)) return [];
    return seriesArray.filter((item) => {
      const title = (item.name || "").toLowerCase();
      const overview = (item.overview || "").toLowerCase();
      return !BLOCKLIST.some(
        (keyword) => title.includes(keyword) || overview.includes(keyword)
      );
    });
  }, []);

  // Fetch series from TMDB API
  const fetchSeries = useCallback(
    async (pageNumberToFetch) => {
      if (loading) return;
      setLoading(true);
      setError(null);
      try {
        const baseUrl = "https://api.themoviedb.org/3/";
        const endpoint = debouncedSearchTerm ? "search/tv" : "discover/tv";
        const params = new URLSearchParams({
          api_key: process.env.NEXT_PUBLIC_TMDB_KEY,
          page: pageNumberToFetch.toString(),
          include_adult: "false", // Standard practice
        });

        if (debouncedSearchTerm) {
          params.append("query", debouncedSearchTerm);
        } else {
          // Add discovery filters if not searching
          if (selectedGenre !== "All")
            params.append("with_genres", selectedGenre);
          if (selectedRating !== "All") {
            const { min, max } = RATING_OPTIONS[selectedRating];
            params.append("vote_average.gte", min.toString());
            // TMDB max rating is 10, so lte might not be strictly needed if min is high
            if (max < 10) params.append("vote_average.lte", max.toString());
          }
          if (selectedYear !== "All") {
            const yearGroup = YEAR_GROUPS.find(
              (group) => group.value === selectedYear
            );
            if (yearGroup && yearGroup.from && yearGroup.to) {
              params.append("first_air_date.gte", yearGroup.from);
              params.append("first_air_date.lte", yearGroup.to);
            }
          }
          // Default sort for discovery, can be made a filter option later
          params.append("sort_by", "popularity.desc");
        }

        const response = await fetch(
          `${baseUrl}${endpoint}?${params.toString()}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.status_message || "Failed to fetch TV series"
          );
        }
        const data = await response.json();
        const filteredResults = filterBlockedContent(data.results || []);

        setSeries((prevSeries) =>
          pageNumberToFetch === 1
            ? filteredResults
            : [...prevSeries, ...filteredResults]
        );
        setHasMore(data.page < data.total_pages && filteredResults.length > 0);
        if (
          pageNumberToFetch === 1 &&
          filteredResults.length === 0 &&
          !debouncedSearchTerm
        ) {
          // If first page is empty for discover, could indicate no more results with these filters
          setHasMore(false);
        }
      } catch (err) {
        console.error("Fetch Series Error:", err);
        setError(err.message);
        setHasMore(false); // Stop pagination on error
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearchTerm,
      selectedGenre,
      selectedRating,
      selectedYear,
      loading,
      filterBlockedContent,
    ]
  );

  // Initial fetch and fetch on filter changes
  useEffect(() => {
    fetchSeries(1); // Fetch page 1 whenever filtersKey changes (which implies filters have changed)
  }, [filtersKey, fetchSeries]);

  // Infinite scroll handler
  const loadMoreSeries = useCallback(() => {
    if (loading || !hasMore) return;
    setPage((prevPage) => {
      const nextPage = prevPage + 1;
      fetchSeries(nextPage);
      return nextPage;
    });
  }, [loading, hasMore, fetchSeries]);

  // Scroll event listener for infinite scroll and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300
      ) {
        loadMoreSeries();
      }
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreSeries]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handler for select change
  const handleFilterChange = (setter, queryParamKey) => (e) => {
    const { value } = e.target;
    setter(value);
    // URL update is handled by the useEffect listening to filter changes via filtersKey
  };

  return (
    <div className="space-y-8">
      {/* Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-card shadow-md rounded-lg border">
        <input
          type="text"
          placeholder="Search TV series..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
        />
        <div className="relative w-full md:w-auto">
          <label htmlFor="genre-filter" className="sr-only">
            Filter by genre
          </label>
          <select
            id="genre-filter"
            value={selectedGenre}
            onChange={handleFilterChange(setSelectedGenre, "genre")}
            className="w-full md:w-auto appearance-none bg-background border border-input rounded-md py-2 px-3 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm"
          >
            <option value="All">All Genres</option>
            {Object.entries(TV_GENRES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
            {/* ChevronDownIcon or similar can be placed here if not using native select arrow */}
          </div>
        </div>
        <select
          value={selectedRating}
          onChange={handleFilterChange(setSelectedRating, "rating")}
          className="w-full px-4 py-3 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
        >
          {Object.entries(RATING_OPTIONS).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label || key} {/* Assuming RATING_OPTIONS might have labels */}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={handleFilterChange(setSelectedYear, "year")}
          className="w-full px-4 py-3 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
        >
          {YEAR_GROUPS.map((group) => (
            <option key={group.value} value={group.value}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-red-500 text-lg">Error: {error}</p>
        </div>
      )}

      {/* Pass series to MoviesGrid, ensuring it can handle series objects and SeriesCard */}
      <MoviesGrid
        movies={series.map((s) => ({ ...s, title: s.name }))} // Adapt series to look like movies for MoviesGrid
        CardComponent={SeriesCard} // Explicitly pass SeriesCard
        itemType="TV" // Indicate item type for potential use in MoviesGrid or SeriesCard
      />

      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground mt-2">Loading more series...</p>
        </div>
      )}

      {!loading && series.length === 0 && !error && (
        <div className="text-center py-20">
          <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl text-foreground font-semibold">
            No TV series found
          </h2>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filters.
          </p>
        </div>
      )}

      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-opacity active:scale-95 z-50"
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
