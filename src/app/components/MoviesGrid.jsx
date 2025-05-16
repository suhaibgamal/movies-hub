// app/components/MoviesGrid.jsx
"use client";

import { useState, useEffect } from "react";
import MovieCard from "@/app/components/MovieCard";
import PropTypes from "prop-types";
import { SearchX } from "lucide-react";
import { GENRES, TV_GENRES } from "@/lib/constants";

function MoviesGrid({
  movies,
  watchlist = [],
  onWatchlistChange,
  CardComponent = MovieCard,
  itemType = "MOVIE",
}) {
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

  return (
    <section
      className="py-8 px-4 bg-background"
      aria-label={`${itemType === "TV" ? "TV Series" : "Movies"} grid`}
    >
      {movies?.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {movies.map((item, index) => {
            const href =
              itemType === "TV" ? `/tv/${item.id}` : `/movie/${item.id}`;
            const cardProps = {
              [itemType === "TV" ? "series" : "movie"]: item,
              genres: itemType === "TV" ? TV_GENRES : GENRES,
              href: href,
              isAbove: index < aboveTheFoldCount,
              initialWatchlisted: watchlist.some(
                (watchlistItem) =>
                  (watchlistItem.movieId || watchlistItem.itemId) === item.id &&
                  itemType === (watchlistItem.itemType || "MOVIE")
              ),
              onWatchlistChange: onWatchlistChange,
            };

            return (
              <article key={item.id} className="relative group">
                <CardComponent {...cardProps} />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <SearchX className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl text-foreground font-semibold">
            No {itemType === "TV" ? "TV series" : "movies"} found
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
      title: PropTypes.string,
      name: PropTypes.string,
      poster_path: PropTypes.string,
      vote_average: PropTypes.number,
      genre_ids: PropTypes.arrayOf(PropTypes.number),
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
  CardComponent: PropTypes.elementType,
  itemType: PropTypes.oneOf(["MOVIE", "TV"]),
};

export default MoviesGrid;
