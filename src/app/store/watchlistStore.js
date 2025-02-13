// app/store/watchlistStore.js
import { create } from "zustand";

const useWatchlistStore = create((set) => ({
  watchlist: [],
  addToWatchlist: (movieId) =>
    set((state) => ({
      watchlist: state.watchlist.includes(movieId)
        ? state.watchlist
        : [...state.watchlist, movieId],
    })),
  removeFromWatchlist: (movieId) =>
    set((state) => ({
      watchlist: state.watchlist.filter((id) => id !== movieId),
    })),
  syncWatchlist: (movieIds) => set({ watchlist: movieIds }),
}));

export const useWatchlist = () => useWatchlistStore((state) => state.watchlist);
export const useWatchlistActions = () => {
  const { addToWatchlist, removeFromWatchlist, syncWatchlist } =
    useWatchlistStore();
  return { addToWatchlist, removeFromWatchlist, syncWatchlist };
};
