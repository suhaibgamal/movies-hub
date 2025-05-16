// app/components/MoviesGrid.jsx
"use client";

import { useState, useEffect } from "react";
import MovieCard from "@/app/components/MovieCard";
import SeriesCard from "@/app/components/SeriesCard";
import PropTypes from "prop-types";
import { SearchX } from "lucide-react";
import { GENRES, TV_GENRES } from "@/lib/constants";

function MoviesGrid({ movies: items, watchlist = [], onWatchlistChange }) {
  const [aboveTheFoldCount, setAboveTheFoldCount] = useState(6);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) {
        setAboveTheFoldCount(2);
      } else {
        setAboveTheFoldCount(6);
      }
    }
  }, []);

  const predominantlyTV = items?.every((item) => item.media_type === "tv");
  const predominantlyMovie = items?.every(
    (item) => item.media_type === "movie"
  );
  let gridContentTypeLabel = "Content";
  if (predominantlyMovie) gridContentTypeLabel = "Movies";
  else if (predominantlyTV) gridContentTypeLabel = "TV Series";

  return (
    <section
      className="py-8 px-4 bg-background"
      aria-label={`${gridContentTypeLabel} grid`}
    >
      {items?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item, index) => {
            const isTV = item.media_type === "tv";
            const CardToRender = isTV ? SeriesCard : MovieCard;
            const genresForCard = isTV ? TV_GENRES : GENRES;
            const href = isTV ? `/tv/${item.id}` : `/movie/${item.id}`;

            const cardSpecificProps = isTV ? { series: item } : { movie: item };

            return (
              <article
                key={`${item.media_type}-${item.id}`}
                className="relative group"
              >
                <CardToRender
                  {...cardSpecificProps}
                  genres={genresForCard}
                  href={href}
                  isAbove={index < aboveTheFoldCount}
                  initialWatchlisted={watchlist.some(
                    (watchlistItem) =>
                      (watchlistItem.itemId || watchlistItem.movieId) ===
                        item.id &&
                      (item.media_type ===
                        (
                          watchlistItem.itemType || (isTV ? "TV" : "MOVIE")
                        ).toLowerCase() ||
                        item.media_type ===
                          (watchlistItem.itemType || (isTV ? "tv" : "movie")))
                  )}
                  onWatchlistChange={onWatchlistChange}
                />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl text-foreground font-semibold">
            No {gridContentTypeLabel.toLowerCase()} found
          </h2>
          <p className="mt-2 text-muted-foreground">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </section>
  );
}

MoviesGrid.propTypes = {
  movies: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      media_type: PropTypes.oneOf(["movie", "tv"]).isRequired,
      displayTitle: PropTypes.string,
      displayDate: PropTypes.string,
      poster_path: PropTypes.string,
      vote_average: PropTypes.number,
      genre_ids: PropTypes.arrayOf(PropTypes.number),
      name: PropTypes.string,
      title: PropTypes.string,
    })
  ).isRequired,
  watchlist: PropTypes.arrayOf(
    PropTypes.shape({
      itemId: PropTypes.number,
      movieId: PropTypes.number,
      itemType: PropTypes.string,
    })
  ),
  onWatchlistChange: PropTypes.func,
};

export default MoviesGrid;
