// src/lib/tmdb.js
import { unstable_cache } from "next/cache";

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// --- Performance-Optimized Revalidation Periods ---
const REVALIDATE_ITEM_DETAILS = 604800; // 7 days
const REVALIDATE_RECOMMENDATIONS = 259200; // 3 days
const REVALIDATE_LINK_CHECK = 259200; // 3 days (for vidsrc check)
const REVALIDATE_HOMEPAGE_DYNAMIC = 21600; // 6 hours (Popular, Trending)
const REVALIDATE_HOMEPAGE_STATIC_LISTS = 259200; // 3 days (Top Rated)
const REVALIDATE_HOMEPAGE_UPCOMING = 86400; // 1 day (Upcoming)
const FETCH_TIMEOUT_MS = 8000; // 8 seconds for external fetches (slightly increased for potentially heavier checks)

/**
 * Normalizes a TMDB item (movie or TV show) to a consistent structure.
 * @param {Object} item - The TMDB item object.
 * @param {'movie'|'tv'|null} defaultMediaType - The default media type if not present in item.media_type.
 * @returns {Object|null} The normalized item or null if invalid.
 */
const normalizeTmdbItem = (item, defaultMediaType) => {
  if (!item || typeof item.id === "undefined") return null;

  const media_type = item.media_type || defaultMediaType;
  if (!media_type || (media_type !== "movie" && media_type !== "tv"))
    return null;

  return {
    ...item,
    media_type: media_type,
    displayTitle: media_type === "tv" ? item.name : item.title,
    displayDate: media_type === "tv" ? item.first_air_date : item.release_date,
  };
};

/**
 * Fetches and caches detailed movie data from TMDB.
 * @param {string|number} id - The TMDB movie ID.
 * @returns {Promise<Object>} The movie data.
 * @throws Will throw an error if the fetch fails or movie not found.
 */
export const getCachedMovieData = unstable_cache(
  async (id) => {
    const res = await fetch(
      `${BASE_URL}/movie/${id}?api_key=${API_KEY}&language=en-US&append_to_response=videos,external_ids`,
      { next: { revalidate: REVALIDATE_ITEM_DETAILS } }
    );
    if (!res.ok) {
      throw new Error(`Failed to fetch movie with id ${id}: ${res.statusText}`);
    }
    return res.json();
  },
  ["movie-data"],
  { revalidate: REVALIDATE_ITEM_DETAILS }
);

/**
 * Fetches and caches trailer data for a movie or TV show.
 * @param {string|number} id - The TMDB item ID.
 * @param {'movie'|'tv'} [itemType="movie"] - The type of item.
 * @returns {Promise<{results: Array<Object>}>} Object containing video results, or { results: [] } on error/not found.
 */
export const getCachedTrailerData = unstable_cache(
  async (id, itemType = "movie") => {
    try {
      const endpoint =
        itemType === "tv" ? `tv/${id}/videos` : `movie/${id}/videos`;
      const res = await fetch(
        `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US`,
        { next: { revalidate: REVALIDATE_ITEM_DETAILS } }
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
  { revalidate: REVALIDATE_ITEM_DETAILS }
);

/**
 * Fetches and caches credits (cast and crew) for a movie or TV show.
 * @param {string|number} id - The TMDB item ID.
 * @param {'movie'|'tv'} [itemType="movie"] - The type of item.
 * @returns {Promise<Object>} The credits data.
 * @throws Will throw an error if the fetch fails.
 */
export const getCachedCredits = unstable_cache(
  async (id, itemType = "movie") => {
    const endpoint =
      itemType === "tv" ? `tv/${id}/credits` : `movie/${id}/credits`;
    const res = await fetch(
      `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US`,
      { next: { revalidate: REVALIDATE_ITEM_DETAILS } }
    );
    if (!res.ok) {
      throw new Error(
        `Failed to fetch credits for ${itemType} id ${id}: ${res.statusText}`
      );
    }
    return res.json();
  },
  ["credits-data"],
  { revalidate: REVALIDATE_ITEM_DETAILS }
);

/**
 * Checks if the main embed page for a movie or TV series on vidsrc.xyz is reachable.
 * IMPORTANT: This function attempts to mimic a browser GET request. However, 100% accuracy
 * in reflecting live browser availability from a server-side check is extremely difficult
 * due to potential IP-based rate limiting by vidsrc.xyz, JavaScript-dependent content rendering,
 * and other advanced anti-bot measures on their end.
 * This check primarily verifies if the initial HTML page can be fetched successfully.
 * A 'true' result means the embed page URL was accessible at the time of the check from the server's IP;
 * it's NOT a guarantee the video stream itself is live or will play for all users.
 * A 'false' result could mean the page is truly down, the specific content is not on vidsrc,
 * OR your server's IP was rate-limited/blocked by vidsrc.xyz.
 *
 * @param {string|number} id - The TMDB item ID.
 * @param {'movie'|'tv'} [itemType="movie"] - The type of item.
 * @returns {Promise<boolean>} True if the embed page responds with HTTP 2xx, false otherwise.
 */
export const checkLinkStability = unstable_cache(
  async (id, itemType = "movie") => {
    const typePath = itemType === "tv" ? "tv" : "movie";
    const watchLink = `https://vidsrc.xyz/embed/${typePath}/${id}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(watchLink, {
        method: "GET",
        signal: controller.signal,
        headers: {
          // More browser-like headers
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          // "Referer": `https://movies.suhaeb.com/`, // Optional: Can sometimes help
        },
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        console.warn(
          `[checkLinkStability] Link stability check for ${itemType} ID ${id} (link: ${watchLink}) timed out after ${FETCH_TIMEOUT_MS}ms.`
        );
      } else {
        console.warn(
          `[checkLinkStability] Link stability check for ${itemType} ID ${id} (link: ${watchLink}) failed:`,
          error.message,
          error.cause ? `Cause: ${error.cause}` : ""
        );
      }
      return false;
    }
  },
  ["link-stability-vidsrc-get-v2"], // New cache key for header changes
  { revalidate: REVALIDATE_LINK_CHECK }
);

/**
 * Fetches and caches recommendations for a movie or TV show.
 * @param {string|number} id - The TMDB item ID.
 * @param {'movie'|'tv'} [itemType="movie"] - The type of item.
 * @returns {Promise<{results: Array<Object>}>} Object containing recommendation results.
 */
export const getCachedRecommendations = unstable_cache(
  async (id, itemType = "movie") => {
    const endpoint =
      itemType === "tv"
        ? `tv/${id}/recommendations`
        : `movie/${id}/recommendations`;
    const res = await fetch(
      `${BASE_URL}/${endpoint}?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: REVALIDATE_RECOMMENDATIONS } }
    );
    if (!res.ok) {
      console.warn(
        `No recommendations found for ${itemType} ID ${id} or API error: ${res.status}`
      );
      return { results: [] };
    }
    const data = await res.json();
    data.results = (data.results || [])
      .map((item) => normalizeTmdbItem(item, item.media_type || itemType))
      .filter(Boolean);
    return data;
  },
  ["recommendations-data"],
  { revalidate: REVALIDATE_RECOMMENDATIONS }
);

/**
 * Fetches movie credits for an actor from TMDB. Not cached by unstable_cache in this lib.
 * @param {string|number} actorId - The TMDB actor ID.
 * @returns {Promise<Array<Object>>} Array of movie credit objects.
 * @throws Will throw an error if the fetch fails.
 */
export const getActorMovieCredits = async (actorId) => {
  // (Implementation remains the same as previous, good for its client-side on-demand use case)
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
// (Implementations remain the same as previous, using REVALIDATE_ITEM_DETAILS)

export const getCachedTvShowDetails = unstable_cache(
  async (tvId) => {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}?api_key=${API_KEY}&language=en-US&append_to_response=videos,external_ids`,
      { next: { revalidate: REVALIDATE_ITEM_DETAILS } }
    );
    if (!res.ok) {
      throw new Error(
        `Failed to fetch TV show details for id ${tvId}: ${res.statusText}`
      );
    }
    return res.json();
  },
  ["tv-show-details"],
  { revalidate: REVALIDATE_ITEM_DETAILS }
);

export const getCachedTvSeasonDetails = unstable_cache(
  async (tvId, seasonNumber) => {
    const res = await fetch(
      `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}&language=en-US`,
      { next: { revalidate: REVALIDATE_ITEM_DETAILS } }
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
  { revalidate: REVALIDATE_ITEM_DETAILS }
);

// --- Homepage Data Functions ---
// (Implementations remain the same as previous, using respective revalidation periods)

export const getPopularMoviesForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: REVALIDATE_HOMEPAGE_DYNAMIC } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Popular Movies): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "movie"))
      .filter(Boolean);
  },
  ["popular-movies-home"],
  { revalidate: REVALIDATE_HOMEPAGE_DYNAMIC }
);

export const getPopularTvShowsForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/tv/popular?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: REVALIDATE_HOMEPAGE_DYNAMIC } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Popular TV Shows): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "tv"))
      .filter(Boolean);
  },
  ["popular-tv-shows-home"],
  { revalidate: REVALIDATE_HOMEPAGE_DYNAMIC }
);

export const getTrendingAllWeekForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/trending/all/week?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: REVALIDATE_HOMEPAGE_DYNAMIC } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Trending All Week): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, item.media_type))
      .filter(Boolean);
  },
  ["trending-all-week-home"],
  { revalidate: REVALIDATE_HOMEPAGE_DYNAMIC }
);

export const getTopRatedMoviesForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: REVALIDATE_HOMEPAGE_STATIC_LISTS } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Top Rated Movies): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "movie"))
      .filter(Boolean);
  },
  ["top-rated-movies-home"],
  { revalidate: REVALIDATE_HOMEPAGE_STATIC_LISTS }
);

export const getTopRatedTvShowsForHome = unstable_cache(
  async (limit = 12) => {
    const res = await fetch(
      `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&language=en-US&page=1`,
      { next: { revalidate: REVALIDATE_HOMEPAGE_STATIC_LISTS } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Top Rated TV Shows): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "tv"))
      .filter(Boolean);
  },
  ["top-rated-tv-shows-home"],
  { revalidate: REVALIDATE_HOMEPAGE_STATIC_LISTS }
);

export const getUpcomingMoviesForHome = unstable_cache(
  async (limit = 12) => {
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 90);
    const ninetyDaysFromNow = futureDate.toISOString().split("T")[0];

    const res = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&primary_release_date.gte=${today}&primary_release_date.lte=${ninetyDaysFromNow}&with_release_type=2|3`,
      { next: { revalidate: REVALIDATE_HOMEPAGE_UPCOMING } }
    );
    if (!res.ok) {
      console.error(`TMDB API Error (Upcoming Movies): ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || [])
      .slice(0, limit)
      .map((item) => normalizeTmdbItem(item, "movie"))
      .filter(Boolean);
  },
  ["upcoming-movies-home"],
  { revalidate: REVALIDATE_HOMEPAGE_UPCOMING }
);
