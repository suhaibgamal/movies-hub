// src/app/components/MoviesListClient.jsx
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMoviesListContext } from "@/app/context/MoviesListContext";
import MoviesGrid from "@/app/components/MoviesGrid";
import { GENRES, TV_GENRES } from "@/lib/constants";
import {
  SearchX,
  ListFilter,
  XCircle,
  Film,
  Tv,
  ChevronDown,
  Star,
  CalendarDays,
  TrendingUp,
  ThumbsUp,
  Search as SearchIcon,
} from "lucide-react";
import GridCardSkeleton from "@/app/components/GridCardSkeleton";

// --- Constants ---
const RATING_OPTIONS = {
  All: { value: "All", min: 0, max: 10.1, label: "Any Rating", icon: Star },
  Recommended: {
    value: "Recommended",
    min: 9,
    max: 10.1,
    label: "Recommended",
    shortLabel: "9+",
    icon: ThumbsUp,
  },
  Good: {
    value: "Good",
    min: 7,
    max: 9,
    label: "Good",
    shortLabel: "7-8.9",
    icon: Star,
  },
  Ok: {
    value: "Ok",
    min: 5,
    max: 7,
    label: "Okay",
    shortLabel: "5-6.9",
    icon: Star,
  },
  Bad: {
    value: "Bad",
    min: 0,
    max: 5,
    label: "Bad",
    shortLabel: "<5",
    icon: Star,
  },
};

const YEAR_GROUPS = [
  { value: "All", label: "All Years", icon: CalendarDays },
  {
    value: "2020-2025",
    label: "2020-2025",
    from: "2020-01-01",
    to: "2025-12-31",
    icon: CalendarDays,
  },
  {
    value: "2010-2019",
    label: "2010-2019",
    from: "2010-01-01",
    to: "2019-12-31",
    icon: CalendarDays,
  },
  {
    value: "2000-2009",
    label: "2000-2009",
    from: "2000-01-01",
    to: "2009-12-31",
    icon: CalendarDays,
  },
  {
    value: "1990-1999",
    label: "1990-1999",
    from: "1990-01-01",
    to: "1999-12-31",
    icon: CalendarDays,
  },
  {
    value: "1980-1989",
    label: "1980-1989",
    from: "1980-01-01",
    to: "1989-12-31",
    icon: CalendarDays,
  },
  {
    value: "1970-1979",
    label: "1970-1979",
    from: "1970-01-01",
    to: "1979-12-31",
    icon: CalendarDays,
  },
];

const BLOCKLIST = [
  "porn",
  "adult",
  "xxx",
  "explicit",
  "sex",
  "erotic",
  "incest",
  "nude",
  "nudity",
  "naked",
  "erotica",
  "hentai",
  "bdsm",
  "fetish",
  "hardcore",
  "masturbation",
  "orgy",
  "swinger",
  "stripper",
  "stripping",
  "dildo",
  "vibrator",
  "anal",
  "cum",
  "masturbate",
  "pornographic",
  "obscene",
  "x-rated",
  "smut",
  "sexploitation",
  "boobs",
  "ass",
  "breasts",
  "cleavage",
  "jerk",
  "dick",
  "cock",
  "pussy",
  "tits",
  "sexy",
  "kink",
  "orgasm",
  "cunnilingus",
  "fellatio",
  "penis",
  "vagina",
  "clitoris",
  "sperm",
  "ejaculation",
  "fuck",
];

const USER_SELECTABLE_ITEM_TYPES = { MOVIE: "MOVIE", TV: "TV" };
const DEFAULT_USER_ITEM_TYPE = USER_SELECTABLE_ITEM_TYPES.MOVIE;

const API_ITEM_TYPES = { ALL: "ALL", ...USER_SELECTABLE_ITEM_TYPES };

const CATEGORY_OPTIONS_CONFIG = {
  discover: {
    value: "discover",
    label: "Discover",
    icon: ListFilter,
    defaultSort: "popularity.desc",
    allowsSecondaryFiltersInAPI: true,
    disablesSearch: false,
  },
  popular: {
    value: "popular",
    label: "Popular",
    icon: TrendingUp,
    defaultSort: "popularity.desc",
    apiPathMovie: "movie/popular",
    apiPathTv: "tv/popular",
    disablesSearch: true,
    allowsSecondaryFiltersInAPI: false,
  },
  top_rated: {
    value: "top_rated",
    label: "Top Rated",
    icon: ThumbsUp,
    defaultSort: "vote_average.desc",
    apiPathMovie: "movie/top_rated",
    apiPathTv: "tv/top_rated",
    disablesSearch: true,
    allowsSecondaryFiltersInAPI: false,
  },
  upcoming: {
    value: "upcoming",
    label: "Upcoming",
    icon: CalendarDays,
    apiPathMovie: "movie/upcoming",
    itemTypeLock: API_ITEM_TYPES.MOVIE,
    defaultSort: "primary_release_date.asc",
    disablesYearFilter: true,
    disablesGenreFilter: true,
    disablesRatingFilter: true,
    disablesSearch: true,
    allowsSecondaryFiltersInAPI: false,
  },
  trending_week: {
    value: "trending_week",
    label: "Trending",
    subLabel: "(This Week)",
    icon: TrendingUp,
    apiPathAll: "trending/all/week",
    defaultSort: "popularity.desc",
    disablesSearch: true,
    allowsSecondaryFiltersInAPI: false,
  },
};
const DEFAULT_CATEGORY_VALUE = CATEGORY_OPTIONS_CONFIG.discover.value;

const MAX_AUTO_FETCH_ATTEMPTS = 3;
const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_API_URL = "https://api.themoviedb.org/3/";

const ToggleButton = ({
  label,
  icon: Icon,
  isActive,
  onClick,
  value,
  disabled,
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={isActive}
    onClick={() => onClick(value)}
    disabled={disabled}
    className={`
      flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-150 ease-in-out
      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-muted dark:disabled:hover:bg-card/50
      ${
        isActive
          ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          : "bg-card text-muted-foreground hover:bg-muted/80 dark:hover:bg-muted/50"
      }
    `}
  >
    {Icon && <Icon size={14} className="shrink-0" />}
    <span className="truncate">{label}</span>
  </button>
);

export default function MoviesListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { moviesState, setMoviesState } = useMoviesListContext();

  const [selectedUserItemType, setSelectedUserItemType] = useState(() => {
    const urlItemType = searchParams.get("itemType")?.toUpperCase();
    if (urlItemType && USER_SELECTABLE_ITEM_TYPES[urlItemType])
      return urlItemType;
    const urlListCategory = searchParams.get("listCategory");
    const categoryDef = urlListCategory
      ? CATEGORY_OPTIONS_CONFIG[urlListCategory]
      : null;
    if (categoryDef?.itemTypeLock) return categoryDef.itemTypeLock;
    return moviesState.selectedUserItemType || DEFAULT_USER_ITEM_TYPE;
  });

  const [selectedListCategory, setSelectedListCategory] = useState(
    () =>
      searchParams.get("listCategory") ||
      moviesState.selectedListCategory ||
      DEFAULT_CATEGORY_VALUE
  );
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("search") || ""
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedGenre, setSelectedGenre] = useState(
    () => searchParams.get("genre") || "All"
  );
  const [selectedRating, setSelectedRating] = useState(
    () => searchParams.get("rating") || RATING_OPTIONS.All.value
  );
  const [selectedYear, setSelectedYear] = useState(
    () => searchParams.get("year") || "All"
  );

  const [apiFetchedItems, setApiFetchedItems] = useState([]);
  const [displayItems, setDisplayItems] = useState([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [currentDisplayTitle, setCurrentDisplayTitle] = useState(<> </>);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [autoFetchState, setAutoFetchState] = useState({
    isActive: false,
    attemptsDone: 0,
  });
  const isMounted = useRef(false);
  const previousPrimaryFiltersKey = useRef(null);
  const isLoadingFetchRef = useRef(false); // <--- Fix: Ref to track fetch status

  // --- Derived States ---
  const isSearching = useMemo(
    () => !!debouncedSearchTerm,
    [debouncedSearchTerm]
  );
  const activeCategoryDef = useMemo(
    () =>
      CATEGORY_OPTIONS_CONFIG[selectedListCategory] ||
      CATEGORY_OPTIONS_CONFIG.discover,
    [selectedListCategory]
  );
  const activeApiItemType = useMemo(() => {
    if (isSearching) return selectedUserItemType;
    if (activeCategoryDef?.itemTypeLock) return activeCategoryDef.itemTypeLock;
    if (
      activeCategoryDef?.value === CATEGORY_OPTIONS_CONFIG.trending_week.value
    )
      return API_ITEM_TYPES.ALL;
    return selectedUserItemType;
  }, [activeCategoryDef, selectedUserItemType, isSearching]);

  const isSearchInputDisabled = useMemo(() => {
    if (isSearching) return false;
    return !!activeCategoryDef?.disablesSearch;
  }, [isSearching, activeCategoryDef]);
  const isGenreFilterDisabled = useMemo(() => {
    if (isSearching) return false;
    return !!activeCategoryDef?.disablesGenreFilter;
  }, [isSearching, activeCategoryDef]);
  const isRatingFilterDisabled = useMemo(() => {
    if (isSearching) return false;
    return !!activeCategoryDef?.disablesRatingFilter;
  }, [isSearching, activeCategoryDef]);
  const isYearFilterDisabled = useMemo(() => {
    if (isSearching) return false;
    return !!activeCategoryDef?.disablesYearFilter;
  }, [isSearching, activeCategoryDef]);

  const currentGenresForFilterDropdown = useMemo(() => {
    let typeForDeterminingGenres = selectedUserItemType;
    if (!isSearching && activeCategoryDef?.itemTypeLock)
      typeForDeterminingGenres = activeCategoryDef.itemTypeLock;
    else if (isSearching) typeForDeterminingGenres = selectedUserItemType;
    else if (
      activeCategoryDef?.value === CATEGORY_OPTIONS_CONFIG.trending_week.value
    )
      typeForDeterminingGenres = selectedUserItemType; // Use toggle for trending all
    if (typeForDeterminingGenres === USER_SELECTABLE_ITEM_TYPES.MOVIE)
      return GENRES;
    if (typeForDeterminingGenres === USER_SELECTABLE_ITEM_TYPES.TV)
      return TV_GENRES;
    return {}; // Should not happen if type is locked or user selected
  }, [selectedUserItemType, activeCategoryDef, isSearching]);

  const primaryFiltersKey = useMemo(
    () =>
      JSON.stringify(
        (() => {
          const baseKey = {
            search: debouncedSearchTerm,
            listCategory: isSearching ? "" : selectedListCategory,
            itemTypeForAPI: activeApiItemType, // This determines the API endpoint
          };
          if (
            !isSearching &&
            selectedListCategory === CATEGORY_OPTIONS_CONFIG.discover.value &&
            activeCategoryDef.allowsSecondaryFiltersInAPI
          ) {
            baseKey.genre = selectedGenre;
            baseKey.rating = selectedRating;
            baseKey.year = selectedYear;
          }
          return baseKey;
        })()
      ),
    [
      isSearching,
      selectedListCategory,
      activeApiItemType,
      debouncedSearchTerm,
      activeCategoryDef, // activeCategoryDef depends on selectedListCategory
      selectedGenre,
      selectedRating,
      selectedYear,
    ]
  );

  const normalizeItemData = useCallback((item, fetchedItemTypeOverride) => {
    const mediaType = item.media_type || fetchedItemTypeOverride;
    if (
      !item ||
      typeof item.id === "undefined" ||
      !mediaType ||
      (mediaType !== "movie" && mediaType !== "tv")
    )
      return null;
    const normalizedId = Number(item.id);
    const voteAverage =
      typeof item.vote_average === "number"
        ? Number(item.vote_average.toFixed(1))
        : 0;
    return {
      ...item,
      id: normalizedId,
      media_type: mediaType,
      displayTitle: mediaType === "movie" ? item.title : item.name,
      displayDate:
        mediaType === "movie" ? item.release_date : item.first_air_date,
      vote_average: voteAverage,
      genre_ids: item.genre_ids || [],
      adult: item.adult === true, // Ensure it's a boolean
    };
  }, []);

  const filterBlockedContent = useCallback((rawItems) => {
    if (!Array.isArray(rawItems)) return [];
    return rawItems.filter((item) => {
      if (!item) return false; // Should have been filtered by normalizeItemData
      const title = (item.displayTitle || "").toLowerCase();
      const overview = (item.overview || "").toLowerCase();
      return !BLOCKLIST.some(
        (keyword) => title.includes(keyword) || overview.includes(keyword)
      );
    });
  }, []); // BLOCKLIST is constant

  const fetchItems = useCallback(
    async (pageToFetch, isNewPrimaryFilterSet) => {
      // Guard against re-entrant pagination calls if a fetch is already in progress
      if (
        !isNewPrimaryFilterSet &&
        pageToFetch > 1 &&
        isLoadingFetchRef.current
      ) {
        return;
      }

      isLoadingFetchRef.current = true;
      setIsLoading(true);
      if (isNewPrimaryFilterSet) setError(null);

      let endpoint = "";
      let apiParams = new URLSearchParams({
        api_key: API_KEY,
        page: pageToFetch.toString(),
        language: "en-US",
        include_adult: "false", // Explicitly false
      });
      let effectiveItemTypeForNormalization = activeApiItemType; // Used to help normalizeItemData
      let titleForDisplay = "";
      let TitleIcon = ListFilter;
      const currentCategoryDef =
        CATEGORY_OPTIONS_CONFIG[selectedListCategory] ||
        CATEGORY_OPTIONS_CONFIG.discover;

      if (isSearching) {
        titleForDisplay = `"${debouncedSearchTerm}"`;
        TitleIcon = SearchIcon;
        endpoint = "search/";
        if (activeApiItemType === API_ITEM_TYPES.MOVIE) endpoint += "movie";
        else if (activeApiItemType === API_ITEM_TYPES.TV) endpoint += "tv";
        else {
          // This case should ideally not be hit if search locks itemType to MOVIE/TV
          // Or if 'ALL' for search implies 'multi' endpoint
          endpoint += "multi";
          effectiveItemTypeForNormalization = API_ITEM_TYPES.ALL; // Search multi gives mixed types
        }
        apiParams.append("query", debouncedSearchTerm);
      } else {
        // Category-based Browse
        titleForDisplay = currentCategoryDef.label;
        if (currentCategoryDef.subLabel)
          titleForDisplay += ` ${currentCategoryDef.subLabel}`;
        TitleIcon = currentCategoryDef.icon || ListFilter;

        if (
          currentCategoryDef.value === CATEGORY_OPTIONS_CONFIG.discover.value
        ) {
          endpoint =
            activeApiItemType === API_ITEM_TYPES.TV // discover is always type-specific
              ? "discover/tv"
              : "discover/movie";
          titleForDisplay += ` ${
            activeApiItemType === API_ITEM_TYPES.MOVIE ? "Movies" : "TV Shows"
          }`;
          // Add common discover parameters
          apiParams.append("certification_country", "US"); // Example: Filter by US certs
          apiParams.append("certification.lte", "NC-17"); // Max cert

          if (
            selectedGenre !== "All" &&
            !isGenreFilterDisabled && // This check might be redundant if discover always allows
            currentGenresForFilterDropdown[selectedGenre] // Ensure genre is valid for type
          )
            apiParams.append("with_genres", selectedGenre);

          if (
            selectedRating !== RATING_OPTIONS.All.value &&
            !isRatingFilterDisabled
          ) {
            const ratingOpt =
              Object.values(RATING_OPTIONS).find(
                (opt) => opt.value === selectedRating
              ) || RATING_OPTIONS.All;
            apiParams.append("vote_average.gte", ratingOpt.min.toString());
            if (ratingOpt.max < 10.1)
              // Max 10, but API uses lte
              apiParams.append("vote_average.lte", ratingOpt.max.toString());
          }
          if (selectedYear !== "All" && !isYearFilterDisabled) {
            const yearGroup = YEAR_GROUPS.find((g) => g.value === selectedYear);
            if (yearGroup?.from && yearGroup?.to) {
              const dateGteKey =
                activeApiItemType === API_ITEM_TYPES.TV
                  ? "first_air_date.gte"
                  : "primary_release_date.gte";
              const dateLteKey =
                activeApiItemType === API_ITEM_TYPES.TV
                  ? "first_air_date.lte"
                  : "primary_release_date.lte";
              apiParams.append(dateGteKey, yearGroup.from);
              apiParams.append(dateLteKey, yearGroup.to);
            }
          }
          apiParams.append("sort_by", currentCategoryDef.defaultSort); // Default sort for discover
        } else {
          // Pre-defined categories like popular, top_rated, upcoming, trending
          if (currentCategoryDef.apiPathAll) {
            endpoint = currentCategoryDef.apiPathAll;
            effectiveItemTypeForNormalization = API_ITEM_TYPES.ALL; // e.g., trending/all/week
            // Add type to title if user has selected a specific type for trending
            if (
              selectedUserItemType !== API_ITEM_TYPES.ALL && // User has toggled to Movie or TV
              currentCategoryDef.value ===
                CATEGORY_OPTIONS_CONFIG.trending_week.value
            ) {
              titleForDisplay += ` (${
                selectedUserItemType === USER_SELECTABLE_ITEM_TYPES.MOVIE
                  ? "Movies"
                  : "TV Shows"
              })`;
            }
          } else if (
            activeApiItemType === API_ITEM_TYPES.MOVIE &&
            currentCategoryDef.apiPathMovie
          ) {
            endpoint = currentCategoryDef.apiPathMovie;
            titleForDisplay += " Movies";
          } else if (
            activeApiItemType === API_ITEM_TYPES.TV &&
            currentCategoryDef.apiPathTv
          ) {
            endpoint = currentCategoryDef.apiPathTv;
            titleForDisplay += " TV Shows";
          }
          // else if no path, endpoint remains empty, will be handled

          if (currentCategoryDef.defaultSort)
            apiParams.append("sort_by", currentCategoryDef.defaultSort);
        }
      }
      setCurrentDisplayTitle(
        <>
          <TitleIcon size={26} className="inline mr-2 opacity-90" />{" "}
          {titleForDisplay}
        </>
      );

      if (!endpoint) {
        // console.warn("No API endpoint determined for current filters.");
        setApiFetchedItems([]); // Clear items if no endpoint
        setHasMore(false);
        setIsLoading(false);
        isLoadingFetchRef.current = false;
        return;
      }

      try {
        const res = await fetch(
          `${BASE_API_URL}${endpoint}?${apiParams.toString()}`
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.status_message || `API Error ${res.status}`);

        const normalizedNewItems = (data.results || [])
          .map((item) =>
            normalizeItemData(
              item,
              effectiveItemTypeForNormalization === API_ITEM_TYPES.ALL
                ? null // Let normalizeItemData use item.media_type
                : effectiveItemTypeForNormalization.toLowerCase() // movie or tv
            )
          )
          .filter((item) => item && item.adult !== true) // Ensure adult items are filtered
          .filter(Boolean); // Remove any nulls from normalization

        setApiFetchedItems((prev) => {
          const combined =
            isNewPrimaryFilterSet || pageToFetch === 1
              ? normalizedNewItems // Replace for new search/filter or first page
              : [...prev, ...normalizedNewItems]; // Append for pagination
          // Deduplicate
          const uniqueKeys = new Set();
          return combined.filter((item) => {
            const key = `${item.media_type}-${item.id}`; // Unique key by type and ID
            if (!uniqueKeys.has(key)) {
              uniqueKeys.add(key);
              return true;
            }
            return false;
          });
        });
        setHasMore(
          pageToFetch < (data.total_pages || 0) && normalizedNewItems.length > 0
        );
        if (isNewPrimaryFilterSet || pageToFetch === 1)
          previousPrimaryFiltersKey.current = primaryFiltersKey;

        if (
          pageToFetch === 1 &&
          (isNewPrimaryFilterSet || !initialLoadComplete) // Reading initialLoadComplete from closure
        ) {
          setInitialLoadComplete(true);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        setError(err.message || "Failed to load data.");
        setHasMore(false);
      } finally {
        isLoadingFetchRef.current = false;
        setIsLoading(false);
      }
    },
    [
      selectedListCategory,
      activeApiItemType,
      debouncedSearchTerm,
      isSearching,
      selectedGenre,
      selectedRating,
      selectedYear,
      normalizeItemData,
      primaryFiltersKey,
      currentGenresForFilterDropdown,
      selectedUserItemType,
      isGenreFilterDisabled,
      isRatingFilterDisabled,
      isYearFilterDisabled,
      activeCategoryDef,
      // API_KEY, BASE_API_URL, etc. are constants from outer scope
      // State setters (setIsLoading, setError, etc.) are stable
      // initialLoadComplete (state) is read from closure, not listed as dep
      setCurrentDisplayTitle,
      setApiFetchedItems,
      setHasMore,
      setError,
      setInitialLoadComplete, // these are stable setters
    ]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm)
        setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (isSearching) {
      newParams.set("search", debouncedSearchTerm);
      // For search, always include item type if not default, and secondary filters
      if (selectedUserItemType !== DEFAULT_USER_ITEM_TYPE)
        newParams.set("itemType", selectedUserItemType);
      if (selectedGenre !== "All") newParams.set("genre", selectedGenre);
      if (selectedRating !== RATING_OPTIONS.All.value)
        newParams.set("rating", selectedRating);
      if (selectedYear !== "All") newParams.set("year", selectedYear);
    } else {
      // For category Browse
      if (
        selectedListCategory &&
        selectedListCategory !== DEFAULT_CATEGORY_VALUE
      )
        newParams.set("listCategory", selectedListCategory);

      const categoryDef = CATEGORY_OPTIONS_CONFIG[selectedListCategory];
      const typeForURL = categoryDef?.itemTypeLock || selectedUserItemType;
      if (typeForURL !== DEFAULT_USER_ITEM_TYPE)
        newParams.set("itemType", typeForURL);

      // Only add secondary filters to URL if category allows them OR if it's discover
      // or if there's no item type lock (implying user can filter further)
      if (
        (categoryDef && categoryDef.allowsSecondaryFiltersInAPI) || // Discover allows
        !categoryDef?.itemTypeLock // If not locked, user choice for secondary filters is relevant
      ) {
        if (selectedGenre !== "All" && !isGenreFilterDisabled)
          newParams.set("genre", selectedGenre);
        if (
          selectedRating !== RATING_OPTIONS.All.value &&
          !isRatingFilterDisabled
        )
          newParams.set("rating", selectedRating);
        if (selectedYear !== "All" && !isYearFilterDisabled)
          newParams.set("year", selectedYear);
      }
    }
    if (searchParams.toString() !== newParams.toString())
      router.replace(`/browse?${newParams.toString()}`, { scroll: false });
  }, [
    isSearching,
    selectedListCategory,
    selectedUserItemType,
    debouncedSearchTerm,
    selectedGenre,
    selectedRating,
    selectedYear,
    isGenreFilterDisabled, // These disabled states are important for URL update logic
    isRatingFilterDisabled,
    isYearFilterDisabled,
    router,
    searchParams, // To compare against current URL state
  ]);

  useEffect(() => {
    const isInitialMount = !isMounted.current;
    if (isInitialMount) isMounted.current = true;

    if (
      isInitialMount &&
      moviesState.filtersKey === primaryFiltersKey &&
      moviesState.items?.length > 0 &&
      moviesState.page > 0
    ) {
      setApiFetchedItems(moviesState.items);
      setPage(moviesState.page || 1);
      setCurrentDisplayTitle(moviesState.currentDisplayTitle || <> </>);
      // TODO: Restore hasMore from context if saved, or re-evaluate
      setHasMore(
        moviesState.hasMore !== undefined ? moviesState.hasMore : true
      );
      setIsLoading(false);
      setInitialLoadComplete(true);
      previousPrimaryFiltersKey.current = primaryFiltersKey;
      return;
    }

    if (
      isInitialMount ||
      previousPrimaryFiltersKey.current !== primaryFiltersKey
    ) {
      if (!isInitialMount) {
        // Reset for new primary filter set
        setPage(1);
        setApiFetchedItems([]);
        setDisplayItems([]); // Clear derived display items
        setHasMore(true); // Assume there's more for new filters
        setInitialLoadComplete(false); // Critical: reset for new data set
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      fetchItems(1, true); // Fetch first page for new key
    }
  }, [primaryFiltersKey, fetchItems, moviesState]); // fetchItems is now stable

  useEffect(() => {
    // Pagination: Fetch more items when page changes, but only if filters are the same
    if (!isMounted.current || page === 1 || !initialLoadComplete) return; // Guard initial or reset states
    if (previousPrimaryFiltersKey.current === primaryFiltersKey) {
      fetchItems(page, false); // 'false' indicates not a new primary filter set
    }
  }, [page, primaryFiltersKey, fetchItems, initialLoadComplete]);

  useEffect(() => {
    // Reset auto-fetch attempts when primary filters or client-side secondary filters change
    setAutoFetchState({ isActive: false, attemptsDone: 0 });
  }, [
    primaryFiltersKey, // If API-level filters change
    selectedUserItemType, // If client-side type filter changes (for 'ALL' API type)
    selectedGenre, // If client-side genre filter changes
    selectedRating, // If client-side rating filter changes
    selectedYear, // If client-side year filter changes
  ]);

  useEffect(() => {
    let itemsToProcess = [...apiFetchedItems];

    // If API returns 'ALL' types (e.g., trending/all), but user has toggled Movie/TV
    if (
      activeApiItemType === API_ITEM_TYPES.ALL &&
      selectedUserItemType !== API_ITEM_TYPES.ALL // User selected Movie or TV
    ) {
      itemsToProcess = itemsToProcess.filter(
        (item) => item.media_type === selectedUserItemType.toLowerCase()
      );
    }

    // Determine if client-side secondary filtering is needed
    const needsClientSideSecondaryFiltering =
      isSearching || // Always apply secondary filters client-side for search results
      (activeCategoryDef && !activeCategoryDef.allowsSecondaryFiltersInAPI); // Or if category doesn't support API-level secondary filters

    if (needsClientSideSecondaryFiltering) {
      itemsToProcess = itemsToProcess.filter((item) => {
        if (!item) return false; // Should be filtered by normalize
        let match = true;
        // Genre filter (client-side)
        if (!isGenreFilterDisabled && selectedGenre !== "All" && item.genre_ids)
          match = match && item.genre_ids.includes(Number(selectedGenre));
        // Rating filter (client-side)
        if (
          !isRatingFilterDisabled &&
          selectedRating !== RATING_OPTIONS.All.value &&
          typeof item.vote_average === "number"
        ) {
          const opt =
            Object.values(RATING_OPTIONS).find(
              (o) => o.value === selectedRating
            ) || RATING_OPTIONS.All;
          match =
            match &&
            item.vote_average >= opt.min &&
            item.vote_average < opt.max;
        }
        // Year filter (client-side)
        if (
          !isYearFilterDisabled &&
          selectedYear !== "All" &&
          item.displayDate // Ensure item has a date
        ) {
          const itemYear = new Date(item.displayDate).getFullYear();
          if (!isNaN(itemYear)) {
            // Check if year is valid
            const group = YEAR_GROUPS.find((g) => g.value === selectedYear);
            if (group?.from && group?.to) {
              // Range group
              const from = new Date(group.from).getFullYear();
              const to = new Date(group.to).getFullYear();
              match = match && itemYear >= from && itemYear <= to;
            } else if (group?.value !== "All") {
              // Specific year or invalid group
              match = false; // If group not found or not 'All', and no range, no match
            }
          } else {
            match = false; // Invalid item date
          }
        }
        return match;
      });
    }
    setDisplayItems(filterBlockedContent(itemsToProcess));
  }, [
    apiFetchedItems,
    isSearching,
    activeCategoryDef,
    selectedUserItemType, // For 'ALL' API type filtering
    selectedGenre,
    selectedRating,
    selectedYear,
    isGenreFilterDisabled, // To know if filter should be applied
    isRatingFilterDisabled,
    isYearFilterDisabled,
    filterBlockedContent,
    activeApiItemType, // To know if API returned 'ALL'
  ]);

  useEffect(() => {
    // Manage auto-fetching if displayItems becomes empty after filtering
    if (isLoading) {
      // If currently loading new data from API, don't trigger auto-fetch yet
      return;
    }
    if (autoFetchState.isActive) {
      // If auto-fetch was active and presumably just finished (isLoading became false), reset it
      setAutoFetchState((prev) => ({ ...prev, isActive: false }));
      return;
    }

    const shouldStartAutoFetch =
      displayItems.length === 0 && // No items currently displayable
      apiFetchedItems.length > 0 && // But we have fetched some items from API
      hasMore && // And there are more pages to fetch from API
      autoFetchState.attemptsDone < MAX_AUTO_FETCH_ATTEMPTS; // And we haven't tried too many times

    if (shouldStartAutoFetch) {
      setAutoFetchState((prev) => ({
        isActive: true, // Activate auto-fetch
        attemptsDone: prev.attemptsDone + 1,
      }));
    }
  }, [
    displayItems.length,
    apiFetchedItems.length,
    hasMore,
    isLoading,
    autoFetchState.isActive,
    autoFetchState.attemptsDone,
  ]);

  const loadMoreItems = useCallback(() => {
    // Only load more if not already loading, there are more items, and initial load is complete
    if (!isLoading && hasMore && initialLoadComplete)
      setPage((prev) => prev + 1);
  }, [isLoading, hasMore, initialLoadComplete]); // initialLoadComplete ensures we don't paginate prematurely

  useEffect(() => {
    // Trigger actual loadMoreItems if auto-fetch is active and not currently loading
    if (autoFetchState.isActive && !isLoading) {
      loadMoreItems();
    }
  }, [autoFetchState.isActive, isLoading, loadMoreItems]);

  useEffect(() => {
    // Update context with current state if filters haven't changed since last API fetch
    if (
      previousPrimaryFiltersKey.current === primaryFiltersKey &&
      isMounted.current &&
      !isLoading // Only update context when not actively loading new primary set
    ) {
      setMoviesState({
        items: apiFetchedItems,
        page,
        filtersKey: primaryFiltersKey,
        selectedUserItemType,
        selectedListCategory,
        currentDisplayTitle, // Save the title too
        selectedGenre, // Save secondary filters
        selectedRating,
        selectedYear,
        hasMore, // Save hasMore state
      });
    }
  }, [
    apiFetchedItems,
    page,
    primaryFiltersKey,
    selectedUserItemType,
    selectedListCategory,
    currentDisplayTitle,
    selectedGenre,
    selectedRating,
    selectedYear,
    hasMore,
    setMoviesState,
    isLoading, // Prevent context update while loading new primary set
  ]);

  useEffect(() => {
    const handleScroll = () => {
      // Infinite scroll logic
      if (
        initialLoadComplete && // Ensure initial content has loaded
        !isLoading && // Not already loading
        hasMore && // More items are available
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 300 // Near bottom
      ) {
        loadMoreItems();
      }
      // Show scroll-to-top button
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [initialLoadComplete, isLoading, hasMore, loadMoreItems]);

  useEffect(() => {
    // Proactive check: if already at bottom after initial load/filter, fetch more
    if (initialLoadComplete && !isLoading && hasMore) {
      const scrollThresholdMet =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300;
      if (scrollThresholdMet && displayItems.length > 0) {
        // also check if there are items to prevent loops if first page is empty
        // And if the viewport is not already full (content is shorter than viewport)
        if (
          document.documentElement.scrollHeight <= window.innerHeight &&
          displayItems.length < 10 &&
          displayItems.length > 0
        ) {
          // Heuristic: if few items and scrollbar not active
          loadMoreItems();
        } else if (scrollThresholdMet) {
          loadMoreItems();
        }
      } else if (
        document.documentElement.scrollHeight <= window.innerHeight &&
        displayItems.length < 10 &&
        displayItems.length > 0 &&
        !autoFetchState.isActive
      ) {
        loadMoreItems(); // For cases where initial load is very small
      }
    }
  }, [
    initialLoadComplete,
    isLoading,
    hasMore,
    loadMoreItems,
    displayItems.length,
    autoFetchState.isActive,
  ]);

  const handleUserItemTypeChange = (newType) => {
    setSelectedUserItemType(newType);
    const categoryDef = CATEGORY_OPTIONS_CONFIG[selectedListCategory];

    // If current category locks item type and newType conflicts, reset category & secondary filters
    if (
      !isSearching && // Only relevant if not searching
      categoryDef?.itemTypeLock &&
      categoryDef.itemTypeLock !== newType
    ) {
      setSelectedListCategory(DEFAULT_CATEGORY_VALUE); // Reset to discover
      setSelectedGenre("All");
      setSelectedRating(RATING_OPTIONS.All.value);
      setSelectedYear("All");
    }
    // If type changed, and it affects what genres/years/ratings are relevant (e.g. for discover)
    // reset secondary filters to avoid mismatches, unless it's a category that locks them anyway
    else if (newType !== activeApiItemType) {
      // Check against current API type context
      setSelectedGenre("All"); // Always reset genre on type change
      // For Discover, also reset rating/year as they are type-specific.
      // For other categories, they might not use these filters or are locked.
      if (
        !isSearching &&
        selectedListCategory === CATEGORY_OPTIONS_CONFIG.discover.value
      ) {
        setSelectedRating(RATING_OPTIONS.All.value);
        setSelectedYear("All");
      }
    }
  };
  const handleCategoryChange = (e) => {
    const newCategoryValue = e.target.value;
    setSelectedListCategory(newCategoryValue);
    setSearchTerm(""); // Clear search when category changes
    setDebouncedSearchTerm("");

    const categoryDef = CATEGORY_OPTIONS_CONFIG[newCategoryValue];
    if (categoryDef?.itemTypeLock) {
      setSelectedUserItemType(categoryDef.itemTypeLock); // Lock item type if category demands
    }
    // Reset secondary filters as they might not apply or behave differently for new category
    setSelectedGenre("All");
    setSelectedRating(RATING_OPTIONS.All.value);
    setSelectedYear("All");
  };
  const handleSecondaryFilterChange = (setter) => (e) => setter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm(""); // This will trigger primaryFiltersKey change
    // Optionally reset to a default Browse state:
    setSelectedListCategory(DEFAULT_CATEGORY_VALUE);
    setSelectedUserItemType(DEFAULT_USER_ITEM_TYPE); // Reset to default type
    setSelectedGenre("All");
    setSelectedRating(RATING_OPTIONS.All.value);
    setSelectedYear("All");
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="space-y-4 md:space-y-6 pb-8">
      <div className="container mx-auto px-3 sm:px-4 md:px-0 pt-6 pb-2 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-2 sm:mb-3">
          Browse Movies & TV Shows
        </h1>
        {currentDisplayTitle && (
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-primary flex items-center justify-center gap-x-2">
            {currentDisplayTitle}{" "}
          </h2>
        )}
      </div>

      <div className="py-4 bg-transparent border-y border-border/60 dark:border-border/30">
        <div className="container mx-auto px-3 sm:px-4 md:px-0">
          {/* Search Input */}
          <div className="relative mb-4">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
              <SearchIcon size={18} />
            </span>
            <input
              type="text"
              placeholder="Search titles..."
              value={searchTerm}
              onChange={handleSearchChange}
              disabled={isSearchInputDisabled}
              className={`w-full pl-10 pr-10 py-2.5 rounded-md border border-input bg-card placeholder:text-muted-foreground text-card-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm ${
                isSearchInputDisabled ? "opacity-50 cursor-not-allowed" : ""
              }`}
              aria-label="Search content"
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground p-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-full"
                aria-label="Clear search"
              >
                <XCircle size={18} />
              </button>
            )}
          </div>

          {/* Category and Type Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 items-center">
            <div
              className={`relative w-full md:col-span-2 ${
                isSearching ? "opacity-50 pointer-events-none" : "" // Disable category when searching
              }`}
            >
              <label htmlFor="category-filter" className="sr-only">
                Category
              </label>
              <select
                id="category-filter"
                value={selectedListCategory}
                onChange={handleCategoryChange}
                disabled={isSearching} // Disable category select when actively searching
                className="w-full appearance-none bg-card border-input rounded-md py-2 px-3 pr-8 leading-tight focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm text-card-foreground h-[42px]"
                aria-label="Select category"
              >
                {Object.values(CATEGORY_OPTIONS_CONFIG).map((cat) => {
                  // Do not show categories that are locked to a different item type
                  // than the currently selected one, unless user is searching (then all are available conceptually)
                  if (
                    cat.itemTypeLock &&
                    cat.itemTypeLock !== selectedUserItemType &&
                    !isSearching // During search, this condition is ignored, category disabled anyway
                  ) {
                    // If category is locked to MOVIE, and user has TV selected, don't show it
                    if (
                      cat.itemTypeLock === USER_SELECTABLE_ITEM_TYPES.MOVIE &&
                      selectedUserItemType === USER_SELECTABLE_ITEM_TYPES.TV
                    )
                      return null;
                    // If category is locked to TV, and user has MOVIE selected, don't show it
                    if (
                      cat.itemTypeLock === USER_SELECTABLE_ITEM_TYPES.TV &&
                      selectedUserItemType === USER_SELECTABLE_ITEM_TYPES.MOVIE
                    )
                      return null;
                  }

                  let prefix = "";
                  if (cat.icon) {
                    if (cat.value === "discover") prefix = "✨ ";
                    else if (
                      cat.value === "popular" ||
                      cat.value === "trending_week"
                    )
                      prefix = "🔥 ";
                    else if (cat.value === "top_rated") prefix = "⭐ ";
                    else if (cat.value === "upcoming") prefix = "📅 ";
                  }
                  return (
                    <option key={cat.value} value={cat.value}>
                      {prefix}
                      {cat.label} {cat.subLabel || ""}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown size={18} />
              </div>
            </div>
            <div // Item Type Toggle (Movie/TV)
              className={`flex space-x-1 rounded-md bg-muted dark:bg-card/50 p-0.5 h-[42px] items-stretch ${
                // Disable toggle if current category locks item type (unless searching)
                !isSearching && activeCategoryDef?.itemTypeLock
                  ? "opacity-50 pointer-events-none"
                  : ""
              }`}
            >
              <ToggleButton
                label="Movies"
                icon={Film}
                isActive={
                  selectedUserItemType === USER_SELECTABLE_ITEM_TYPES.MOVIE
                }
                onClick={handleUserItemTypeChange}
                value={USER_SELECTABLE_ITEM_TYPES.MOVIE}
                disabled={
                  !isSearching &&
                  !!activeCategoryDef?.itemTypeLock &&
                  activeCategoryDef.itemTypeLock !==
                    USER_SELECTABLE_ITEM_TYPES.MOVIE
                }
              />
              <ToggleButton
                label="TV"
                icon={Tv}
                isActive={
                  selectedUserItemType === USER_SELECTABLE_ITEM_TYPES.TV
                }
                onClick={handleUserItemTypeChange}
                value={USER_SELECTABLE_ITEM_TYPES.TV}
                disabled={
                  !isSearching &&
                  !!activeCategoryDef?.itemTypeLock &&
                  activeCategoryDef.itemTypeLock !==
                    USER_SELECTABLE_ITEM_TYPES.TV
                }
              />
            </div>
          </div>

          {/* Secondary Filters: Genre, Rating, Year */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {/* Genre Filter */}
            <div
              className={`relative w-full ${
                isGenreFilterDisabled ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <label htmlFor="genre-filter" className="sr-only">
                Genre
              </label>
              <select
                id="genre-filter"
                value={selectedGenre}
                onChange={handleSecondaryFilterChange(setSelectedGenre)}
                disabled={isGenreFilterDisabled}
                className="w-full appearance-none bg-card border-input rounded-md py-2.5 px-3 pr-8 leading-tight focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm text-card-foreground h-[42px]"
              >
                <option value="All">All Genres</option>
                {Object.entries(currentGenresForFilterDropdown).map(
                  ([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  )
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown size={18} />
              </div>
            </div>
            {/* Rating Filter */}
            <div
              className={`relative w-full ${
                isRatingFilterDisabled ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <label htmlFor="rating-filter" className="sr-only">
                Rating
              </label>
              <select
                id="rating-filter"
                value={selectedRating}
                onChange={handleSecondaryFilterChange(setSelectedRating)}
                disabled={isRatingFilterDisabled}
                className="w-full appearance-none bg-card border-input rounded-md py-2.5 px-3 pr-8 leading-tight focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm text-card-foreground h-[42px]"
              >
                {Object.values(RATING_OPTIONS).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown size={18} />
              </div>
            </div>
            {/* Year Filter */}
            <div
              className={`relative w-full ${
                isYearFilterDisabled ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <label htmlFor="year-filter" className="sr-only">
                Year
              </label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={handleSecondaryFilterChange(setSelectedYear)}
                disabled={isYearFilterDisabled}
                className="w-full appearance-none bg-card border-input rounded-md py-2.5 px-3 pr-8 leading-tight focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm text-card-foreground h-[42px]"
              >
                {YEAR_GROUPS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Display Area */}
      {/* Error Display - Full Page */}
      {error &&
        !isLoading && // Only show if not loading something else
        displayItems.length === 0 && ( // And no items are currently shown
          <div className="text-center py-10 container mx-auto">
            <p className="text-destructive text-lg mb-2">Error: {error}</p>
            <p className="text-muted-foreground">
              Could not load content. Please try adjusting filters or refresh.
            </p>
          </div>
        )}
      {/* Error Display - Pagination (when some items are already shown) */}
      {error && !isLoading && displayItems.length > 0 && (
        <div className="text-center py-2 text-destructive text-sm container mx-auto">
          <p>
            Error loading more items: {error}. Previously loaded items are
            shown.
          </p>
        </div>
      )}

      {/* Shimmer Loading Skeleton */}
      {((isLoading &&
        apiFetchedItems.length === 0 && // Show shimmer if loading initial batch
        page === 1 && // and it's the first page
        !autoFetchState.isActive) || // and not in an auto-fetch cycle due to empty displayItems
        (autoFetchState.isActive && displayItems.length === 0)) && // Or if auto-fetching but still no displayable items
        !error && ( // And no error is present
          <div className="container mx-auto mt-6">
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {Array.from({ length: 18 }).map((_, index) => (
                <GridCardSkeleton key={`skeleton-${index}`} />
              ))}
            </div>
            {autoFetchState.isActive && displayItems.length === 0 && (
              <p className="text-center text-muted-foreground mt-4 text-sm">
                Searching for items matching your filters...
              </p>
            )}
          </div>
        )}

      {/* Movies Grid */}
      {displayItems.length > 0 &&
        !error && ( // Only show grid if there are items and no critical error
          <div className="container mx-auto mt-6 min-h-[50vh]">
            <MoviesGrid movies={displayItems} />
          </div>
        )}

      {/* Loading More Indicator (Spinner) */}
      {isLoading &&
        displayItems.length > 0 && // Show if loading more pages
        page > 1 && // And not the first page (shimmer handles first page)
        !autoFetchState.isActive && // And not during an auto-fetch that might be showing shimmer
        !error && ( // And no error
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary dark:border-primary/70 border-t-transparent"></div>
            <p className="text-muted-foreground mt-2 text-sm">
              Loading more...
            </p>
          </div>
        )}

      {/* No Results Message */}
      {!isLoading && // Not currently loading
        !autoFetchState.isActive && // Not in an auto-fetch cycle
        displayItems.length === 0 && // No items to display
        !error && // No error occurred
        initialLoadComplete && // Initial load attempt has completed
        isMounted.current && ( // Ensure component is mounted to avoid flash
          <div className="text-center py-20 container mx-auto">
            <SearchX className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl sm:text-2xl text-foreground font-semibold">
              No{" "}
              {activeApiItemType === API_ITEM_TYPES.MOVIE
                ? "movies"
                : activeApiItemType === API_ITEM_TYPES.TV
                ? "TV shows"
                : "content"}{" "}
              found
              {!isSearching &&
              activeCategoryDef &&
              activeCategoryDef.value !== CATEGORY_OPTIONS_CONFIG.discover.value
                ? ` in "${activeCategoryDef.label}"`
                : ""}
              {isSearching ? ` for "${debouncedSearchTerm}"` : ""}
            </h2>
            <p className="mt-2 text-muted-foreground text-sm">
              Try adjusting your filters or explore our{" "}
              <Link href="/" className="text-primary hover:underline">
                home page
              </Link>
              .
            </p>
          </div>
        )}

      {/* Scroll to Top Button */}
      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-primary text-primary-foreground p-3 rounded-full shadow-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background active:scale-95 z-50 transition-opacity hover:opacity-90"
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M10 17a.75.75 0 01-.75-.75V5.56l-2.22 2.22a.75.75 0 11-1.06-1.06l3.5-3.5a.75.75 0 011.06 0l3.5 3.5a.75.75 0 01-1.06 1.06L10.75 5.56v10.69a.75.75 0 01-.75-.75z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
