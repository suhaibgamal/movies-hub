// src/app/watchlist/page.jsx
import WatchlistClient from "@/app/watchlist/WatchlistClient";
import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/authOptions";
import { PrismaClient } from "@prisma/client";
import { hydrateWatchlistItems } from "@/lib/tmdb";

export const metadata = {
  title: "My Watchlist - Movies Hub",
  description:
    "View and manage your personalized watchlist of movies and TV shows on Movies Hub.",
  alternates: {
    canonical: "https://movies.suhaeb.com/watchlist",
  },
  robots: {
    index: false,
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

// Singleton Prisma client
let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) global.prisma = new PrismaClient();
  prisma = global.prisma;
}

/**
 * Server component: fetches watchlist IDs from DB, hydrates with TMDB data,
 * then passes pre-rendered items to the client component.
 */
async function WatchlistContent() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Client component handles redirect — pass empty items
    return <WatchlistClient initialItems={[]} />;
  }

  // Fetch only IDs from DB (no metadata stored)
  const watchlistIds = await prisma.watchlistItem.findMany({
    where: { userId: session.user.id },
    select: { itemId: true, itemType: true },
    orderBy: { createdAt: "desc" },
  });

  // Hydrate with fresh TMDB data (concurrency-limited, cached 7 days)
  const hydratedItems = await hydrateWatchlistItems(watchlistIds);

  return <WatchlistClient initialItems={hydratedItems} />;
}

export default function WatchlistPage() {
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
      <WatchlistContent />
    </Suspense>
  );
}
