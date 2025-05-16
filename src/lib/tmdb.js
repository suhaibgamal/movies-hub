// lib/tmdb.js
import { unstable_cache } from "next/cache";

export const getCachedMovieData = unstable_cache(
  async (id) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) throw new Error("Failed to fetch movie");
    return res.json();
  },
  ["movie-data"],
  { revalidate: 86400 }
);

export const getCachedTrailerData = unstable_cache(
  async (id) => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`,
        { next: { revalidate: 3600 } }
      );
      return res.json();
    } catch (error) {
      return { results: [] };
    }
  },
  ["trailer-data"],
  { revalidate: 3600 }
);

export const getCachedCredits = unstable_cache(
  async (id) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/credits?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("Failed to fetch credits");
    return res.json();
  },
  ["credits-data"],
  { revalidate: 3600 }
);

export const checkLinkStability = unstable_cache(
  async (id) => {
    const watchLink = `https://vidsrc.xyz/embed/movie/${id}`;
    try {
      const response = await fetch(watchLink, { method: "HEAD", mode: "cors" });
      return response.ok;
    } catch (error) {
      console.error("Error checking link stability:", error);
      return false;
    }
  },
  ["link-stability"],
  { revalidate: 2592000 } // revalidate approximately once every 30 days
);

export const getCachedRecommendations = unstable_cache(
  async (id) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/movie/${id}/recommendations?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error("Failed to fetch recommendations");
    return res.json();
  },
  ["recommendations-data"],
  { revalidate: 3600 }
);

// New function to fetch actor movie credits (client-side utility)
export const getActorMovieCredits = async (actorId) => {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
    );
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        errorData.status_message || "Failed to fetch actor credits"
      );
    }
    const data = await res.json();
    // Sort movies by popularity, prioritizing ones with poster_path
    const sortedMovies = (data.cast || [])
      .filter((movie) => movie.poster_path) // Ensure movie has a poster
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0)); // Sort by popularity
    return sortedMovies;
  } catch (err) {
    console.error("Error fetching actor movie credits from lib:", err);
    throw err; // Re-throw the error to be caught by the calling component
  }
};

// --- TV Show Specific Functions ---

export const getCachedTvShowDetails = unstable_cache(
  async (tvId) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tvId}?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
    );
    if (!res.ok) throw new Error("Failed to fetch TV show details");
    return res.json();
  },
  ["tv-show-details"],
  { revalidate: 86400 } // Revalidate daily
);

export const getCachedTvShowCredits = unstable_cache(
  async (tvId) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tvId}/credits?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
    );
    if (!res.ok) throw new Error("Failed to fetch TV show credits");
    return res.json();
  },
  ["tv-show-credits"],
  { revalidate: 86400 } // Revalidate daily
);

export const getCachedTvShowRecommendations = unstable_cache(
  async (tvId) => {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${tvId}/recommendations?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}`
    );
    // It's okay if recommendations are not found, return empty results
    if (!res.ok) return { results: [] };
    return res.json();
  },
  ["tv-show-recommendations"],
  { revalidate: 86400 } // Revalidate daily
);

// Server-side function to fetch discover TV shows (example)
export const fetchDiscoverTvShows = async ({
  page = 1,
  genre = "",
  sortBy = "popularity.desc",
} = {}) => {
  let url = `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&page=${page}&sort_by=${sortBy}`;
  if (genre) {
    url += `&with_genres=${genre}`;
  }
  // Add other filters as needed, e.g., vote_average.gte, first_air_date_year

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch discover TV shows");
  return res.json();
};

// Server-side function to search TV shows (example)
export const fetchSearchTvShows = async ({ query, page = 1 } = {}) => {
  if (!query) throw new Error("Search query is required");
  const url = `https://api.themoviedb.org/3/search/tv?api_key=${
    process.env.NEXT_PUBLIC_TMDB_KEY
  }&query=${encodeURIComponent(query)}&page=${page}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search TV shows");
  return res.json();
};
