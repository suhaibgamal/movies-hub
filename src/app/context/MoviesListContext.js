// MoviesListContext.js
"use client";

import { createContext, useContext, useState } from "react";

const MoviesListContext = createContext();

export function MoviesListProvider({ children }) {
  const [moviesState, setMoviesState] = useState({
    movies: [],
    page: 1,
    scrollY: 0,
    filtersKey: null,
  });

  return (
    <MoviesListContext.Provider value={{ moviesState, setMoviesState }}>
      {children}
    </MoviesListContext.Provider>
  );
}

export function useMoviesListContext() {
  return useContext(MoviesListContext);
}
