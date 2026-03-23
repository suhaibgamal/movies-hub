// src/app/api/tmdb/[...path]/route.js
// Edge Runtime proxy — hides TMDB API key from client, adds CDN caching

export const runtime = "edge";

const TMDB_BASE = "https://api.themoviedb.org/3";

// Whitelist of allowed TMDB path prefixes to prevent open-proxy abuse
const ALLOWED_PREFIXES = [
  "discover/",
  "search/",
  "movie/",
  "tv/",
  "trending/",
  "person/",
];

// Cache durations by path pattern (seconds)
function getCacheDuration(path) {
  if (path.startsWith("search/")) return 60; // 1 min — search results change
  if (path.startsWith("trending/")) return 300; // 5 min — trending data
  if (path.startsWith("discover/")) return 180; // 3 min — discovery data
  if (path.includes("/combined_credits")) return 86400; // 24h — actor credits rarely change
  if (path.startsWith("movie/popular") || path.startsWith("tv/popular"))
    return 300; // 5 min
  if (path.startsWith("movie/top_rated") || path.startsWith("tv/top_rated"))
    return 600; // 10 min
  if (path.startsWith("movie/upcoming")) return 600; // 10 min
  return 120; // 2 min default
}

export async function GET(request, { params }) {
  const { path } = await params;
  const tmdbPath = path.join("/");

  // Validate against whitelist
  const isAllowed = ALLOWED_PREFIXES.some((prefix) =>
    tmdbPath.startsWith(prefix)
  );
  if (!isAllowed) {
    return new Response(JSON.stringify({ error: "Path not allowed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the API key server-side (never exposed to client)
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    console.error("[TMDB Proxy] TMDB_API_KEY not configured");
    return new Response(
      JSON.stringify({ error: "API configuration error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Forward query params, strip any api_key the client might have sent
  const url = new URL(request.url);
  const clientParams = new URLSearchParams(url.search);
  clientParams.delete("api_key"); // Safety: strip if present
  clientParams.set("api_key", apiKey); // Inject real key server-side

  const tmdbUrl = `${TMDB_BASE}/${tmdbPath}?${clientParams.toString()}`;

  try {
    const tmdbRes = await fetch(tmdbUrl);
    const data = await tmdbRes.text(); // Pass through as-is

    if (!tmdbRes.ok) {
      return new Response(data, {
        status: tmdbRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Add CDN cache headers for Vercel Edge
    const cacheDuration = getCacheDuration(tmdbPath);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `public, s-maxage=${cacheDuration}, stale-while-revalidate=${cacheDuration * 2}`,
      },
    });
  } catch (error) {
    console.error("[TMDB Proxy] Fetch error:", error.message);
    return new Response(
      JSON.stringify({ error: "Failed to fetch from TMDB" }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
