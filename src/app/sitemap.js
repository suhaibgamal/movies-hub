// src/app/sitemap.js

const BASE_URL = "https://movies.suhaeb.com";
// Use the server-side variable if available, otherwise fallback to public.
// Ideally, use a secret key for server-side operations, but this works for now.
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;

async function getPopularMedia(type, pageLimit = 20) {
  // 'type' should be 'movie' or 'tv'
  const ids = new Set();
  
  // Create an array of promises to fetch all pages at the same time
  const promises = [];
  for (let page = 1; page <= pageLimit; page++) {
    promises.push(
      fetch(
        `https://api.themoviedb.org/3/${type}/popular?api_key=${API_KEY}&language=en-US&page=${page}`,
        { next: { revalidate: 3600 } } // Cache this for 1 hour so we don't spam TMDB on every request
      ).then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
    );
  }

  // Wait for all requests to finish
  const results = await Promise.all(promises);

  // Process results
  results.forEach((data) => {
    if (data && data.results) {
      data.results.forEach((item) => ids.add(item.id.toString()));
    }
  });

  return Array.from(ids).map((id) => ({ id }));
}

export default async function sitemap() {
  const currentDate = new Date().toISOString();

  // 1. Static Pages
  const staticPaths = [
    {
      url: `${BASE_URL}`,
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
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Fetch Dynamic Data (Parallel)
  // We bump pageLimit to 20 (approx 400 movies + 400 TV shows)
  // You can increase this, but be careful of TMDB API rate limits.
  const [movieIds, tvIds] = await Promise.all([
    getPopularMedia("movie", 20),
    getPopularMedia("tv", 20),
  ]);

  const movieEntries = movieIds.map((movie) => ({
    url: `${BASE_URL}/movie/${movie.id}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const tvShowEntries = tvIds.map((tv) => ({
    url: `${BASE_URL}/tv/${tv.id}`,
    lastModified: currentDate,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  console.log(`Sitemap generated with ${movieEntries.length} movies and ${tvShowEntries.length} TV shows.`);

  return [...staticPaths, ...movieEntries, ...tvShowEntries];
}
