// app/store/watchlistStore.js
import { create } from "zustand";

const useWatchlistStore = create((set) => ({
  // Watchlist now stores objects: { id: itemId, type: itemType }
  watchlist: [],
  addToWatchlist: (
    itemToAdd // itemToAdd is { id, type }
  ) =>
    set((state) => {
      const exists = state.watchlist.some(
        (item) => item.id === itemToAdd.id && item.type === itemToAdd.type
      );
      if (exists) {
        return { watchlist: state.watchlist };
      }
      return { watchlist: [...state.watchlist, itemToAdd] };
    }),
  removeFromWatchlist: (
    itemToRemove // itemToRemove is { id, type }
  ) =>
    set((state) => ({
      watchlist: state.watchlist.filter(
        (item) =>
          !(item.id === itemToRemove.id && item.type === itemToRemove.type)
      ),
    })),
  // syncWatchlist now expects an array of objects { id, type }
  syncWatchlist: (items) =>
    set({ watchlist: Array.isArray(items) ? items : [] }),
}));

export const useWatchlist = () => useWatchlistStore((state) => state.watchlist);
export const useWatchlistActions = () => {
  const { addToWatchlist, removeFromWatchlist, syncWatchlist } =
    useWatchlistStore();
  return { addToWatchlist, removeFromWatchlist, syncWatchlist };
};
