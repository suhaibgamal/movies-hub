"use client";

import MovieCard from "@/app/components/MovieCard";
import PropTypes from "prop-types";

const GENRES = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

function MoviesGrid({ movies, watchlist = [], onWatchlistChange }) {
  return (
    <section className="py-8 px-4 bg-background" aria-label="Movies grid">
      {movies?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <article key={movie.id} className="relative group">
              <MovieCard
                movie={movie}
                genres={GENRES}
                href={`/movie/${movie.id}`}
                initialWatchlisted={watchlist.some(
                  (item) => item.movieId === movie.id
                )}
                onWatchlistChange={onWatchlistChange}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-2xl text-foreground font-semibold">
            No movies found
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
      title: PropTypes.string.isRequired,
      poster_path: PropTypes.string,
      backdrop_path: PropTypes.string,
      vote_average: PropTypes.number.isRequired,
      genre_ids: PropTypes.arrayOf(PropTypes.number),
      release_date: PropTypes.string,
    })
  ).isRequired,
  watchlist: PropTypes.arrayOf(
    PropTypes.shape({
      movieId: PropTypes.number.isRequired,
    })
  ),
  onWatchlistChange: PropTypes.func,
};

export default MoviesGrid;
