// src/app/tv/[id]/page.jsx
import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation"; // Import notFound
import {
  getCachedTvShowDetails,
  getCachedCredits,
  getCachedRecommendations,
  // checkLinkStability might be useful here too if you have a general "Watch Series" button
} from "@/lib/tmdb";
import SkeletonLoader from "@/app/components/SkeletonLoader";
import InteractiveFeatures from "@/app/components/InteractiveFeatures";
import WatchlistButton from "@/app/components/WatchlistButton";
import TvSeasonsDisplay from "@/app/components/TvSeasonsDisplay";
import DetailItem from "@/app/components/DetailItem";
import {
  CalendarDays,
  Tv as TvIconProp, // Renamed to avoid conflict with TvIcon component
  Info,
  Users,
  PlayCircle,
  Star as StarIcon,
  // Film, // Not typically needed for TV page
  ExternalLink as ExternalLinkIcon,
} from "lucide-react";

const BASE_URL_FOR_STATIC_PARAMS = "https://api.themoviedb.org/3";

// Function to generate TVSeries JSON-LD structured data
function generateTvSeriesStructuredData(
  seriesData,
  canonicalUrl,
  cast,
  creators
) {
  const TEST_ID_FOR_MINIMAL_SCHEMA = "86831"; // Or your current test ID

  if (
    seriesData &&
    seriesData.id &&
    seriesData.id.toString() === TEST_ID_FOR_MINIMAL_SCHEMA
  ) {
    console.log(
      `SITEMAP DEBUG: Generating SLIGHTLY EXPANDED MINIMAL TVSeries schema for ID ${TEST_ID_FOR_MINIMAL_SCHEMA}`
    );
    const minimalStructuredData = {
      "@context": "https://schema.org",
      "@type": "TVSeries",
      name:
        seriesData.name ||
        `Test TV Series Name for ${TEST_ID_FOR_MINIMAL_SCHEMA}`,
      url: canonicalUrl,
      // ADDING BACK DESCRIPTION AND IMAGE
      description:
        seriesData.overview ||
        `A brief description for ${
          seriesData.name || TEST_ID_FOR_MINIMAL_SCHEMA
        }.`,
      image: seriesData.poster_path
        ? `https://image.tmdb.org/t/p/original${seriesData.poster_path}`
        : undefined,
    };
    // Remove undefined fields
    Object.keys(minimalStructuredData).forEach((key) => {
      if (minimalStructuredData[key] === undefined) {
        delete minimalStructuredData[key];
      }
    });
    return minimalStructuredData;
  }

  // ... (Your original comprehensive structured data for all other TV shows remains here) ...
  // (Make sure the rest of the function with your full schema is still present below this if block)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: seriesData.name,
    description: seriesData.overview,
    datePublished: seriesData.first_air_date,
    url: canonicalUrl,
    image: seriesData.poster_path
      ? `https://image.tmdb.org/t/p/original${seriesData.poster_path}`
      : undefined,
  };
  if (creators && creators.length > 0) {
    structuredData.creator = creators.map((c) => ({
      "@type": "Person",
      name: c.name,
    }));
  }
  if (cast && cast.length > 0) {
    structuredData.actor = cast
      .slice(0, 5)
      .map((a) => ({ "@type": "Person", name: a.name }));
  }
  if (seriesData.genres && seriesData.genres.length > 0) {
    structuredData.genre = seriesData.genres.map((g) => g.name);
  }
  if (seriesData.vote_average && seriesData.vote_count) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: seriesData.vote_average.toFixed(1),
      bestRating: "10",
      ratingCount: seriesData.vote_count,
    };
  }
  if (typeof seriesData.number_of_seasons === "number") {
    structuredData.numberOfSeasons = seriesData.number_of_seasons;
  }
  if (typeof seriesData.number_of_episodes === "number") {
    structuredData.numberOfEpisodes = seriesData.number_of_episodes;
  }
  if (seriesData.seasons && seriesData.seasons.length > 0) {
    structuredData.containsSeason = seriesData.seasons
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        "@type": "TVSeason",
        name: s.name || `Season ${s.season_number}`,
        seasonNumber: s.season_number,
        numberOfEpisodes: s.episode_count,
        datePublished: s.air_date,
      }));
  }
  if (seriesData.external_ids?.imdb_id) {
    structuredData.sameAs = `https://www.imdb.com/title/${seriesData.external_ids.imdb_id}`;
  }

  Object.keys(structuredData).forEach((key) => {
    if (
      structuredData[key] === undefined ||
      (Array.isArray(structuredData[key]) && structuredData[key].length === 0)
    ) {
      delete structuredData[key];
    }
  });
  if (
    structuredData.containsSeason &&
    structuredData.containsSeason.length === 0
  ) {
    delete structuredData.containsSeason;
  }
  return structuredData;
}

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { id } = params;
  const canonicalUrl = `https://movies.suhaeb.com/tv/${id}`;
  try {
    const series = await getCachedTvShowDetails(id);
    if (!series || Object.keys(series).length === 0) {
      console.warn(`No series data found for metadata, ID: ${id}`);
      throw new Error("Series not found for metadata");
    }
    const title = `${series.name || "TV Series"} - Movies Hub`;
    const description =
      series.overview ||
      `Details about the TV series ${
        series.name || ""
      }, including seasons, episodes, cast, and ratings.`;
    const imageUrl = series.poster_path
      ? `https://image.tmdb.org/t/p/w780${series.poster_path}`
      : "https://movies.suhaeb.com/images/default-og.png";
    return {
      title: title,
      description: description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: title,
        description: description,
        url: canonicalUrl,
        images: [
          {
            url: imageUrl,
            width: 780,
            height: 1170,
            alt: `${series.name || "TV Series"} Poster`,
          },
        ],
        type: "video.tv_show",
      },
      twitter: {
        card: "summary_large_image",
        title: title,
        description: description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    console.error(`Error generating metadata for TV ID ${id}:`, error.message);
    return {
      title: "TV Series Not Found - Movies Hub",
      description: "Details for this TV series could not be loaded.",
      alternates: { canonical: canonicalUrl },
    };
  }
}

export default async function TvShowPage({ params }) {
  const { id } = params;
  const canonicalUrl = `https://movies.suhaeb.com/tv/${id}`;
  // const session = await getServerSession(authOptions); // Fetched but not used to gate content

  if (!id || !/^\d+$/.test(id)) {
    notFound();
  }

  try {
    const seriesData = await getCachedTvShowDetails(id);
    if (!seriesData || Object.keys(seriesData).length === 0) {
      console.warn(
        `No data returned for TV show ID ${id}. It might not exist or TMDB fetch failed.`
      );
      notFound();
    }

    const [creditsData, recommendationsData] = await Promise.all([
      getCachedCredits(id, "tv"),
      getCachedRecommendations(id, "tv"),
      // Potentially add checkLinkStability(id, "tv") if you have a generic "Watch Series" button
    ]);

    const trailerKey =
      seriesData.videos?.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube" && v.official
      )?.key ||
      seriesData.videos?.results?.find(
        (v) => v.type === "Trailer" && v.site === "YouTube"
      )?.key;

    const cast = creditsData.cast?.slice(0, 10) || [];
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

    const tvSeriesStructuredData = generateTvSeriesStructuredData(
      seriesData,
      canonicalUrl,
      cast,
      creators
    );

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(tvSeriesStructuredData),
          }}
        />
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
                        <TvIconProp // Using the renamed import
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
                        value={seriesData.networks
                          .map((n) => n.name)
                          .join(", ")}
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
                    {seriesData.first_air_date && (
                      <DetailItem
                        icon={
                          <CalendarDays
                            size={16}
                            className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                          />
                        }
                        label="First Aired"
                        value={new Date(
                          seriesData.first_air_date
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      />
                    )}
                    {seriesData.last_air_date && (
                      <DetailItem
                        icon={
                          <CalendarDays
                            size={16}
                            className="text-primary mt-0.5 sm:mt-1 flex-shrink-0 opacity-80"
                          />
                        }
                        label="Last Aired"
                        value={new Date(
                          seriesData.last_air_date
                        ).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
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
                        label="Last Episode"
                        value={`${
                          seriesData.last_episode_to_air.name ||
                          "Ep. " + seriesData.last_episode_to_air.episode_number
                        } (S${seriesData.last_episode_to_air.season_number}E${
                          seriesData.last_episode_to_air.episode_number
                        })`}
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
                          "Ep. " + seriesData.next_episode_to_air.episode_number
                        } (S${seriesData.next_episode_to_air.season_number}E${
                          seriesData.next_episode_to_air.episode_number
                        }) - Airs: ${new Date(
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
                      itemFound={true} // Assuming TV series link is generally findable via vidsrc
                      recommendations={recommendationsData}
                    />
                  </div>
                </div>
              </article>
            </Suspense>
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error(`TvShowPage Error (id: ${id}): ${error.message}`);
    notFound();
  }
}
