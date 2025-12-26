// src/app/page.jsx
import { Suspense } from "react";
import Link from "next/link";
import MediaRow from "@/app/components/MediaRow";
import HeroSection from "@/app/components/HeroSection";
import {
  TrendingUp,
  ThumbsUp,
  CalendarDays,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import {
  getPopularMoviesForHome,
  getPopularTvShowsForHome,
  getTrendingAllWeekForHome,
  getTopRatedMoviesForHome,
  getTopRatedTvShowsForHome,
  getUpcomingMoviesForHome,
} from "@/lib/tmdb";

const HOME_PAGE_CATEGORY_SLUGS = {
  POPULAR: "popular",
  TOP_RATED: "top_rated",
  UPCOMING: "upcoming",
  TRENDING_WEEK: "trending_week",
};

const ITEM_TYPES_ENUM = {
  MOVIE: "MOVIE",
  TV: "TV",
};

export const metadata = {
  title: {
    absolute: "Suhaeb's Movies Hub | Discover Trending Movies & TV",
  },
  description:
    "Explore Suhaeb Gamal's personal collection of movies and TV shows. Get details, watch trailers, and discover your next favorite film on Movies Hub.",
  alternates: {
    canonical: "https://movies.suhaeb.com/",
  },
  openGraph: {
    title: "Suhaeb's Movies Hub",
    description: "Your ultimate destination for movie and TV show discovery.",
    url: "https://movies.suhaeb.com/",
    images: [
      {
        url: "https://movies.suhaeb.com/images/default-og.png",
        width: 1200,
        height: 630,
        alt: "Suhaeb's Movies Hub Interface",
      },
    ],
    siteName: "Movies Hub",
    type: "website",
  },
};

export default async function HomePage() {
  let popularMoviesData = [];
  let popularTvShowsData = [];
  let trendingItemsData = [];
  let topRatedMoviesData = [];
  let topRatedTvShowsData = [];
  let upcomingMoviesData = [];
  let fetchError = null;

  try {
    [
      trendingItemsData,
      popularMoviesData,
      upcomingMoviesData,
      topRatedMoviesData,
      popularTvShowsData,
      topRatedTvShowsData,
    ] = await Promise.all([
      getTrendingAllWeekForHome(12).catch((e) => []),
      getPopularMoviesForHome(12).catch((e) => []),
      getUpcomingMoviesForHome(12).catch((e) => []),
      getTopRatedMoviesForHome(12).catch((e) => []),
      getPopularTvShowsForHome(12).catch((e) => []),
      getTopRatedTvShowsForHome(12).catch((e) => []),
    ]);
  } catch (error) {
    console.error("HomePage Error:", error.message);
    fetchError = "Could not load all content sections.";
  }

  // --- RANDOMIZER LOGIC ---
  // Pick a random index from the top 8 trending items to be the Hero.
  // This ensures the hero changes on refresh/next visit.
  const heroCandidates = trendingItemsData.slice(0, 8);
  const randomIndex = heroCandidates.length > 0 
    ? Math.floor(Math.random() * heroCandidates.length) 
    : 0;
  
  const heroItem = heroCandidates[randomIndex] || null;

  // Filter the hero item out of the list so it doesn't appear twice immediately
  const trendingRowItems = trendingItemsData.filter(item => item.id !== heroItem?.id);

  return (
    <div className="flex flex-col min-h-screen">
      <h1 className="sr-only">Suhaeb's Movies Hub - Trending Movies & TV Shows</h1>

      {fetchError && (
        <div className="text-center py-4 text-destructive bg-destructive/10">
          <p>{fetchError}</p>
        </div>
      )}

      {/* HERO SECTION */}
      {heroItem && <HeroSection item={heroItem} />}

      {/* MAIN CONTENT CONTAINER */}
      <div className="container mx-auto px-4 md:px-6 space-y-12 pb-16 -mt-6 relative z-20">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading library...</p>
            </div>
          }
        >
          {trendingRowItems.length > 0 && (
            <MediaRow
              title={
                <span className="inline-flex items-center text-xl md:text-2xl font-bold">
                  <TrendingUp className="mr-3 h-6 w-6 text-primary" />
                  Trending This Week
                </span>
              }
              items={trendingRowItems}
              viewAllLink={`/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.TRENDING_WEEK}`}
              isPriorityRow={true}
            />
          )}

          {popularMoviesData.length > 0 && (
            <MediaRow
              title={
                <span className="inline-flex items-center text-xl md:text-2xl font-bold">
                  <TrendingUp className="mr-3 h-6 w-6 text-primary" />
                  Popular Movies
                </span>
              }
              items={popularMoviesData}
              viewAllLink={`/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.POPULAR}&itemType=${ITEM_TYPES_ENUM.MOVIE}`}
            />
          )}

          {upcomingMoviesData.length > 0 && (
            <MediaRow
              title={
                <span className="inline-flex items-center text-xl md:text-2xl font-bold">
                  <CalendarDays className="mr-3 h-6 w-6 text-primary" />
                  Upcoming Movies
                </span>
              }
              items={upcomingMoviesData}
              viewAllLink={`/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.UPCOMING}&itemType=${ITEM_TYPES_ENUM.MOVIE}`}
            />
          )}

          {topRatedMoviesData.length > 0 && (
            <MediaRow
              title={
                <span className="inline-flex items-center text-xl md:text-2xl font-bold">
                  <ThumbsUp className="mr-3 h-6 w-6 text-primary" />
                  Top Rated Movies
                </span>
              }
              items={topRatedMoviesData}
              viewAllLink={`/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.TOP_RATED}&itemType=${ITEM_TYPES_ENUM.MOVIE}`}
            />
          )}

          {popularTvShowsData.length > 0 && (
            <MediaRow
              title={
                <span className="inline-flex items-center text-xl md:text-2xl font-bold">
                  <TrendingUp className="mr-3 h-6 w-6 text-primary" />
                  Popular TV Shows
                </span>
              }
              items={popularTvShowsData}
              viewAllLink={`/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.POPULAR}&itemType=${ITEM_TYPES_ENUM.TV}`}
            />
          )}

          {topRatedTvShowsData.length > 0 && (
            <MediaRow
              title={
                <span className="inline-flex items-center text-xl md:text-2xl font-bold">
                  <ThumbsUp className="mr-3 h-6 w-6 text-primary" />
                  Top Rated TV Shows
                </span>
              }
              items={topRatedTvShowsData}
              viewAllLink={`/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.TOP_RATED}&itemType=${ITEM_TYPES_ENUM.TV}`}
            />
          )}
        </Suspense>

        {/* REVERTED: Browse Button now uses Primary Theme Colors */}
        <div className="flex justify-center pt-8">
          <Link
            href="/browse"
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground text-lg font-medium rounded-full overflow-hidden transition-all shadow-md hover:shadow-xl active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5" />
              Browse Full Catalog
            </span>
            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}