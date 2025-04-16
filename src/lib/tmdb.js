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
