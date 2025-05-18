// src/app/actions/tvActions.js
"use server"; // This directive marks all exports in this file as Server Actions

import { getCachedTvSeasonDetails } from "@/lib/tmdb"; // Ensure this path is correct

export async function fetchSeasonDetailsAction(tvId, seasonNumber) {
  // Basic validation (can be enhanced with Zod if needed)
  if (!tvId || typeof seasonNumber !== "number" || seasonNumber < 0) {
    // console.error("fetchSeasonDetailsAction: Invalid parameters", { tvId, seasonNumber });
    return { error: "Invalid TV ID or season number provided." };
  }

  try {
    // console.log(`Server Action: Fetching season ${seasonNumber} for TV ID ${tvId}`);
    const seasonDetails = await getCachedTvSeasonDetails(tvId, seasonNumber);

    if (!seasonDetails) {
      // console.warn(`Server Action: No details found for TV ID ${tvId}, Season ${seasonNumber}`);
      return { error: `Could not load details for Season ${seasonNumber}.` };
    }
    // console.log(`Server Action: Successfully fetched season ${seasonNumber} for TV ID ${tvId}`);
    return { data: seasonDetails }; // Return data wrapped in an object
  } catch (error) {
    console.error(
      `Server Action error fetching season details for TV ID ${tvId}, Season ${seasonNumber}:`,
      error
    );
    return {
      error:
        error.message || "Failed to load season details due to a server error.",
    };
  }
}
