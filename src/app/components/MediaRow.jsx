// src/app/components/MediaRow.jsx
"use client";
import React from "react"; // Import React for React.isValidElement and React.Children

import Link from "next/link";
import MovieCard from "@/app/components/MovieCard";
import SeriesCard from "@/app/components/SeriesCard";
import { GENRES, TV_GENRES } from "@/lib/constants";
import { useWatchlist } from "@/app/store/watchlistStore";
import { ArrowRight } from "lucide-react";

// Helper function to extract text content from React children (including nested ones)
const extractTextFromChildren = (children) => {
  let text = "";
  React.Children.forEach(children, (child) => {
    if (typeof child === "string") {
      text += child;
    } else if (
      React.isValidElement(child) &&
      child.props &&
      child.props.children
    ) {
      // Recursively extract text from child elements
      text += extractTextFromChildren(child.props.children);
    }
  });
  return text.trim();
};
export default function MediaRow({
  title,
  items,
  viewAllLink,
  isPriorityRow = false, // Indicates if this row is likely above the fold
}) {
  const watchlist = useWatchlist(); // Get the watchlist array from the Zustand store

  // Determine the textual content of the title for ID generation and sr-only h3
  let titleText = "";
  if (typeof title === "string") {
    titleText = title;
  } else if (React.isValidElement(title)) {
    // If title is JSX, extract text content from it and its children
    titleText = extractTextFromChildren(title);
  }

  // Create a stable ID suffix from the title text
  let idSuffix = titleText
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w-]+/g, ""); // Remove non-alphanumeric characters except hyphens

  if (!idSuffix && viewAllLink) {
    // Fallback to using a slug from viewAllLink if titleText didn't yield a usable suffix
    // This attempts to create a somewhat unique slug from the link, limiting its length
    idSuffix = viewAllLink
      .replace(/[\/\?=&%#]/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
  }
  // Ensure there's always a suffix, even if it's generic (should be rare if titles/links are descriptive)
  const sectionTitleId = `section-title-${idSuffix || "media-row"}`;
  if (!items || items.length === 0) {
    return null; // Don't render anything if there are no items
  }

  // Determine the number of items to mark as "above the fold" for priority loading within this row
  // This is especially relevant if the row itself is marked as a priority row
  const aboveTheFoldCountInRow = isPriorityRow ? 5 : 3; // Prioritize more items if the whole row is a priority

  return (
    <section className="mb-6 md:mb-10">
      <div className="flex justify-between items-center mb-3 md:mb-4 px-1">
        <h2
          id={sectionTitleId}
          className="text-xl sm:text-2xl font-semibold text-foreground"
        >
          {title}
        </h2>
        {viewAllLink && (
          <Link
            href={viewAllLink}
            className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 active:text-primary/70 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-sm"
          >
            View All
            <ArrowRight size={14} className="shrink-0" />
          </Link>
        )}
      </div>
      <div className="relative">
        {/* For custom scroll buttons, you'd add them here, absolutely positioned */}
        <div
          // Optional: Add Tailwind scrollbar classes for a more styled scrollbar
          // className="flex overflow-x-auto space-x-3 sm:space-x-4 pb-4 -mx-1 px-1 scrollbar-thin scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground/70 scrollbar-track-transparent scrollbar-thumb-rounded-full"
          className="flex overflow-x-auto space-x-3 sm:space-x-4 pb-4 -mx-1 px-1 hide-scrollbar"
          role="region"
          aria-labelledby={sectionTitleId}
        >
          <h3
            // This h3 is sr-only, its id is not strictly necessary if the h2 above has the id for aria-labelledby
            className="sr-only"
          >
            {/* Use the extracted text for the sr-only h3 for cleaner screen reader output */}
            {titleText || (typeof title === "string" ? title : "Media Section")}
          </h3>
          {items.map((item, index) => {
            // Ensure item has an id and a media_type
            if (!item || typeof item.id === "undefined" || !item.media_type) {
              console.warn(
                "MediaRow: Skipping item due to missing id or media_type",
                item
              );
              return null;
            }

            const itemKey = `${item.media_type}-${item.id}-${index}`;
            const isTV = item.media_type === "tv";
            const genresForCard = isTV ? TV_GENRES : GENRES;
            const href = isTV ? `/tv/${item.id}` : `/movie/${item.id}`;
            const numericItemId = Number(item.id);

            const initialWatchlisted = watchlist.some(
              (storeItem) =>
                storeItem.id === numericItemId &&
                storeItem.type === item.media_type.toUpperCase()
            );

            const cardProps = {
              href: href,
              genres: genresForCard,
              small: true,
              isAbove: index < aboveTheFoldCountInRow, // Prioritize first few items in each row
              initialWatchlisted: initialWatchlisted,
              // onWatchlistChange will be handled by the WatchlistButton's direct store interaction
            };

            // Use displayTitle/displayDate from normalized data, or fallback
            const displayItem = {
              ...item,
              title: item.displayTitle || item.title || item.name,
              name: item.name || item.title, // Ensure 'name' is available for SeriesCard
              release_date:
                item.displayDate || item.release_date || item.first_air_date,
              first_air_date:
                item.displayDate || item.first_air_date || item.release_date,
            };

            return (
              <div
                key={itemKey}
                className="w-[140px] xs:w-[150px] sm:w-[160px] md:w-[170px] flex-shrink-0 transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                role="listitem"
              >
                {isTV ? (
                  <SeriesCard series={displayItem} {...cardProps} />
                ) : (
                  <MovieCard movie={displayItem} {...cardProps} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
