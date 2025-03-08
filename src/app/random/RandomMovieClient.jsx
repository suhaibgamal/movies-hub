// app/random/RandomClient.jsx
"use client";

import { useState, useEffect } from "react";
import MovieCard from "@/app/components/MovieCard";
import { useWatchlist, useWatchlistActions } from "@/app/store/watchlistStore";
import SkeletonLoader from "../components/SkeletonLoader";

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
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const fetchMovies = async (genre = "") => {
  try {
    const baseUrl = "https://api.themoviedb.org/3/discover/movie";
    // Use discover endpoint with a default sort order for consistency
    let url = `${baseUrl}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&sort_by=popularity.desc`;
    if (genre) {
      url += `&with_genres=${genre}`;
    }
    // Fetch page 1 to determine the total number of pages
    const res = await fetch(url + "&page=1");
    if (!res.ok) throw new Error("Failed to fetch movies");
    const data = await res.json();
    const totalPages = Math.min(data.total_pages, 500);
    // Pick a random page between 1 and totalPages
    const randomPage = Math.floor(Math.random() * totalPages) + 1;
    const finalUrl = url + `&page=${randomPage}`;
    const res2 = await fetch(finalUrl);
    if (!res2.ok) throw new Error("Failed to fetch movies");
    const data2 = await res2.json();
    return data2.results || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default function RandomMovieClient() {
  // Existing state variables
  const [movies, setMovies] = useState([]);
  const [genre, setGenre] = useState("");
  const [randomMovie, setRandomMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  // New state for caching movies and tracking already appeared movies per genre
  const [movieCache, setMovieCache] = useState({});
  const [watchedMovies, setWatchedMovies] = useState({});

  // Use the global watchlist store.
  const watchlist = useWatchlist();
  const { syncWatchlist } = useWatchlistActions();

  useEffect(() => {
    // For initial load, fetch a default list (all genres)
    getNewMovies();
    fetchWatchlist();
  }, []);

  const getNewMovies = async () => {
    setLoading(true);
    const moviesData = await fetchMovies();
    setMovies(moviesData);
    setLoading(false);
  };

  const fetchWatchlist = async () => {
    try {
      const res = await fetch("/api/watchList", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        console.error("Failed to fetch watchlist");
        return;
      }
      const data = await res.json();
      if (data.watchlist) {
        syncWatchlist(data.watchlist.map((item) => item.movieId));
      }
    } catch (error) {
      console.error("Error fetching watchlist:", error);
    }
  };

  const handleFilter = async () => {
    setLoading(true);

    // Get current cache and watched list for the selected genre (or empty array if not set)
    let currentCache = movieCache[genre] || [];
    let currentWatched = watchedMovies[genre] || [];

    // If no movies have been cached for this genre or if all movies have been shown,
    // then fetch new movies and reset the watched list for this genre.
    if (
      currentCache.length === 0 ||
      currentCache.length === currentWatched.length
    ) {
      const fetchedMovies = await fetchMovies(genre);
      currentCache = fetchedMovies;
      currentWatched = [];
      setMovieCache((prev) => ({ ...prev, [genre]: fetchedMovies }));
      setWatchedMovies((prev) => ({ ...prev, [genre]: [] }));
    }

    // Filter the cached movies to only include those not yet shown.
    const availableMovies = currentCache.filter(
      (movie) => !currentWatched.includes(movie.id)
    );

    if (availableMovies.length === 0) {
      // This should not happen because we re-fetched if all movies were watched.
      setLoading(false);
      setRandomMovie(null);
      return;
    }

    // Pick a random movie from the available ones.
    const chosenMovie =
      availableMovies[Math.floor(Math.random() * availableMovies.length)];

    // Add the chosen movie to the watched list for this genre.
    const updatedWatched = [...currentWatched, chosenMovie.id];
    setWatchedMovies((prev) => ({ ...prev, [genre]: updatedWatched }));

    setRandomMovie(chosenMovie);
    setLoading(false);
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-background flex flex-col lg:flex-row">
      <div className="flex-1 flex flex-col justify-center items-center gap-y-4 px-4">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent py-2">
          Random Movie Picker
        </h1>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full px-3 py-4 rounded-lg border bg-card text-card-foreground focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          >
            <option value="">All Genres</option>
            {Object.entries(GENRES).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={handleFilter}
            disabled={loading}
            className="w-full px-4 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-bold text-white hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            aria-label={loading ? "Loading..." : "Get Random Movie"}
          >
            {loading ? "Loading..." : "Get Random Movie"}
          </button>
        </div>
      </div>
      <div className="flex-1 flex justify-center items-center p-2">
        {loading ? (
          <SkeletonLoader />
        ) : randomMovie ? (
          <div className="w-64">
            <MovieCard
              movie={randomMovie}
              href={`/movie/${randomMovie.id}`}
              genres={GENRES}
              small={true}
              initialWatchlisted={watchlist.includes(randomMovie.id)}
              isAbove={true}
            />
          </div>
        ) : (
          <p className="text-center text-muted-foreground text-sm">
            No movie found. Try again!
          </p>
        )}
      </div>
    </div>
  );
}
