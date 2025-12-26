// src/app/page.jsx
import { Suspense } from "react";
import Link from "next/link";
import MediaRow from "@/app/components/MediaRow";
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
  // 1. SEO FIX: Use "absolute" to fully control the homepage title.
  // This puts "Suhaeb" front and center in search results.
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
    description:
      "Your ultimate destination for movie and TV show discovery, built by Suhaeb Gamal.",
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
  twitter: {
    card: "summary_large_image",
    title: "Suhaeb's Movies Hub",
    description: "Discover movies and TV shows on Suhaeb's personal project.",
    images: ["https://movies.suhaeb.com/images/default-og.png"],
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
      getTrendingAllWeekForHome(12).catch((e) => {
        console.error("HomePage: Error fetching trending:", e.message);
        return [];
      }),
      getPopularMoviesForHome(12).catch((e) => {
        console.error("HomePage: Error fetching popular movies:", e.message);
        return [];
      }),
      getUpcomingMoviesForHome(12).catch((e) => {
        console.error("HomePage: Error fetching upcoming movies:", e.message);
        return [];
      }),
      getTopRatedMoviesForHome(12).catch((e) => {
        console.error("HomePage: Error fetching top rated movies:", e.message);
        return [];
      }),
      getPopularTvShowsForHome(12).catch((e) => {
        console.error("HomePage: Error fetching popular TV:", e.message);
        return [];
      }),
      getTopRatedTvShowsForHome(12).catch((e) => {
        console.error("HomePage: Error fetching top rated TV:", e.message);
        return [];
      }),
    ]);
  } catch (error) {
    console.error(
      "HomePage: Error fetching one or more page sections:",
      error.message
    );
    fetchError =
      "Could not load all content sections. Some data may be missing.";
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-2 sm:px-4 md:px-0 space-y-8 md:space-y-10">
      
      {/* 2. SEO FIX: Visible Header Section */}
      {/* This puts the keywords "Suhaeb" and "Movies Hub" directly in the DOM for Google to read. */}
      <section className="text-center space-y-4 py-6 md:py-10">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Suhaeb&apos;s Movies Hub
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          The ultimate personal database for trending movies and TV shows. 
          Designed and built by <span className="text-foreground font-semibold">Suhaeb Gamal</span> using Next.js.
        </p>
      </section>

      {fetchError && (
        <div className="text-center py-4 text-destructive bg-destructive/10 rounded-md">
          <p>{fetchError}</p>
        </div>
      )}
      
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center py-20 space-y-3 min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground text-lg">
              Loading content sections...
            </p>
          </div>
        }
      >
        {trendingItemsData.length > 0 && (
          <MediaRow
            title={
              <span className="inline-flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-primary/90" />
                Trending This Week
              </span>
            }
            items={trendingItemsData}
            viewAllLink={`/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.TRENDING_WEEK}`}
            isPriorityRow={true}
          />
        )}

        {popularMoviesData.length > 0 && (
          <MediaRow
            title={
              <span className="inline-flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-primary/90" />
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
              <span className="inline-flex items-center">
                <CalendarDays className="mr-2 h-6 w-6 text-primary/90" />
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
              <span className="inline-flex items-center">
                <ThumbsUp className="mr-2 h-6 w-6 text-primary/90" />
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
              <span className="inline-flex items-center">
                <TrendingUp className="mr-2 h-6 w-6 text-primary/90" />
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
              <span className="inline-flex items-center">
                <ThumbsUp className="mr-2 h-6 w-6 text-primary/90" />
                Top Rated TV Shows
              </span>
            }
            items={topRatedTvShowsData}
            viewAllLink={`/browse?listCategory=${HOME_PAGE_CATEGORY_SLUGS.TOP_RATED}&itemType=${ITEM_TYPES_ENUM.TV}`}
          />
        )}
      </Suspense>
      <div className="mt-10 mb-4 text-center">
        <Link
          href="/browse"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg shadow-md hover:bg-primary/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background active:bg-primary/80 active:scale-95 transition-all text-sm sm:text-base"
        >
          <LayoutGrid size={18} />
          Browse All & Filter
        </Link>
      </div>
    </div>
  );
}
