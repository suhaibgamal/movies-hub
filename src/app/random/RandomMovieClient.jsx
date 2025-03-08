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
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

const fetchMovies = async (genre = "") => {
  try {
    const baseUrl = "https://api.themoviedb.org/3/discover/movie";
    // Filter for popular, high-rated, and recent movies.
    let url = `${baseUrl}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&sort_by=popularity.desc&vote_average.gte=7&primary_release_date.gte=2000-01-01`;
    if (genre) {
      url += `&with_genres=${genre}`;
    }
    // Fetch page 1 to determine total pages.
    const res = await fetch(url + "&page=1");
    if (!res.ok) throw new Error("Failed to fetch movies");
    const data = await res.json();
    // Limit to the first 100 pages.
    const availablePages = Math.min(data.total_pages, 100);
    // Pick a random page from 1 to availablePages.
    const randomPage = Math.floor(Math.random() * availablePages) + 1;
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
  // Global cache of movies (all genres)
  const [globalMovies, setGlobalMovies] = useState([]);
  // Global list of movie IDs that have been shown
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [genre, setGenre] = useState("");
  const [randomMovie, setRandomMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  // Track when the movie poster has finished loading.
  const [posterLoaded, setPosterLoaded] = useState(false);

  // Global watchlist store.
  const watchlist = useWatchlist();
  const { syncWatchlist } = useWatchlistActions();

  useEffect(() => {
    // Fetch an initial list of movies (all genres) on mount.
    const fetchInitialMovies = async () => {
      setLoading(true);
      const moviesData = await fetchMovies();
      setGlobalMovies(moviesData);
      setLoading(false);
    };
    fetchInitialMovies();
    fetchWatchlist();
  }, []);

  // Preload the poster image for the selected movie.
  useEffect(() => {
    if (randomMovie && randomMovie.poster_path) {
      const img = new Image();
      img.src = `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}`;
      img.onload = () => setPosterLoaded(true);
      img.onerror = () => setPosterLoaded(true);
    }
  }, [randomMovie]);

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
    // Use the current global movie cache.
    let currentMovies = [...globalMovies];
    // Filter movies that match the selected genre (if any) and haven't been shown.
    let availableMovies = currentMovies.filter(
      (movie) =>
        (genre ? movie.genre_ids.includes(Number(genre)) : true) &&
        !watchedMovies.includes(movie.id)
    );

    // If no unwatched movies are available, fetch new movies with the selected genre.
    if (availableMovies.length === 0) {
      const fetchedMovies = await fetchMovies(genre);
      const newMovies = fetchedMovies.filter(
        (movie) => !currentMovies.some((m) => m.id === movie.id)
      );
      currentMovies = [...currentMovies, ...newMovies];
      setGlobalMovies(currentMovies);
      // Re-check available movies.
      availableMovies = currentMovies.filter(
        (movie) =>
          (genre ? movie.genre_ids.includes(Number(genre)) : true) &&
          !watchedMovies.includes(movie.id)
      );
    }

    if (availableMovies.length === 0) {
      setLoading(false);
      setRandomMovie(null);
      return;
    }

    // Pick a random unwatched movie.
    const chosenMovie =
      availableMovies[Math.floor(Math.random() * availableMovies.length)];

    setWatchedMovies((prev) => [...prev, chosenMovie.id]);
    setRandomMovie(chosenMovie);
    // Reset posterLoaded so that the skeleton remains until the image is preloaded.
    setPosterLoaded(false);
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
        {loading || (randomMovie && !posterLoaded) ? (
          <div className="w-64 lg:w-80">
            <SkeletonLoader />
          </div>
        ) : randomMovie ? (
          <div className="w-64 lg:w-80">
            <MovieCard
              movie={randomMovie}
              href={`/movie/${randomMovie.id}`}
              genres={GENRES}
              small={true}
              initialWatchlisted={watchlist.includes(randomMovie.id)}
              isAbove={true}
              onImageLoad={() => setPosterLoaded(true)}
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

// Custom SkeletonLoader using the provided design with updated sizing.
function SkeletonLoader() {
  return (
    <div className="animate-pulse rounded-xl bg-card p-4">
      <div className="flex flex-col lg:flex-row">
        <div className="aspect-[2/3] w-full bg-muted lg:w-1/2" />
        <div className="flex-1 p-8 space-y-4">
          <div className="h-8 w-3/4 rounded bg-muted shimmer" />
          <div className="h-6 w-1/2 rounded bg-muted shimmer" />
          <div className="space-y-2">
            <div className="h-4 rounded bg-muted shimmer" />
            <div className="h-4 w-5/6 rounded bg-muted shimmer" />
            <div className="h-4 w-2/3 rounded bg-muted shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}
