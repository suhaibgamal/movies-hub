"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMoviesListContext } from "@/app/context/MoviesListContext";
import MoviesGrid from "@/app/components/MoviesGrid";

const GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const RATING_OPTIONS = {
  All: { min: 0, max: 10 },
  Good: { min: 7, max: 10 },
  Ok: { min: 5, max: 7 },
  Bad: { min: 0, max: 5 },
};

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

export default function MoviesListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { moviesState, setMoviesState } = useMoviesListContext();

  const [movies, setMovies] = useState(moviesState.movies || []);
  const [page, setPage] = useState(moviesState.page || 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      const params = new URLSearchParams(searchParams);
      params.set("search", searchTerm);
      router.replace(`?${params.toString()}`);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm, router, searchParams]);

  useEffect(() => {
    setSelectedGenre(searchParams.get("genre") || "All");
    setSelectedRating(searchParams.get("rating") || "All");
    setSelectedYear(searchParams.get("year") || "All");
  }, [searchParams]);

  const filtersKey = JSON.stringify({
    search: searchParams.get("search") || "",
    genre: searchParams.get("genre") || "All",
    rating: searchParams.get("rating") || "All",
    year: searchParams.get("year") || "All",
  });
  useEffect(() => {
    if (moviesState.filtersKey !== filtersKey) {
      setMovies([]);
      setPage(1);
    }
  }, [filtersKey, moviesState.filtersKey]);

  useEffect(() => {
    setMoviesState({ movies, page, filtersKey });
  }, [movies, page, filtersKey, setMoviesState]);

  const updateQueryParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.replace(`?${params.toString()}`);
  };

  const handleGenreChange = (e) => {
    const value = e.target.value;
    setSelectedGenre(value);
    updateQueryParam("genre", value);
  };

  const handleRatingChange = (e) => {
    const value = e.target.value;
    setSelectedRating(value);
    updateQueryParam("rating", value);
  };

  const handleYearChange = (e) => {
    const value = e.target.value;
    setSelectedYear(value);
    updateQueryParam("year", value);
  };

  const fetchMovies = useCallback(
    async (pageNumber, searchQuery) => {
      try {
        setLoading(true);
        setError(null);
        const baseUrl = "https://api.themoviedb.org/3/";
        const endpoint = searchQuery ? "search/movie" : "discover/movie";
        const params = new URLSearchParams({
          api_key: process.env.NEXT_PUBLIC_TMDB_KEY,
          page: pageNumber,
          ...(searchQuery && { query: searchQuery }),
        });
        if (!searchQuery) {
          if (selectedGenre !== "All")
            params.append("with_genres", selectedGenre);
          if (selectedRating !== "All") {
            const { min, max } = RATING_OPTIONS[selectedRating];
            params.append("vote_average.gte", min);
            params.append("vote_average.lte", max);
          }
          if (selectedYear !== "All") {
            const yearGroup = YEAR_GROUPS.find(
              (group) => group.value === selectedYear
            );
            if (yearGroup) {
              params.append("primary_release_date.gte", yearGroup.from);
              params.append("primary_release_date.lte", yearGroup.to);
            }
          }
        }
        const response = await fetch(
          `${baseUrl}${endpoint}?${params.toString()}`
        );
        if (!response.ok) throw new Error("Failed to fetch movies");
        const data = await response.json();
        return data.results;
      } catch (err) {
        setError(err.message);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [selectedGenre, selectedRating, selectedYear]
  );

  useEffect(() => {
    if (movies.length === 0) {
      (async () => {
        const results = await fetchMovies(1, debouncedSearchTerm);
        setMovies(results);
        setPage(1);
      })();
    }
  }, [
    debouncedSearchTerm,
    selectedGenre,
    selectedRating,
    selectedYear,
    fetchMovies,
    movies.length,
  ]);

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 200;
      setShowScrollButton(window.scrollY > 500);
      if (nearBottom && !loading) setPage((prev) => prev + 1);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading]);

  useEffect(() => {
    if (page > 1) {
      (async () => {
        const newMovies = await fetchMovies(page, debouncedSearchTerm);
        setMovies((prev) => {
          const uniqueIds = new Set(prev.map((movie) => movie.id));
          return [
            ...prev,
            ...newMovies.filter((movie) => !uniqueIds.has(movie.id)),
          ];
        });
      })();
    }
  }, [page, debouncedSearchTerm, fetchMovies]);

  const filteredMovies = useMemo(() => {
    if (!debouncedSearchTerm) return movies;
    return movies
      .filter((movie) => {
        const genreMatch =
          selectedGenre === "All" ||
          (movie.genre_ids && movie.genre_ids.includes(Number(selectedGenre)));
        const ratingRange = RATING_OPTIONS[selectedRating];
        const ratingMatch =
          movie.vote_average >= ratingRange.min &&
          movie.vote_average <= ratingRange.max;
        let yearMatch = true;
        if (selectedYear !== "All" && movie.release_date) {
          const yearGroup = YEAR_GROUPS.find((g) => g.value === selectedYear);
          yearMatch =
            yearGroup &&
            movie.release_date >= yearGroup.from &&
            movie.release_date <= yearGroup.to;
        }
        return genreMatch && ratingMatch && yearMatch;
      })
      .sort((a, b) => b.popularity - a.popularity);
  }, [
    movies,
    debouncedSearchTerm,
    selectedGenre,
    selectedRating,
    selectedYear,
  ]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-destructive text-center">
          <h2 className="text-2xl font-extrabold mb-2">Error Loading Movies</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={selectedGenre}
              onChange={handleGenreChange}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="All">All Genres</option>
              {Object.entries(GENRES).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={selectedRating}
              onChange={handleRatingChange}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {Object.keys(RATING_OPTIONS).map((option) => (
                <option key={option} value={option}>
                  {option}
                  {option !== "All" && ` (${RATING_OPTIONS[option].min}+)`}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="w-full sm:w-auto px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {YEAR_GROUPS.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <MoviesGrid movies={filteredMovies} />
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          </div>
        )}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed bottom-8 right-8 px-4 py-2 sm:px-6 sm:py-3 rounded-xl border bg-gradient-to-r from-blue-500 to-purple-500 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all z-50 hover:from-blue-400 hover:to-purple-400 ${
            showScrollButton ? "block" : "hidden"
          }`}
          aria-label="Back to Top"
        >
          Back to Top
        </button>
      </div>
    </main>
  );
}
