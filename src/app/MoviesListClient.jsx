// app/components/MoviesListClient.jsx
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMoviesListContext } from "@/app/context/MoviesListContext";
import MoviesGrid from "@/app/components/MoviesGrid";
import { GENRES, TV_GENRES } from "@/lib/constants";
import { SearchX } from "lucide-react";

// Rating options
const RATING_OPTIONS = {
  All: { min: 0, max: 10, label: "All Ratings" },
  Good: { min: 7, max: 10, label: "Good (7+)" },
  Ok: { min: 5, max: 7, label: "Ok (5-7)" },
  Bad: { min: 0, max: 5, label: "Bad (<5)" },
};

// Year groups for filtering
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

// Blocklist of keywords for unsuitable content
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

const ITEM_TYPES = {
  ALL: "ALL",
  MOVIE: "MOVIE",
  TV: "TV",
};

export default function MoviesListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { moviesState, setMoviesState } = useMoviesListContext();

  const [items, setItems] = useState(moviesState.movies || []);
  const [page, setPage] = useState(moviesState.page || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedItemType, setSelectedItemType] = useState(
    searchParams.get("itemType") || ITEM_TYPES.ALL
  );
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

  const currentGenres = useMemo(() => {
    if (selectedItemType === ITEM_TYPES.MOVIE) return GENRES;
    if (selectedItemType === ITEM_TYPES.TV) return TV_GENRES;
    return {};
  }, [selectedItemType]);

  const filtersKey = useMemo(
    () =>
      JSON.stringify({
        itemType: selectedItemType,
        search: debouncedSearchTerm,
        genre: selectedGenre,
        rating: selectedRating,
        year: selectedYear,
      }),
    [
      selectedItemType,
      debouncedSearchTerm,
      selectedGenre,
      selectedRating,
      selectedYear,
    ]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set("search", debouncedSearchTerm);
    if (selectedItemType !== ITEM_TYPES.ALL)
      params.set("itemType", selectedItemType);
    else params.delete("itemType");

    if (selectedGenre !== "All" && selectedItemType !== ITEM_TYPES.ALL) {
      params.set("genre", selectedGenre);
    } else {
      params.delete("genre");
    }
    if (selectedRating !== "All") params.set("rating", selectedRating);
    else params.delete("rating");
    if (selectedYear !== "All") params.set("year", selectedYear);
    else params.delete("year");

    router.replace(`?${params.toString()}`, { scroll: false });

    if (
      moviesState.filtersKey !== filtersKey ||
      (moviesState.movies &&
        items.length === 0 &&
        moviesState.movies.length > 0)
    ) {
      setItems([]);
      setPage(1);
      setHasMore(true);
    }
  }, [filtersKey, router, moviesState.filtersKey, moviesState.movies, items]);

  useEffect(() => {
    setMoviesState({ items, page, filtersKey, selectedItemType });
  }, [items, page, filtersKey, selectedItemType, setMoviesState]);

  const filterBlockedContent = useCallback((rawItems) => {
    if (!Array.isArray(rawItems)) return [];
    return rawItems.filter((item) => {
      const title = (item.title || item.name || "").toLowerCase();
      const overview = (item.overview || "").toLowerCase();
      return !BLOCKLIST.some(
        (keyword) => title.includes(keyword) || overview.includes(keyword)
      );
    });
  }, []);

  const normalizeItemData = (item, itemTypeFromFetch) => {
    const media_type = item.media_type || itemTypeFromFetch;
    if (media_type === "movie") {
      return {
        ...item,
        media_type: "movie",
        displayTitle: item.title,
        displayDate: item.release_date,
      };
    } else if (media_type === "tv") {
      return {
        ...item,
        media_type: "tv",
        displayTitle: item.name,
        displayDate: item.first_air_date,
      };
    }
    return null;
  };

  const fetchItems = useCallback(
    async (pageNumberToFetch) => {
      if (loading && pageNumberToFetch > 1) return;
      setLoading(true);
      setError(null);
      let fetchedItems = [];
      let totalPages = 0;

      try {
        const apiKey = process.env.NEXT_PUBLIC_TMDB_KEY;
        const baseUrl = "https://api.themoviedb.org/3/";

        const sharedParams = {
          api_key: apiKey,
          page: pageNumberToFetch.toString(),
          include_adult: "false",
        };

        if (debouncedSearchTerm) {
          const searchParams = new URLSearchParams({
            ...sharedParams,
            query: debouncedSearchTerm,
          });
          let searchEndpoint = "search/";
          if (selectedItemType === ITEM_TYPES.MOVIE) searchEndpoint += "movie";
          else if (selectedItemType === ITEM_TYPES.TV) searchEndpoint += "tv";
          else searchEndpoint += "multi";

          const response = await fetch(
            `${baseUrl}${searchEndpoint}?${searchParams.toString()}`
          );
          if (!response.ok)
            throw new Error(
              (await response.json()).status_message || "Failed to search items"
            );
          const data = await response.json();
          fetchedItems = (data.results || []).map((item) =>
            normalizeItemData(
              item,
              selectedItemType === ITEM_TYPES.ALL
                ? null
                : selectedItemType.toLowerCase()
            )
          );
          totalPages = data.total_pages;
        } else {
          const discoverParams = new URLSearchParams(sharedParams);
          if (selectedRating !== "All") {
            const { min, max } = RATING_OPTIONS[selectedRating];
            discoverParams.append("vote_average.gte", min.toString());
            if (max < 10)
              discoverParams.append("vote_average.lte", max.toString());
          }

          const yearGroup = YEAR_GROUPS.find(
            (group) => group.value === selectedYear
          );
          if (yearGroup && yearGroup.from && yearGroup.to) {
            const dateGteParam =
              selectedItemType === ITEM_TYPES.TV
                ? "first_air_date.gte"
                : "primary_release_date.gte";
            const dateLteParam =
              selectedItemType === ITEM_TYPES.TV
                ? "first_air_date.lte"
                : "primary_release_date.lte";
            discoverParams.append(dateGteParam, yearGroup.from);
            discoverParams.append(dateLteParam, yearGroup.to);
          }
          discoverParams.append("sort_by", "popularity.desc");

          if (
            selectedItemType === ITEM_TYPES.MOVIE ||
            selectedItemType === ITEM_TYPES.ALL
          ) {
            const movieDiscoverParams = new URLSearchParams(discoverParams);
            if (
              selectedGenre !== "All" &&
              (selectedItemType === ITEM_TYPES.MOVIE ||
                selectedItemType === ITEM_TYPES.ALL)
            ) {
              if (GENRES[selectedGenre])
                movieDiscoverParams.append("with_genres", selectedGenre);
            }
            const response = await fetch(
              `${baseUrl}discover/movie?${movieDiscoverParams.toString()}`
            );
            if (!response.ok)
              throw new Error(
                (await response.json()).status_message ||
                  "Failed to fetch movies"
              );
            const data = await response.json();
            fetchedItems = fetchedItems.concat(
              (data.results || []).map((item) =>
                normalizeItemData(item, "movie")
              )
            );
            totalPages = Math.max(totalPages, data.total_pages);
          }

          if (
            selectedItemType === ITEM_TYPES.TV ||
            selectedItemType === ITEM_TYPES.ALL
          ) {
            const tvDiscoverParams = new URLSearchParams(discoverParams);
            if (
              selectedGenre !== "All" &&
              (selectedItemType === ITEM_TYPES.TV ||
                selectedItemType === ITEM_TYPES.ALL)
            ) {
              if (TV_GENRES[selectedGenre])
                tvDiscoverParams.append("with_genres", selectedGenre);
            }
            const response = await fetch(
              `${baseUrl}discover/tv?${tvDiscoverParams.toString()}`
            );
            if (!response.ok)
              throw new Error(
                (await response.json()).status_message ||
                  "Failed to fetch TV shows"
              );
            const data = await response.json();
            fetchedItems = fetchedItems.concat(
              (data.results || []).map((item) => normalizeItemData(item, "tv"))
            );
            totalPages = Math.max(totalPages, data.total_pages);
          }

          if (selectedItemType === ITEM_TYPES.ALL && !debouncedSearchTerm) {
            fetchedItems.sort(
              (a, b) => (b.popularity || 0) - (a.popularity || 0)
            );
          }
        }

        const validFilteredItems = filterBlockedContent(
          fetchedItems.filter((item) => item !== null)
        );

        setItems((prevItems) =>
          pageNumberToFetch === 1
            ? validFilteredItems
            : [...prevItems, ...validFilteredItems]
        );
        setHasMore(
          pageNumberToFetch < totalPages && validFilteredItems.length > 0
        );
      } catch (err) {
        console.error("Fetch Items Error:", err);
        setError(err.message);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearchTerm,
      selectedItemType,
      selectedGenre,
      selectedRating,
      selectedYear,
      loading,
      filterBlockedContent,
      normalizeItemData,
    ]
  );

  useEffect(() => {
    fetchItems(1);
  }, [filtersKey, fetchItems]);

  const loadMoreItems = useCallback(() => {
    if (loading || !hasMore) return;
    setPage((prevPage) => {
      const nextPage = prevPage + 1;
      fetchItems(nextPage);
      return nextPage;
    });
  }, [loading, hasMore, fetchItems]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 300 &&
        !loading
      ) {
        loadMoreItems();
      }
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loadMoreItems, loading]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFilterChange = (setter, queryParamKey) => (e) => {
    const { value } = e.target;
    setter(value);
  };

  const handleItemTypeChange = (itemType) => {
    setSelectedItemType(itemType);
    if (
      itemType === ITEM_TYPES.ALL ||
      currentGenres[selectedGenre] === undefined
    ) {
      setSelectedGenre("All");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-center space-x-2 sm:space-x-4 my-6 p-2 bg-card shadow-sm rounded-lg border sticky top-16 md:top-20 z-40">
        {Object.values(ITEM_TYPES).map((type) => (
          <button
            key={type}
            onClick={() => handleItemTypeChange(type)}
            className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors duration-150
              ${
                selectedItemType === type
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary"
              }`}
          >
            {type.charAt(0) + type.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-4 bg-card shadow-md rounded-lg border">
        <input
          type="text"
          placeholder={`Search ${
            selectedItemType === ITEM_TYPES.MOVIE
              ? "movies"
              : selectedItemType === ITEM_TYPES.TV
              ? "TV series"
              : "all..."
          }`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
        />
        {selectedItemType !== ITEM_TYPES.ALL && (
          <div className="relative w-full md:w-auto">
            <label htmlFor="genre-filter" className="sr-only">
              Filter by genre
            </label>
            <select
              id="genre-filter"
              value={selectedGenre}
              onChange={handleFilterChange(setSelectedGenre, "genre")}
              className="w-full md:w-auto appearance-none bg-background border border-input rounded-md py-2 px-3 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm"
              disabled={selectedItemType === ITEM_TYPES.ALL}
            >
              <option value="All">All Genres</option>
              {Object.entries(currentGenres).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground"></div>
          </div>
        )}
        <div className="relative w-full md:w-auto">
          <label htmlFor="rating-filter" className="sr-only">
            Filter by rating
          </label>
          <select
            id="rating-filter"
            value={selectedRating}
            onChange={handleFilterChange(setSelectedRating, "rating")}
            className="w-full md:w-auto appearance-none bg-background border border-input rounded-md py-2 px-3 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm"
          >
            {Object.entries(RATING_OPTIONS).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground"></div>
        </div>
        <div className="relative w-full md:w-auto">
          <label htmlFor="year-filter" className="sr-only">
            Filter by year
          </label>
          <select
            id="year-filter"
            value={selectedYear}
            onChange={handleFilterChange(setSelectedYear, "year")}
            className="w-full md:w-auto appearance-none bg-background border border-input rounded-md py-2 px-3 pr-8 leading-tight focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary text-sm"
          >
            {YEAR_GROUPS.map((group) => (
              <option key={group.value} value={group.value}>
                {group.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground"></div>
        </div>
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-red-500 text-lg">Error: {error}</p>
        </div>
      )}

      <MoviesGrid movies={items} />

      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground mt-2">Loading more...</p>
        </div>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="text-center py-20">
          <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl text-foreground font-semibold">
            No{" "}
            {selectedItemType === ITEM_TYPES.MOVIE
              ? "movies"
              : selectedItemType === ITEM_TYPES.TV
              ? "TV series"
              : "content"}{" "}
            found
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
            {" "}
            <path d="M12 19V5M5 12l7-7 7 7" />{" "}
          </svg>
        </button>
      )}
    </div>
  );
}
