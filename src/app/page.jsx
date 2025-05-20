// src/app/page.jsx
import { Suspense } from "react";
import {
  getPopularMoviesForHome,
  getPopularTvShowsForHome,
  getTopRatedMoviesForHome,
  getTopRatedTvShowsForHome,
  getTrendingAllWeekForHome,
  getUpcomingMoviesForHome,
} from "@/lib/tmdb"; // Ensure these are your actual functions
import MediaRow from "@/app/components/MediaRow";
import MediaRowSkeleton from "@/app/components/MediaRowSkeleton"; // A skeleton for the row

export const metadata = {
  title: "Movies Hub - Discover Movies & TV Shows",
  description:
    "Explore a vast collection of movies and TV shows. Get details, watch trailers, manage your watchlist, and find your next favorite on Movies Hub.",
  alternates: {
    canonical: "https://movies.suhaeb.com/",
  },
  openGraph: {
    title: "Movies Hub - Discover Movies & TV Shows",
    description:
      "Your ultimate destination for movie and TV show discovery, watchlists, and recommendations.",
    url: "https://movies.suhaeb.com/",
    images: [
      {
        url: "https://movies.suhaeb.com/images/default-og.png",
        width: 1200,
        height: 630,
        alt: "Movies Hub - Discover Movies & TV Shows",
      },
    ],
    siteName: "Movies Hub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Movies Hub - Discover Movies & TV Shows",
    description: "Your ultimate destination for movie and TV show discovery.",
    images: ["https://movies.suhaeb.com/images/default-og.png"],
  },
};

const HOME_PAGE_CATEGORY_SLUGS = {
  TRENDING_WEEK: "trending",
  POPULAR_MOVIES: "popular-movies",
  POPULAR_TV: "popular-tv",
  TOP_RATED_MOVIES: "top-rated-movies",
  TOP_RATED_TV: "top-rated-tv",
  UPCOMING_MOVIES: "upcoming-movies",
};

const ITEM_TYPES_ENUM = {
  MOVIE: "MOVIE",
  TV: "TV",
  PERSON: "PERSON",
  ALL: "ALL",
};

async function SectionLoader({
  fetchData,
  title,
  viewAllLink,
  itemTypeForCards,
  sectionSlug,
}) {
  const items = await fetchData();
  return (
    <section id={sectionSlug} className="mb-6 sm:mb-8 md:mb-10">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-card-foreground">
          {title}
        </h2>
        {viewAllLink && (
          <a
            href={viewAllLink}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View All
          </a>
        )}
      </div>
      <MediaRow items={items} itemType={itemTypeForCards} />
    </section>
  );
}

export default async function HomePage() {
  const sectionLimit = 12; // How many items per row

  // Define sections to display on the homepage
  const sectionsConfig = [
    {
      id: "trending",
      title: "Trending This Week",
      fetchData: () => getTrendingAllWeekForHome(sectionLimit),
      viewAllLink: `/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.TRENDING_WEEK}&itemType=${ITEM_TYPES_ENUM.ALL}`,
      itemTypeForCards: ITEM_TYPES_ENUM.ALL, // MediaRow will handle mixed types if 'ALL'
    },
    {
      id: "popular-movies",
      title: "Popular Movies",
      fetchData: () => getPopularMoviesForHome(sectionLimit),
      viewAllLink: `/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.POPULAR_MOVIES}&itemType=${ITEM_TYPES_ENUM.MOVIE}`,
      itemTypeForCards: ITEM_TYPES_ENUM.MOVIE,
    },
    {
      id: "popular-tv",
      title: "Popular TV Shows",
      fetchData: () => getPopularTvShowsForHome(sectionLimit),
      viewAllLink: `/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.POPULAR_TV}&itemType=${ITEM_TYPES_ENUM.TV}`,
      itemTypeForCards: ITEM_TYPES_ENUM.TV,
    },
    {
      id: "top-rated-movies",
      title: "Top Rated Movies",
      fetchData: () => getTopRatedMoviesForHome(sectionLimit),
      viewAllLink: `/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.TOP_RATED_MOVIES}&itemType=${ITEM_TYPES_ENUM.MOVIE}`,
      itemTypeForCards: ITEM_TYPES_ENUM.MOVIE,
    },
    {
      id: "top-rated-tv",
      title: "Top Rated TV Shows",
      fetchData: () => getTopRatedTvShowsForHome(sectionLimit),
      viewAllLink: `/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.TOP_RATED_TV}&itemType=${ITEM_TYPES_ENUM.TV}`,
      itemTypeForCards: ITEM_TYPES_ENUM.TV,
    },
    {
      id: "upcoming-movies",
      title: "Upcoming Movies",
      fetchData: () => getUpcomingMoviesForHome(sectionLimit),
      viewAllLink: `/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.UPCOMING_MOVIES}&itemType=${ITEM_TYPES_ENUM.MOVIE}`,
      itemTypeForCards: ITEM_TYPES_ENUM.MOVIE,
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {sectionsConfig.map((section) => (
          <Suspense
            key={section.id}
            fallback={<MediaRowSkeleton title={section.title} />}
          >
            <SectionLoader
              fetchData={section.fetchData}
              title={section.title}
              viewAllLink={section.viewAllLink}
              itemTypeForCards={section.itemTypeForCards}
              sectionSlug={section.id}
            />
          </Suspense>
        ))}
      </div>
    </main>
  );
}
