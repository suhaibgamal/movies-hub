// app/watchlist/page.jsx (Server Component)
import WatchlistClient from "@/app/watchlist/WatchlistClient";

export const metadata = {
  title: "Movies Hub - My Watchlist",
  description: "View and manage your movie watchlist on Movies Hub.",
  alternates: { canonical: "https://movies.suhaeb.com/watchlist" },
};

export default function WatchlistPage() {
  return <WatchlistClient />;
}
