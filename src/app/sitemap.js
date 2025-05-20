// src/app/sitemap.js
import // We'll use specific functions for broader ID fetching for the sitemap
// If these don't exist, we'll define simplified versions below
// or adapt your existing homepage functions.
"@/lib/tmdb";

const BASE_URL = "https://movies.suhaeb.com";
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY; // Ensure this is the correct key for these calls

// --- Helper Functions to Fetch IDs for Sitemap ---
// These functions aim to get a broader set of IDs than just for the homepage.
// Adjust `pageLimit` based on TMDB API courtesy and build time tolerance.
// Consider caching these results if build times become too long.

async function getAllDiscoverMovieIds(pageLimit = 10) {
  // Increased page limit for sitemap
  let movieIds = new Set(); // Use a Set to automatically handle duplicates
  try {
    for (let page = 1; page <= pageLimit; page++) {
      // Fetching popular movies is a good proxy for general discoverable movies
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}&language=en-US&page=${page}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          data.results.forEach((movie) => movieIds.add(movie.id.toString()));
        }
      } else {
        console.warn(
          `Sitemap: Failed to fetch popular movies page ${page} for sitemap: ${res.status}`
        );
        break; // Stop if one page fails
      }
    }
  } catch (error) {
    console.error("Sitemap: Error fetching movie IDs:", error.message);
  }
  return Array.from(movieIds).map((id) => ({ id })); // Return array of objects
}

async function getAllDiscoverTvShowIds(pageLimit = 10) {
  // Increased page limit
  let tvShowIds = new Set();
  try {
    for (let page = 1; page <= pageLimit; page++) {
      const res = await fetch(
        `https://api.themoviedb.org/3/tv/popular?api_key=${API_KEY}&language=en-US&page=${page}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results) {
          data.results.forEach((tv) => tvShowIds.add(tv.id.toString()));
        }
      } else {
        console.warn(
          `Sitemap: Failed to fetch popular TV shows page ${page} for sitemap: ${res.status}`
        );
        break;
      }
    }
  } catch (error) {
    console.error("Sitemap: Error fetching TV show IDs:", error.message);
  }
  return Array.from(tvShowIds).map((id) => ({ id }));
}

export default async function sitemap() {
  const currentDate = new Date().toISOString();

  // 1. Static Pages
  const staticPaths = [
    {
      url: `${BASE_URL}/`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/browse`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/random`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate, // Assuming about page content doesn't change often
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // login, register, and watchlist (noindexed) are typically excluded
  ];

  // 2. Movie Detail Pages
  // We use the helper function to get a broader list of movie IDs
  const movieEntries = await getAllDiscoverMovieIds().then((movies) =>
    movies.map((movie) => ({
      url: `${BASE_URL}/movie/${movie.id}`,
      lastModified: currentDate, // Ideally, use actual last modification date if available
      changeFrequency: "weekly",
      priority: 0.9,
    }))
  );

  // 3. TV Show Detail Pages
  const tvShowEntries = await getAllDiscoverTvShowIds().then((tvShows) =>
    tvShows.map((tv) => ({
      url: `${BASE_URL}/tv/${tv.id}`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    }))
  );

  return [...staticPaths, ...movieEntries, ...tvShowEntries];
}
