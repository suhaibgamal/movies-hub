import Link from "next/link";
import Image from "next/image";
import { FaTimes } from "react-icons/fa";

export default function ActorFilmographyModal({
  isOpen,
  onClose,
  actorName,
  movies,
  isLoading,
  error,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl mx-auto rounded-lg bg-background p-6 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-muted pb-3 mb-4 flex-shrink-0">
          <h2 className="text-xl sm:text-2xl font-bold text-card-foreground">
            {actorName}'s Filmography
          </h2>
          <button
            onClick={onClose}
            className="text-white bg-black/50 rounded-full p-1 hover:text-gray-300 text-3xl focus:outline-none"
            aria-label={`Close ${actorName}'s filmography`}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {isLoading && (
          <div className="flex-grow flex items-center justify-center py-10">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
          </div>
        )}

        {error && (
          <div className="flex-grow flex flex-col items-center justify-center py-10 text-center">
            <p className="text-destructive text-lg mb-2">
              Failed to load filmography.
            </p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        )}

        {!isLoading && !error && movies.length === 0 && (
          <div className="flex-grow flex items-center justify-center py-10">
            <p className="text-muted-foreground text-lg">
              No filmography found for {actorName}.
            </p>
          </div>
        )}

        {!isLoading && !error && movies.length > 0 && (
          <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[60vh] overflow-y-auto pr-2">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="overflow-hidden rounded-lg bg-card shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105 border border-transparent hover:border-primary"
              >
                <Link href={`/movie/${movie.id}`} legacyBehavior>
                  <a className="block" onClick={onClose}>
                    {" "}
                    {/* Close modal on movie click */}
                    <div className="relative aspect-[2/3] w-full bg-muted">
                      <Image
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w300${movie.poster_path}`
                            : "/images/default.webp"
                        }
                        alt={`${movie.title} poster`}
                        fill
                        className="object-cover"
                        unoptimized // Consistent with project's image handling for TMDB
                        loading="lazy"
                      />
                    </div>
                    <div className="p-2 sm:p-3 text-center">
                      <h3 className="text-xs sm:text-sm font-medium text-card-foreground truncate">
                        {movie.title}
                      </h3>
                      {movie.release_date && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {new Date(movie.release_date).getFullYear()}
                        </p>
                      )}
                    </div>
                  </a>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
