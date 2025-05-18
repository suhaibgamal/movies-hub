// src/app/components/TvSeasonsDisplay.jsx
"use client";

import { useState, useCallback, Fragment } from "react";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  PlayCircle,
  CalendarDays as CalendarIcon,
  MessageSquare as OverviewIcon,
  Tv as TvIcon,
  AlertTriangle,
} from "lucide-react";
// REMOVE: import { getCachedTvSeasonDetails } from "@/lib/tmdb"; // No longer directly called
import { fetchSeasonDetailsAction } from "@/app/actions/tvActions"; // <<< IMPORT SERVER ACTION
import WatchNowButton from "./WatchNowButton";

const EpisodeItem = ({ episode, seriesTmdbId, seasonNumber }) => (
  <div className="py-3 px-3.5 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
    <div className="flex justify-between items-start gap-2 sm:gap-3">
      <div className="flex-grow min-w-0">
        <h4 className="text-sm font-semibold text-card-foreground truncate">
          E{episode.episode_number}: {episode.name || "Untitled Episode"}
        </h4>
        {episode.air_date && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <CalendarIcon size={12} />{" "}
            {new Date(episode.air_date).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">
        <WatchNowButton
          itemId={seriesTmdbId}
          itemType="EPISODE"
          seasonNumber={seasonNumber}
          episodeNumber={episode.episode_number}
          itemAvailable={true}
          className="bg-primary/10 hover:bg-primary/20 text-primary dark:bg-primary/20 dark:hover:bg-primary/30 dark:text-primary-foreground/80 px-2 py-1 sm:px-2.5 sm:py-1 rounded-md text-xs"
          buttonText={`Watch S${seasonNumber}E${episode.episode_number}`} // More descriptive
        />
      </div>
    </div>
    {episode.overview && (
      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 flex items-start gap-1.5 pt-1.5 border-t border-border/10 dark:border-border/20">
        <OverviewIcon size={12} className="mt-0.5 flex-shrink-0 opacity-70" />{" "}
        <span>{episode.overview}</span>
      </p>
    )}
  </div>
);

const SeasonAccordionItem = ({ season, seriesTmdbId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [episodes, setEpisodes] = useState(season.episodes || []); // Use pre-loaded if TMDB season summary includes them
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);
  const [error, setError] = useState(null);

  const toggleAndFetchEpisodes = useCallback(async () => {
    const shouldOpen = !isOpen;
    setIsOpen(shouldOpen);

    // Fetch only if opening and episodes are not already loaded for this season.
    if (shouldOpen && episodes.length === 0) {
      setIsLoadingEpisodes(true);
      setError(null);

      // Call the Server Action
      const result = await fetchSeasonDetailsAction(
        seriesTmdbId,
        season.season_number
      );

      if (result.data && result.data.episodes) {
        setEpisodes(result.data.episodes);
      } else {
        setError(result.error || "Could not load episodes for this season.");
        setEpisodes([]); // Clear episodes on error
      }
      setIsLoadingEpisodes(false);
    }
  }, [seriesTmdbId, season.season_number, episodes.length, isOpen]); // isOpen is important here

  const AccordionIcon = isOpen ? ChevronDown : ChevronRight;

  return (
    <div className="bg-muted/40 dark:bg-muted/20 rounded-lg border border-border/30 dark:border-border/40 overflow-hidden">
      <button
        onClick={toggleAndFetchEpisodes}
        className="flex items-center justify-between w-full p-3 sm:p-4 text-left hover:bg-primary/5 dark:hover:bg-primary/10 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-colors"
        aria-expanded={isOpen}
        aria-controls={`season-${season.season_number}-content`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {season.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w92${season.poster_path}`}
              alt={`${season.name || `Season ${season.season_number}`} poster`}
              width={40}
              height={60}
              className="rounded object-cover aspect-[2/3] flex-shrink-0"
              unoptimized
            />
          ) : (
            <div className="w-10 h-[60px] bg-card/50 dark:bg-background/30 rounded flex items-center justify-center text-muted-foreground flex-shrink-0">
              <TvIcon size={20} />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-card-foreground truncate">
              {season.name || `Season ${season.season_number}`}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {season.episode_count
                ? `${season.episode_count} episodes`
                : "Episode count unavailable"}
              {season.air_date &&
                ` • Aired ${new Date(season.air_date).toLocaleDateString(
                  "en-US",
                  { year: "numeric", month: "short", day: "numeric" }
                )}`}
            </p>
          </div>
        </div>
        <AccordionIcon
          size={20}
          className="text-muted-foreground ml-2 flex-shrink-0"
        />
      </button>

      {isOpen && (
        <div
          id={`season-${season.season_number}-content`}
          className="bg-card/60 dark:bg-background/40 border-t border-border/30 dark:border-border/40"
        >
          {isLoadingEpisodes && (
            <div className="p-4 text-center text-sm text-muted-foreground animate-pulse">
              Loading episodes...
            </div>
          )}
          {error && (
            <div className="p-4 text-center text-sm text-destructive flex items-center justify-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}
          {!isLoadingEpisodes && !error && episodes.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No episodes currently available for this season.
            </div>
          )}
          {!isLoadingEpisodes && !error && episodes.length > 0 && (
            <div className="divide-y divide-border/20 dark:divide-border/30">
              {episodes.map((episode) => (
                <EpisodeItem
                  key={episode.id}
                  episode={episode}
                  seriesTmdbId={seriesTmdbId}
                  seasonNumber={season.season_number}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function TvSeasonsDisplay({ seasons, seriesTmdbId }) {
  if (!seasons || seasons.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4 text-center">
        Season information is not available for this series.
      </p>
    );
  }

  const displaySeasons = seasons
    .filter((season) => season.season_number > 0)
    .sort((a, b) => a.season_number - b.season_number);

  if (displaySeasons.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4 text-center">
        No regular seasons found.
      </p>
    );
  }

  return (
    <section className="mb-6 sm:mb-8">
      <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-semibold text-card-foreground">
        Seasons
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {displaySeasons.map((season) => (
          <SeasonAccordionItem
            key={season.id || season.season_number}
            season={season}
            seriesTmdbId={seriesTmdbId}
          />
        ))}
      </div>
    </section>
  );
}
