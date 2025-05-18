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
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US`,
      {
        // Added language
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
    // Added itemType for potential TV trailers
    try {
      const endpoint =
        itemType === "tv" ? `tv/${id}/videos` : `movie/${id}/videos`;
      const res = await fetch(
        `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US`, // Added language
        { next: { revalidate: 86400 } } // Revalidate daily
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
  ["trailer-data"], // Consider more specific tags if itemType varies, e.g., [`trailer-data-${itemType}`]
  { revalidate: 86400 }
);

export const getCachedCredits = unstable_cache(
  async (id, itemType = "movie") => {
    // Added itemType
    const endpoint =
      itemType === "tv" ? `tv/${id}/credits` : `movie/${id}/credits`;
    const res = await fetch(
      `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US`, // Added language
      { next: { revalidate: 86400 } } // Revalidate daily
    );
    if (!res.ok)
      throw new Error(
        `Failed to fetch credits for ${itemType} id ${id}: ${res.statusText}`
      );
    return res.json();
  },
  ["credits-data"], // Consider more specific tags: [`credits-data-${itemType}`]
  { revalidate: 86400 }
);

export const checkLinkStability = unstable_cache(
  async (id, itemType = "movie") => {
    // Added itemType
    const watchLink =
      itemType === "tv"
        ? `https://vidsrc.xyz/embed/tv/${id}`
        : `https://vidsrc.xyz/embed/movie/${id}`;
    try {
      // Note: HEAD requests to vidsrc.xyz might be blocked or not indicative.
      // A GET request and checking for a redirect or specific content might be more reliable,
      // but can also be heavier. For now, keeping HEAD but be aware of its limitations.
      const response = await fetch(watchLink, { method: "HEAD", mode: "cors" });
      return response.ok; // response.ok is true for 2xx status codes
    } catch (error) {
      // Network errors or CORS issues can cause this.
      console.warn(
        `Link stability check for ${itemType} ID ${id} failed:`,
        error.message
      );
      return false; // Assume not stable if check fails
    }
  },
  ["link-stability"], // Consider more specific tags: [`link-stability-${itemType}`]
  { revalidate: 259200 } // Revalidate approx every 3 days
);

export const getCachedRecommendations = unstable_cache(
  async (id, itemType = "movie") => {
    // Added itemType
    const endpoint =
      itemType === "tv"
        ? `tv/${id}/recommendations`
        : `movie/${id}/recommendations`;
    const res = await fetch(
      `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=1`, // Added language & page
      { next: { revalidate: 86400 } } // Revalidate daily
    );
    if (!res.ok) {
      console.warn(
        `No recommendations found for ${itemType} ID ${id} or API error: ${res.status}`
      );
      return { results: [] };
    }
    const data = await res.json();
    // Normalize recommended items as well
    data.results = (data.results || []).map((item) =>
      normalizeTmdbItem(item, item.media_type || itemType)
    );
    return data;
  },
  ["recommendations-data"], // Consider more specific tags: [`recommendations-data-${itemType}`]
  { revalidate: 86400 }
);

export const getActorMovieCredits = async (actorId) => {
  try {
    const res = await fetch(
      `${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}&language=en-US` // Added language
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
    ); // Added language and append_to_response
    if (!res.ok)
      throw new Error(
        `Failed to fetch TV show details for id ${tvId}: ${res.statusText}`
      );
    return res.json();
  },
  ["tv-show-details"],
  { revalidate: 86400 }
);

// getCachedTvShowCredits is covered by the modified getCachedCredits above

// getCachedTvShowRecommendations is covered by the modified getCachedRecommendations above

export const getCachedTvSeasonDetails = unstable_cache(
  async (tvId, seasonNumber) => {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`, // Added language
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) {
      console.warn(
        `Failed to fetch details for TV ID ${tvId}, Season ${seasonNumber}: ${res.status}`
      );
      return null; // Return null to be handled by the component
    }
    return res.json();
  },
  ["tv-season-details"], // Unique cache key for this group
  // Consider more specific tags if needed: [`tv-season-details-${tvId}-${seasonNumber}`] but that might be too granular for default cache behavior.
  { revalidate: 86400 }
);

// --- Homepage Data Functions ---

export const getPopularMoviesForHome = unstable_cache(
  async (limit = 12) => {
    // Increased limit slightly
    const res = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Popular Movies): ${res.status}`);
      return []; // Return empty array on error
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
    // Increased limit slightly
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
    // Increased limit slightly
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
      .map((item) => normalizeTmdbItem(item, item.media_type)); // media_type is present in trending results
  },
  ["trending-all-week-home"],
  { revalidate: 3600 }
);

export const getTopRatedMoviesForHome = unstable_cache(
  async (limit = 12) => {
    // Increased limit slightly
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
    // Increased limit slightly
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
    // Increased limit slightly
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
