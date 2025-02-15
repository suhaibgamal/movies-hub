// app/random/RandomClient.jsx
"use client";

import { useState, useEffect } from "react";
import MovieCard from "@/app/components/MovieCard";
import { useWatchlist, useWatchlistActions } from "@/app/store/watchlistStore";

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

const fetchMovies = async (page = Math.floor(Math.random() * 10) + 1) => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&page=${page}`
    );
    if (!res.ok) throw new Error("Failed to fetch movies");
    const data = await res.json();
    return data.results.length > 0 ? data.results : fetchMovies(page + 1);
  } catch (error) {
    console.error(error);
    return [];
  }
};

export default function RandomMovieClient() {
  const [movies, setMovies] = useState([]);
  const [genre, setGenre] = useState("");
  const [randomMovie, setRandomMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  // Use the global watchlist store.
  const watchlist = useWatchlist();
  const { syncWatchlist } = useWatchlistActions();

  useEffect(() => {
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
    let filteredMovies = [];
    while (filteredMovies.length === 0) {
      const newMovies = await fetchMovies();
      filteredMovies = newMovies.filter((movie) =>
        genre ? movie.genre_ids.includes(parseInt(genre)) : true
      );
    }
    setRandomMovie(
      filteredMovies[Math.floor(Math.random() * filteredMovies.length)]
    );
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

function SkeletonLoader() {
  return (
    <div className="w-64 bg-muted rounded-lg overflow-hidden animate-pulse">
      <div
        className="w-full"
        style={{ aspectRatio: "2/3", backgroundColor: "hsl(var(--muted))" }}
      ></div>
      <div className="p-2">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  );
}
