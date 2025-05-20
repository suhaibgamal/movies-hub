// src/app/watchlist/page.jsx
import WatchlistClient from "@/app/watchlist/WatchlistClient";
import { Suspense } from "react";

export const metadata = {
  title: "My Watchlist - Movies Hub",
  description:
    "View and manage your personalized watchlist of movies and TV shows on Movies Hub.",
  alternates: {
    canonical: "https://movies.suhaeb.com/watchlist",
  },
  // As discussed, for a login-required page, you might want to noindex it.
  // Or, allow indexing but understand Google will likely see a login prompt or empty state if it can't log in.
  robots: {
    index: false, // Change to false if you prefer it not to be indexed
    follow: true,
  },
  openGraph: {
    title: "My Watchlist - Movies Hub",
    description: "Manage your saved movies and TV shows on Movies Hub.",
    url: "https://movies.suhaeb.com/watchlist",
    images: [
      {
        url: "https://movies.suhaeb.com/images/default-og.png",
        width: 1200,
        height: 630,
        alt: "My Watchlist on Movies Hub",
      },
    ],
    siteName: "Movies Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Watchlist - Movies Hub",
    description: "Manage your saved movies and TV shows.",
    images: ["https://movies.suhaeb.com/images/default-og.png"],
  },
};

export default function WatchlistPage() {
  // This Server Component simply renders the Client Component for the watchlist
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
            <p className="text-lg text-muted-foreground">
              Loading your watchlist...
            </p>
          </div>
        </div>
      }
    >
      <WatchlistClient />
    </Suspense>
  );
}
