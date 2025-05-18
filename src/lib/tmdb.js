// src/lib/tmdb.js
import { unstable_cache } from "next/cache";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const normalizeTmdbItem = (item, defaultMediaType) => {
  const media_type = item.media_type || defaultMediaType;
  return {
    ...item,
    media_type: media_type,
    displayTitle: media_type === "tv" ? item.name : item.title,
    displayDate: media_type === "tv" ? item.first_air_date : item.release_date,
  };
};

export const getCachedMovieData = unstable_cache(
  async (id) => {
    const res = await fetch(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos,external_ids`, // <<< MODIFIED HERE
      {
        next: { revalidate: 86400 }, // Revalidate daily
      }
    );
    if (!res.ok)
      throw new Error(`Failed to fetch movie with id ${id}: ${res.statusText}`);
    return res.json();
  },
  ["movie-data"],
  { revalidate: 86400 }
);

export const getCachedTrailerData = unstable_cache(
  async (id, itemType = "movie") => {
    try {
      const endpoint =
        itemType === "tv" ? `tv/${id}/videos` : `movie/${id}/videos`;
      const res = await fetch(
        `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US`,
        { next: { revalidate: 86400 } }
      );
      if (!res.ok) {
        console.warn(
          `No videos found for ${itemType} ID ${id} or API error: ${res.status}`
        );
        return { results: [] };
      }
      return res.json();
    } catch (error) {
      console.error(
        `Error fetching trailer data for ${itemType} ID ${id}:`,
        error
      );
      return { results: [] };
    }
  },
  ["trailer-data"],
  { revalidate: 86400 }
);

export const getCachedCredits = unstable_cache(
  async (id, itemType = "movie") => {
    const endpoint =
      itemType === "tv" ? `tv/${id}/credits` : `movie/${id}/credits`;
    const res = await fetch(
      `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok)
      throw new Error(
        `Failed to fetch credits for ${itemType} id ${id}: ${res.statusText}`
      );
    return res.json();
  },
  ["credits-data"],
  { revalidate: 86400 }
);

export const checkLinkStability = unstable_cache(
  async (id, itemType = "movie") => {
    const watchLink =
      itemType === "tv"
        ? `https://vidsrc.xyz/embed/tv/${id}`
        : `https://vidsrc.xyz/embed/movie/${id}`;
    try {
      const response = await fetch(watchLink, { method: "HEAD", mode: "cors" });
      return response.ok;
    } catch (error) {
      console.warn(
        `Link stability check for ${itemType} ID ${id} failed:`,
        error.message
      );
      return false;
    }
  },
  ["link-stability"],
  { revalidate: 259200 }
);

export const getCachedRecommendations = unstable_cache(
  async (id, itemType = "movie") => {
    const endpoint =
      itemType === "tv"
        ? `tv/${id}/recommendations`
        : `movie/${id}/recommendations`;
    const res = await fetch(
      `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.warn(
        `No recommendations found for ${itemType} ID ${id} or API error: ${res.status}`
      );
      return { results: [] };
    }
    const data = await res.json();
    data.results = (data.results || []).map((item) =>
      normalizeTmdbItem(item, item.media_type || itemType)
    );
    return data;
  },
  ["recommendations-data"],
  { revalidate: 86400 }
);

export const getActorMovieCredits = async (actorId) => {
  try {
    const res = await fetch(
      `${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}&language=en-US`
    );
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        errorData.status_message || "Failed to fetch actor movie credits"
      );
    }
    const data = await res.json();
    const sortedMovies = (data.cast || [])
      .filter((movie) => movie.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return sortedMovies;
  } catch (err) {
    console.error("Error fetching actor movie credits from lib:", err);
    throw err;
  }
};

// --- TV Show Specific Functions ---

export const getCachedTvShowDetails = unstable_cache(
  async (tvId) => {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=en-US&append_to_response=videos,external_ids`
    );
    if (!res.ok)
      throw new Error(
        `Failed to fetch TV show details for id ${tvId}: ${res.statusText}`
      );
    return res.json();
  },
  ["tv-show-details"],
  { revalidate: 86400 }
);

export const getCachedTvSeasonDetails = unstable_cache(
  async (tvId, seasonNumber) => {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.warn(
        `Failed to fetch details for TV ID ${tvId}, Season ${seasonNumber}: ${res.status}`
      );
      return null;
    }
    return res.json();
  },
  ["tv-season-details"],
  { revalidate: 86400 }
);

// --- Homepage Data Functions ---
// (Keep existing homepage functions: getPopularMoviesForHome, getPopularTvShowsForHome, etc.)
export const getPopularMoviesForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Popular Movies): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "movie"));
  },
  ["popular-movies-home"],
  { revalidate: 3600 }
);

export const getPopularTvShowsForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Popular TV Shows): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "tv"));
  },
  ["popular-tv-shows-home"],
  { revalidate: 3600 }
);

export const getTrendingAllWeekForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Trending All Week): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, item.media_type));
  },
  ["trending-all-week-home"],
  { revalidate: 3600 }
);

export const getTopRatedMoviesForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Top Rated Movies): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "movie"));
  },
  ["top-rated-movies-home"],
  { revalidate: 86400 }
);

export const getTopRatedTvShowsForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Top Rated TV Shows): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "tv"));
  },
  ["top-rated-tv-shows-home"],
  { revalidate: 86400 }
);

export const getUpcomingMoviesForHome = unstable_cache(
  async (limit = 12) => {
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const ninetyDaysFromNow = futureDate.toISOString().split("T")[0];

    const res = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&primary_release_date.gte=${today}&primary_release_date.lte=${ninetyDaysFromNow}&with_release_type=2|3`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Upcoming Movies): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "movie"));
  },
  ["upcoming-movies-home"],
  { revalidate: 86400 }
);
