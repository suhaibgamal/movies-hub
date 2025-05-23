export const GENRES = {
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
  // 10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10769: "Foreign", // Optional, TMDB movie genre
};

export const TV_GENRES = {
  10759: "Action & Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  10762: "Kids",
  9648: "Mystery",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  37: "Western",
  // Optional cross-over genres (safe to include if using genre_ids from TMDB results)
  14: "Fantasy",
  27: "Horror",
  36: "History",
  10402: "Music",
  // 10749: "Romance",
  53: "Thriller",
  10769: "Foreign", // Rare but possible
};

// Unified map for safe use with mixed media (e.g., search results)
export const ALL_GENRES = {
  ...GENRES,
  ...TV_GENRES,
};
