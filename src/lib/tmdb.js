// src/lib/tmdb.js
import { unstable_cache } from "next/cache";

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

// --- Aggressive Cache Periods (personal project, minimize ISR writes) ---
const REVALIDATE_ITEM_DETAILS = 1209600; // 14 days
const REVALIDATE_RECOMMENDATIONS = 1209600; // 14 days
const REVALIDATE_LINK_CHECK = 1209600; // 14 days (vidsrc check)
const REVALIDATE_HOMEPAGE_DYNAMIC = 259200; // 3 days (popular/trending)
const REVALIDATE_HOMEPAGE_STATIC_LISTS = 604800; // 7 days (top rated)
const REVALIDATE_HOMEPAGE_UPCOMING = 259200; // 3 days (upcoming)
const FETCH_TIMEOUT_MS = 8000; // 8 seconds for external fetches

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
 * (Full JSDoc from your provided file)
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
  ["link-stability-vidsrc-get-v2"],
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
 * Fetches combined movie and TV credits for an actor from TMDB.
 * Filters for items with poster_path and sorts by popularity.
 * Includes media_type 'movie' or 'tv'. Not cached by unstable_cache for client-side use.
 * @param {string|number} actorId - The TMDB actor ID.
 * @returns {Promise<Array<Object>>} Array of combined credit objects (movies and TV shows).
 * @throws Will throw an error if the fetch fails.
 */
export const getActorCombinedCredits = async (actorId) => {
  try {
    const res = await fetch(
      `${BASE_URL}/person/${actorId}/combined_credits?api_key=${API_KEY}&language=en-US`
    );
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(
        errorData.status_message || "Failed to fetch actor combined credits"
      );
    }
    const data = await res.json();
    const sortedCredits = (data.cast || [])
      .filter(
        (credit) =>
          credit.poster_path &&
          (credit.media_type === "movie" || credit.media_type === "tv")
      )
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    return sortedCredits;
  } catch (err) {
    console.error("Error fetching actor combined credits from lib:", err);
    throw err; // Re-throw to be caught by the calling component
  }
};

// --- TV Show Specific Functions ---

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

// --- Watchlist Hydration Functions ---

/**
 * Fetches a lightweight summary of a movie or TV show for card rendering.
 * Only returns the fields needed: id, title/name, poster_path, date, vote_average, genre_ids, media_type.
 * @param {number} id - The TMDB item ID.
 * @param {'MOVIE'|'TV'} itemType - Uppercase item type from DB.
 * @returns {Promise<Object|null>} Normalized item summary or null if fetch failed.
 */
export const getCachedItemSummary = unstable_cache(
  async (id, itemType) => {
    const mediaType = itemType === "TV" ? "tv" : "movie";
    const endpoint = `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&language=en-US`;

    try {
      const res = await fetch(endpoint, {
        next: { revalidate: REVALIDATE_ITEM_DETAILS },
      });

      if (!res.ok) {
        console.warn(
          `[getCachedItemSummary] Failed to fetch ${mediaType} ID ${id}: ${res.status}`
        );
        return null;
      }

      const data = await res.json();

      // Return only the fields needed for card rendering
      return {
        id: data.id,
        media_type: mediaType,
        title: mediaType === "tv" ? data.name : data.title,
        name: mediaType === "tv" ? data.name : undefined,
        poster_path: data.poster_path || null,
        vote_average: typeof data.vote_average === "number" ? data.vote_average : 0,
        genre_ids: (data.genres || []).map((g) => g.id),
        release_date: mediaType === "movie" ? data.release_date : undefined,
        first_air_date: mediaType === "tv" ? data.first_air_date : undefined,
        overview: data.overview || "",
        displayTitle: mediaType === "tv" ? data.name : data.title,
        displayDate: mediaType === "tv" ? data.first_air_date : data.release_date,
      };
    } catch (error) {
      console.error(
        `[getCachedItemSummary] Error fetching ${mediaType} ID ${id}:`,
        error.message
      );
      return null;
    }
  },
  ["item-summary"],
  { revalidate: REVALIDATE_ITEM_DETAILS }
);

/**
 * Hydrates a list of watchlist items (IDs only) with TMDB data.
 * Uses concurrency-limited batch fetching to respect TMDB rate limits.
 * @param {Array<{itemId: number, itemType: string}>} items - Watchlist items from DB.
 * @param {number} [concurrency=5] - Max parallel TMDB requests.
 * @returns {Promise<Array<Object>>} Hydrated items with TMDB data (nulls filtered out).
 */
export async function hydrateWatchlistItems(items, concurrency = 5) {
  const results = [];

  // Process in batches to avoid TMDB rate limits
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((item) => getCachedItemSummary(item.itemId, item.itemType))
    );
    results.push(...batchResults);
  }

  // Filter out failed fetches (nulls) and preserve original order
  return results.filter(Boolean);
}

