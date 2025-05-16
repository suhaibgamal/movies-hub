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
