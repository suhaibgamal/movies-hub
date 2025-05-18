// src/app/tv/[id]/page.jsx

import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Suspense } from "react";
import { authOptions } from "@/app/api/auth/authOptions";
import {
  getCachedTvShowDetails,
  getCachedCredits,
  getCachedRecommendations,
} from "@/lib/tmdb";
import SkeletonLoader from "@/app/components/SkeletonLoader";
import InteractiveFeatures from "@/app/components/InteractiveFeatures";
import WatchlistButton from "@/app/components/WatchlistButton";
import TvSeasonsDisplay from "@/app/components/TvSeasonsDisplay";
import DetailItem from "@/app/components/DetailItem"; // <<< IMPORT SHARED COMPONENT
// Icons used in this page for DetailItem
import {
  CalendarDays,
  Tv as TvIcon,
  Info,
  Users,
  PlayCircle,
  Star as StarIcon,
  Film,
  ExternalLink as ExternalLinkIcon,
} from "lucide-react";

const BASE_URL_FOR_STATIC_PARAMS = "https://api.themoviedb.org/3";

export async function generateStaticParams() {
  try {
    const res = await fetch(
      `${BASE_URL_FOR_STATIC_PARAMS}/tv/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_KEY}&language=en-US&page=1`
    );
    if (!res.ok) {
      console.error(
        "Failed to fetch popular TV for static params:",
        res.status
      );
      return [];
    }
    const popular = await res.json();
    return (popular.results || [])
      .slice(0, 20)
      .map((series) => ({ id: series.id.toString() }));
  } catch (error) {
    console.error("Error in generateStaticParams for TV:", error);
    return [];
  }
}

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = params;
  try {
    const series = await getCachedTvShowDetails(id);
    if (!series || Object.keys(series).length === 0) {
      console.warn(`No series data found for metadata, ID: ${id}`);
      throw new Error("Series not found for metadata");
    }
    return {
      title: `${series.name || "TV Series"} - Movies Hub`,
      description:
        series.overview ||
        `Details about the TV series ${
          series.name || ""
        }, including seasons, episodes, cast, and ratings.`,
      alternates: {
        canonical: `https://movies.suhaeb.com/tv/${id}`,
      },
      openGraph: {
        title: `${series.name || "TV Series"} - Movies Hub`,
        description:
          series.overview ||
          `Detailed information about the TV series ${series.name || ""}.`,
        images: series.poster_path
          ? [`https://image.tmdb.org/t/p/w780${series.poster_path}`]
          : ["/images/default-og.png"],
        type: "video.tv_show",
      },
    };
  } catch (error) {
    console.error(`Error generating metadata for TV ID ${id}:`, error.message);
    return {
      title: "TV Series Not Found - Movies Hub",
      description: "Details for this TV series could not be loaded.",
    };
  }
}

export default async function TvShowPage({ params }) {
  const { id } = params;

  const session = await getServerSession(authOptions);
  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/tv/${id}`)}`);
  }

  if (!id || !/^\d+$/.test(id)) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-center text-xl font-semibold text-destructive">
          Invalid TV Series ID.
        </p>
      </main>
    );
  }

  try {
    const seriesData = await getCachedTvShowDetails(id); // Fetches details, videos, external_ids

    if (!seriesData || Object.keys(seriesData).length === 0) {
      console.error(
        `No data returned from getCachedTvShowDetails for TV show ID ${id}.`
      );
      throw new Error(
        `No data returned for TV show ID ${id}. It might not exist or TMDB fetch failed.`
      );
    }

    const [creditsData, recommendationsData] = await Promise.all([
      getCachedCredits(id, "tv"),
      getCachedRecommendations(id, "tv"),
    ]);

    // Use videos from seriesData as it's appended
    const trailerKey =
      seriesData.videos?.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube" && v.official
      )?.key ||
      seriesData.videos?.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      )?.key;

    const cast = creditsData.cast?.slice(0, 12) || [];
    const creators = seriesData.created_by || [];
    const firstAirYear = seriesData.first_air_date
      ? new Date(seriesData.first_air_date).getFullYear()
      : "N/A";
    const rating = seriesData.vote_average
      ? seriesData.vote_average.toFixed(1)
      : "N/A";
    const ratingColor =
      rating >= 7
        ? "bg-blue-600"
        : rating >= 5
        ? "bg-purple-600"
        : "bg-red-600";
    const genres =
      seriesData.genres?.map((genre) => genre.name).filter(Boolean) || [];
    const homepageLink = seriesData.homepage;
    const imdbId = seriesData.external_ids?.imdb_id;

    return (
      <div className="min-h-screen bg-background py-6 px-2 sm:px-4 lg:px-6">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<SkeletonLoader />}>
            <article className="flex flex-col rounded-xl bg-card shadow-xl lg:flex-row min-w-0 overflow-hidden">
              <div className="min-w-0 lg:w-[300px] xl:w-[380px] flex-shrink-0 bg-muted">
                <Image
                  unoptimized
                  src={
                    seriesData.poster_path
                      ? `https://image.tmdb.org/t/p/w780${seriesData.poster_path}`
                      : "/images/default.webp"
                  }
                  alt={`${seriesData.name || "Series"} poster`}
                  width={780}
                  height={1170}
                  className="aspect-[2/3] w-full object-cover lg:rounded-l-xl lg:rounded-r-none"
                  placeholder="blur"
                  blurDataURL="/images/default-blur.webp"
                  quality={80}
                  priority
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 300px, 380px"
                />
              </div>

              <div className="min-w-0 flex-1 p-4 py-5 sm:p-5 lg:p-6 flex flex-col">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div className="pr-10 flex-grow min-w-0">
                    <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl xl:text-4xl break-words leading-tight">
                      {seriesData.name}
                    </h1>
                    {seriesData.tagline && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        "{seriesData.tagline}"
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 z-10">
                    <WatchlistButton
                      item={{ ...seriesData, title: seriesData.name }}
                      itemType="TV"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 mt-1 mb-4 flex-wrap text-xs">
                  {parseFloat(rating) > 0 && (
                    <span
                      className={`${ratingColor} px-2 py-0.5 rounded-full font-bold text-white flex items-center gap-1`}
                    >
                      <StarIcon size={12} /> {rating}
                    </span>
                  )}
                  <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                    {firstAirYear}
                  </span>
                  {seriesData.number_of_seasons && (
                    <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                      {seriesData.number_of_seasons} Season
                      {seriesData.number_of_seasons !== 1 ? "s" : ""}
                    </span>
                  )}
                  {seriesData.type && (
                    <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-medium">
                      {seriesData.type}
                    </span>
                  )}
                  {genres.slice(0, 2).map((genre) => (
                    <span
                      key={genre}
                      className="text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full truncate"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <section className="mb-4 sm:mb-5">
                  <h2 className="mb-1.5 text-lg sm:text-xl font-semibold text-card-foreground">
                    Overview
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4 hover:line-clamp-none transition-all duration-300 ease-in-out">
                    {seriesData.overview ||
                      "No overview available for this series."}
                  </p>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm mb-4 sm:mb-5">
                  <DetailItem
                    icon={
                      <TvIcon
                        size={16}
                        className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                      />
                    }
                    label="Status"
                    value={seriesData.status}
                  />
                  {seriesData.number_of_episodes > 0 && (
                    <DetailItem
                      icon={
                        <CalendarDays
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Total Episodes"
                      value={seriesData.number_of_episodes}
                    />
                  )}
                  {seriesData.networks && seriesData.networks.length > 0 && (
                    <DetailItem
                      icon={
                        <Info
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Network"
                      value={seriesData.networks.map((n) => n.name).join(", ")}
                    />
                  )}
                  {creators.length > 0 && (
                    <DetailItem
                      icon={
                        <Users
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Created by"
                      value={creators.map((c) => c.name).join(", ")}
                    />
                  )}
                  {homepageLink && (
                    <DetailItem
                      icon={
                        <ExternalLinkIcon
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Homepage"
                      value={homepageLink}
                      isLink={true}
                    />
                  )}
                  {imdbId && (
                    <DetailItem
                      icon={
                        <Info
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="IMDb"
                      value={`https://www.imdb.com/title/${imdbId}`}
                      isLink={true}
                    />
                  )}
                  {seriesData.last_episode_to_air && (
                    <DetailItem
                      icon={
                        <PlayCircle
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Last Aired"
                      value={`${
                        seriesData.last_episode_to_air.name ||
                        "Episode " +
                          seriesData.last_episode_to_air.episode_number
                      } (S${seriesData.last_episode_to_air.season_number}E${
                        seriesData.last_episode_to_air.episode_number
                      }) - ${new Date(
                        seriesData.last_episode_to_air.air_date
                      ).toLocaleDateString()}`}
                    />
                  )}
                  {seriesData.next_episode_to_air && (
                    <DetailItem
                      icon={
                        <PlayCircle
                          size={16}
                          className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                        />
                      }
                      label="Next Episode"
                      value={`${
                        seriesData.next_episode_to_air.name ||
                        "Episode " +
                          seriesData.next_episode_to_air.episode_number
                      } (S${seriesData.next_episode_to_air.season_number}E${
                        seriesData.next_episode_to_air.episode_number
                      }) - ${new Date(
                        seriesData.next_episode_to_air.air_date
                      ).toLocaleDateString()}`}
                    />
                  )}
                </div>

                <TvSeasonsDisplay
                  seasons={seriesData.seasons}
                  seriesTmdbId={id}
                />

                <div className="pt-4 border-t border-border/30 mt-auto min-w-0">
                  <InteractiveFeatures
                    itemType="TV"
                    item={seriesData}
                    trailerKey={trailerKey}
                    cast={cast}
                    itemFound={true}
                    recommendations={recommendationsData}
                  />
                </div>
              </div>
            </article>
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error(
      `Error fetching TV show page (id: ${id}): ${error.message}`,
      error.stack
    );
    const errorQueryParam =
      error.message.includes("No data returned") ||
      error.message.includes("not found for metadata")
        ? `?error=tv_not_found&id=${id}`
        : "?error=tv_load_failed";
    redirect(`/not-found${errorQueryParam}`);
  }
}
