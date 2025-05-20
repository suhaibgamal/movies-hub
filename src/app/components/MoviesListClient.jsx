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

// --- Configuration Constants ---
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
    value: "1970-1999",
    label: "1970-1999",
    from: "1970-01-01",
    to: "1999-12-31",
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

const API_KEY = process.env.NEXT_PUBLIC_TMDB_KEY;
const BASE_API_URL = "https://api.themoviedb.org/3/";

// Performance & Safety constants
const MAX_AUTO_FETCH_ATTEMPTS = 3;
const MAX_CLIENT_PAGES = 25; // Max pages to fetch/accumulate on client
const DEBOUNCE_DELAY = 500;
const SCROLL_OFFSET_TRIGGER = 300; // Pixels from bottom to trigger next page
const HEADER_STICKY_OFFSET = "69px";

// Reusable ToggleButton sub-component
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

  // --- State Initialization ---
  const getInitialState = useCallback(
    (key, defaultValue, contextValue, isNumeric = false) => {
      const urlValue = searchParams.get(key);
      if (urlValue !== null) {
        if (isNumeric) {
          const numVal = Number(urlValue);
          return isNaN(numVal) ? defaultValue : numVal; // Fallback to defaultValue if NaN
        }
        return urlValue;
      }
      if (contextValue !== undefined && contextValue !== null) {
        return contextValue;
      }
      return defaultValue;
    },
    [searchParams]
  );

  const [selectedUserItemType, setSelectedUserItemType] = useState(() => {
    const urlItemType = searchParams.get("itemType")?.toUpperCase();
    if (urlItemType && USER_SELECTABLE_ITEM_TYPES[urlItemType])
      return urlItemType;
    const contextVal = moviesState.selectedUserItemType;
    if (contextVal && USER_SELECTABLE_ITEM_TYPES[contextVal]) return contextVal;
    const urlListCategory = searchParams.get("listCategory");
    const categoryDef = urlListCategory
      ? CATEGORY_OPTIONS_CONFIG[urlListCategory]
      : null;
    if (categoryDef?.itemTypeLock) return categoryDef.itemTypeLock;
    return DEFAULT_USER_ITEM_TYPE;
  });

  const [selectedListCategory, setSelectedListCategory] = useState(() =>
    getInitialState(
      "listCategory",
      DEFAULT_CATEGORY_VALUE,
      moviesState.selectedListCategory
    )
  );
  const [searchTerm, setSearchTerm] = useState(() =>
    getInitialState("search", "", moviesState.searchTerm)
  );
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedGenre, setSelectedGenre] = useState(() =>
    getInitialState("genre", "All", moviesState.selectedGenre)
  );
  const [selectedRating, setSelectedRating] = useState(() =>
    getInitialState(
      "rating",
      RATING_OPTIONS.All.value,
      moviesState.selectedRating
    )
  );
  const [selectedYear, setSelectedYear] = useState(() =>
    getInitialState("year", "All", moviesState.selectedYear)
  );

  const [apiFetchedItems, setApiFetchedItems] = useState(
    () => moviesState.items || []
  );
  const [displayItems, setDisplayItems] = useState([]);
  const [page, setPage] = useState(() =>
    getInitialState("page", 1, moviesState.page, true)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [autoFetchState, setAutoFetchState] = useState({
    shouldAttemptAutoFetch: false, // Renamed from isActive
    attemptsDone: 0,
  });

  const isMounted = useRef(false);
  const previousPrimaryFiltersKey = useRef(moviesState.filtersKey || null);
  const pageIncrementInProgress = useRef(false); // Ref to prevent rapid page increments

  // --- Derived States (Memoized for performance) ---
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

  const isSearchInputDisabled = useMemo(
    () => (isSearching ? false : !!activeCategoryDef?.disablesSearch),
    [isSearching, activeCategoryDef]
  );

  const areSecondaryFiltersDisabled = useMemo(() => {
    if (isSearching) return false;
    return !!(
      activeCategoryDef?.disablesGenreFilter ||
      activeCategoryDef?.disablesRatingFilter ||
      activeCategoryDef?.disablesYearFilter
    );
  }, [isSearching, activeCategoryDef]);

  const currentGenresForFilterDropdown = useMemo(() => {
    let typeForDeterminingGenres = selectedUserItemType;
    if (!isSearching && activeCategoryDef?.itemTypeLock) {
      typeForDeterminingGenres = activeCategoryDef.itemTypeLock;
    } else if (
      activeCategoryDef?.value === CATEGORY_OPTIONS_CONFIG.trending_week.value
    ) {
      typeForDeterminingGenres = selectedUserItemType;
    }
    return typeForDeterminingGenres === USER_SELECTABLE_ITEM_TYPES.TV
      ? TV_GENRES
      : GENRES;
  }, [selectedUserItemType, activeCategoryDef, isSearching]);

  const primaryFiltersKey = useMemo(
    () =>
      JSON.stringify(
        (() => {
          const baseKey = {
            search: debouncedSearchTerm,
            listCategory: isSearching ? "" : selectedListCategory,
            itemTypeForAPI: activeApiItemType,
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
      activeCategoryDef,
      selectedGenre,
      selectedRating,
      selectedYear,
    ]
  );

  const currentDisplayTitle = useMemo(() => {
    let titleStr = "";
    let TitleIconComponent = ListFilter;
    const currentCategoryDef = activeCategoryDef;
    if (isSearching) {
      titleStr = `"${debouncedSearchTerm}"`;
      TitleIconComponent = SearchIcon;
    } else {
      titleStr = currentCategoryDef.label;
      if (currentCategoryDef.subLabel)
        titleStr += ` ${currentCategoryDef.subLabel}`;
      TitleIconComponent = currentCategoryDef.icon || ListFilter;
      if (
        currentCategoryDef.value === CATEGORY_OPTIONS_CONFIG.discover.value ||
        (currentCategoryDef.value ===
          CATEGORY_OPTIONS_CONFIG.trending_week.value &&
          selectedUserItemType !== API_ITEM_TYPES.ALL)
      ) {
        titleStr += ` (${
          activeApiItemType === API_ITEM_TYPES.MOVIE ? "Movies" : "TV Shows"
        })`;
      } else if (
        !currentCategoryDef.apiPathAll &&
        !currentCategoryDef.itemTypeLock &&
        activeApiItemType !== API_ITEM_TYPES.ALL
      ) {
        titleStr += ` (${
          activeApiItemType === API_ITEM_TYPES.MOVIE ? "Movies" : "TV Shows"
        })`;
      }
    }
    return (
      <>
        <TitleIconComponent size={26} className="inline mr-2 opacity-90" />{" "}
        {titleStr}
      </>
    );
  }, [
    isSearching,
    debouncedSearchTerm,
    activeCategoryDef,
    activeApiItemType,
    selectedUserItemType,
  ]);

  // --- Data Handling Callbacks ---
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
      adult: item.adult === true,
    };
  }, []);

  const filterBlockedContent = useCallback((rawItems) => {
    if (!Array.isArray(rawItems)) return [];
    return rawItems.filter((item) => {
      if (!item) return false;
      const title = (item.displayTitle || "").toLowerCase();
      const overview = (item.overview || "").toLowerCase();
      return !BLOCKLIST.some(
        (keyword) => title.includes(keyword) || overview.includes(keyword)
      );
    });
  }, []);

  const fetchItems = useCallback(
    async (pageToFetch, isNewPrimaryFilterSet) => {
      if (isLoading && !isNewPrimaryFilterSet && pageToFetch > page) {
        return;
      }

      // Strict MAX_CLIENT_PAGES enforcement
      if (pageToFetch > MAX_CLIENT_PAGES) {
        console.warn(
          `Attempted to fetch page ${pageToFetch} which exceeds MAX_CLIENT_PAGES (${MAX_CLIENT_PAGES}). Aborting fetch.`
        );
        setHasMore(false);
        setIsLoading(false);
        if (isNewPrimaryFilterSet || pageToFetch === 1)
          setInitialLoadComplete(true);
        pageIncrementInProgress.current = false; // Reset flag here too
        return;
      }

      setIsLoading(true);
      if (isNewPrimaryFilterSet) {
        setError(null); // Clear previous errors on new primary filter set
      }

      let endpoint = "";
      let apiParams = new URLSearchParams({
        api_key: API_KEY,
        page: pageToFetch.toString(),
        language: "en-US",
        include_adult: "false",
      });
      let effectiveItemTypeForNormalization = activeApiItemType;
      const currentCategoryDef = activeCategoryDef;

      if (isSearching) {
        endpoint = "search/";
        if (activeApiItemType === API_ITEM_TYPES.MOVIE) endpoint += "movie";
        else if (activeApiItemType === API_ITEM_TYPES.TV) endpoint += "tv";
        else {
          endpoint += "multi";
          effectiveItemTypeForNormalization = API_ITEM_TYPES.ALL;
        }
        apiParams.append("query", debouncedSearchTerm);
      } else {
        if (
          currentCategoryDef.value === CATEGORY_OPTIONS_CONFIG.discover.value
        ) {
          endpoint =
            activeApiItemType === API_ITEM_TYPES.TV
              ? "discover/tv"
              : "discover/movie";
          apiParams.append("certification_country", "US");
          apiParams.append("certification.lte", "NC-17");
          if (
            currentCategoryDef.allowsSecondaryFiltersInAPI &&
            !areSecondaryFiltersDisabled
          ) {
            if (
              selectedGenre !== "All" &&
              currentGenresForFilterDropdown[selectedGenre]
            )
              apiParams.append("with_genres", selectedGenre);
            if (selectedRating !== RATING_OPTIONS.All.value) {
              const ratingOpt =
                Object.values(RATING_OPTIONS).find(
                  (opt) => opt.value === selectedRating
                ) || RATING_OPTIONS.All;
              apiParams.append("vote_average.gte", ratingOpt.min.toString());
              if (ratingOpt.max < 10.1)
                apiParams.append("vote_average.lte", ratingOpt.max.toString());
            }
            if (selectedYear !== "All") {
              const yearGroup = YEAR_GROUPS.find(
                (g) => g.value === selectedYear
              );
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
          }
          apiParams.append("sort_by", currentCategoryDef.defaultSort);
        } else {
          if (currentCategoryDef.apiPathAll) {
            endpoint = currentCategoryDef.apiPathAll;
            effectiveItemTypeForNormalization = API_ITEM_TYPES.ALL;
          } else if (
            activeApiItemType === API_ITEM_TYPES.MOVIE &&
            currentCategoryDef.apiPathMovie
          ) {
            endpoint = currentCategoryDef.apiPathMovie;
          } else if (
            activeApiItemType === API_ITEM_TYPES.TV &&
            currentCategoryDef.apiPathTv
          ) {
            endpoint = currentCategoryDef.apiPathTv;
          }
          if (currentCategoryDef.defaultSort)
            apiParams.append("sort_by", currentCategoryDef.defaultSort);
        }
      }

      if (!endpoint) {
        setApiFetchedItems([]);
        setHasMore(false);
        setIsLoading(false);
        if (isNewPrimaryFilterSet || pageToFetch === 1)
          setInitialLoadComplete(true);
        pageIncrementInProgress.current = false; // Reset flag
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
                ? null
                : effectiveItemTypeForNormalization.toLowerCase()
            )
          )
          .filter((item) => item && item.adult !== true)
          .filter(Boolean);

        setApiFetchedItems((prev) => {
          const combined =
            isNewPrimaryFilterSet || pageToFetch === 1
              ? normalizedNewItems
              : [...prev, ...normalizedNewItems];
          const uniqueKeys = new Set();
          return combined.filter((item) => {
            const key = `${item.media_type}-${item.id}`;
            if (!uniqueKeys.has(key)) {
              uniqueKeys.add(key);
              return true;
            }
            return false;
          });
        });

        const morePagesFromApi = pageToFetch < (data.total_pages || 0);
        const withinClientPageLimit = pageToFetch < MAX_CLIENT_PAGES;
        setHasMore(
          morePagesFromApi &&
            withinClientPageLimit &&
            normalizedNewItems.length > 0
        );

        if (isNewPrimaryFilterSet || pageToFetch === 1) {
          previousPrimaryFiltersKey.current = primaryFiltersKey;
          setInitialLoadComplete(true);
        }
      } catch (err) {
        console.error("Error fetching items:", err);
        setError(err.message || "Failed to load data.");
        setHasMore(false); // Stop further pagination on error for this filter set
        if (isNewPrimaryFilterSet || pageToFetch === 1)
          setInitialLoadComplete(true);
      } finally {
        setIsLoading(false);
        pageIncrementInProgress.current = false; // Reset increment flag after fetch attempt
      }
    },
    [
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
      areSecondaryFiltersDisabled,
      activeCategoryDef,
      page, // page dependency for the isLoading guard
      isLoading, // Added isLoading to dependencies as it's used in the initial guard
      // Note: Removed initialLoadComplete from here as it's a setter or handled by callers
    ]
  );

  // --- Effects ---

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm)
        setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (isSearching) {
      newParams.set("search", debouncedSearchTerm);
      if (selectedUserItemType !== DEFAULT_USER_ITEM_TYPE)
        newParams.set("itemType", selectedUserItemType);
      if (!areSecondaryFiltersDisabled) {
        if (selectedGenre !== "All") newParams.set("genre", selectedGenre);
        if (selectedRating !== RATING_OPTIONS.All.value)
          newParams.set("rating", selectedRating);
        if (selectedYear !== "All") newParams.set("year", selectedYear);
      }
    } else {
      if (
        selectedListCategory &&
        selectedListCategory !== DEFAULT_CATEGORY_VALUE
      )
        newParams.set("listCategory", selectedListCategory);
      const categoryDef = activeCategoryDef;
      const typeForURL = categoryDef?.itemTypeLock || selectedUserItemType;
      if (typeForURL !== DEFAULT_USER_ITEM_TYPE)
        newParams.set("itemType", typeForURL);

      // For "discover" category OR if secondary filters are generally not disabled for other categories
      if (
        !areSecondaryFiltersDisabled ||
        (categoryDef &&
          categoryDef.allowsSecondaryFiltersInAPI &&
          categoryDef.value === CATEGORY_OPTIONS_CONFIG.discover.value)
      ) {
        if (selectedGenre !== "All") newParams.set("genre", selectedGenre);
        if (selectedRating !== RATING_OPTIONS.All.value)
          newParams.set("rating", selectedRating);
        if (selectedYear !== "All") newParams.set("year", selectedYear);
      }
    }
    if (searchParams.toString() !== newParams.toString()) {
      router.replace(`/browse?${newParams.toString()}`, { scroll: false });
    }
  }, [
    isSearching,
    selectedListCategory,
    selectedUserItemType,
    debouncedSearchTerm,
    selectedGenre,
    selectedRating,
    selectedYear,
    areSecondaryFiltersDisabled,
    router,
    searchParams,
    activeCategoryDef,
  ]);

  useEffect(() => {
    const isMounting = !isMounted.current;
    if (isMounting) {
      isMounted.current = true;
      if (
        moviesState.filtersKey === primaryFiltersKey &&
        moviesState.items?.length > 0
      ) {
        setApiFetchedItems(moviesState.items);
        setPage(moviesState.page || 1);
        setSelectedUserItemType(
          moviesState.selectedUserItemType || DEFAULT_USER_ITEM_TYPE
        );
        setSelectedListCategory(
          moviesState.selectedListCategory || DEFAULT_CATEGORY_VALUE
        );
        setSearchTerm(moviesState.searchTerm || "");
        setDebouncedSearchTerm(moviesState.searchTerm || "");
        setSelectedGenre(moviesState.selectedGenre || "All");
        setSelectedRating(
          moviesState.selectedRating || RATING_OPTIONS.All.value
        );
        setSelectedYear(moviesState.selectedYear || "All");

        const totalApiPages = moviesState.totalPagesFromApi || MAX_CLIENT_PAGES;
        const moreFromApi = (moviesState.page || 1) < totalApiPages;
        const withinClientLimit = (moviesState.page || 1) < MAX_CLIENT_PAGES;
        setHasMore(
          moreFromApi && withinClientLimit && moviesState.items.length > 0
        );
        setError(moviesState.error || null); // Restore error state
        setIsLoading(false);
        setInitialLoadComplete(true);
        previousPrimaryFiltersKey.current = primaryFiltersKey;
        pageIncrementInProgress.current = false; // Ensure reset on context restore
        return;
      }
    }

    if (
      previousPrimaryFiltersKey.current !== primaryFiltersKey ||
      (isMounting && !initialLoadComplete) // Fetch if mounting and no context restoration happened
    ) {
      if (!isMounting) {
        // Filters changed after initial mount
        setPage(1);
        setApiFetchedItems([]);
        setDisplayItems([]); // Clear display items immediately
        setHasMore(true); // Assume more items for new filter set initially
        setInitialLoadComplete(false);
        setError(null); // Clear previous errors
        window.scrollTo({ top: 0, behavior: "smooth" });
        pageIncrementInProgress.current = false; // Reset flag
        setAutoFetchState({ shouldAttemptAutoFetch: false, attemptsDone: 0 }); // Reset auto-fetch
      } else if (isMounting && !initialLoadComplete) {
        // True initial mount, no context restore, ensure page is 1
        if (page !== 1) setPage(1);
        setInitialLoadComplete(false);
        setError(null);
        pageIncrementInProgress.current = false;
        setAutoFetchState({ shouldAttemptAutoFetch: false, attemptsDone: 0 });
      }
      fetchItems(1, true);
    }
  }, [primaryFiltersKey, fetchItems, moviesState, page, initialLoadComplete]); // Added page & initialLoadComplete for mount logic

  useEffect(() => {
    if (!isMounted.current || page === 1 || !initialLoadComplete || isLoading)
      return;
    if (previousPrimaryFiltersKey.current === primaryFiltersKey) {
      fetchItems(page, false);
    }
  }, [page, initialLoadComplete, isLoading, primaryFiltersKey, fetchItems]);

  useEffect(() => {
    let itemsToProcess = [...apiFetchedItems];
    if (
      activeApiItemType === API_ITEM_TYPES.ALL &&
      selectedUserItemType !== API_ITEM_TYPES.ALL
    ) {
      itemsToProcess = itemsToProcess.filter(
        (item) => item.media_type === selectedUserItemType.toLowerCase()
      );
    }
    const needsClientSideFiltering =
      isSearching ||
      (activeCategoryDef && !activeCategoryDef.allowsSecondaryFiltersInAPI);

    if (needsClientSideFiltering && !areSecondaryFiltersDisabled) {
      itemsToProcess = itemsToProcess.filter((item) => {
        if (!item) return false;
        let match = true;
        if (selectedGenre !== "All" && item.genre_ids) {
          match = match && item.genre_ids.includes(Number(selectedGenre));
        }
        if (
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
        if (selectedYear !== "All" && item.displayDate) {
          const itemDate = new Date(item.displayDate);
          if (!isNaN(itemDate.getTime())) {
            // Safe date parsing
            const itemYear = itemDate.getFullYear();
            const group = YEAR_GROUPS.find((g) => g.value === selectedYear);
            if (group?.from && group?.to) {
              const from = new Date(group.from).getFullYear(),
                to = new Date(group.to).getFullYear();
              match = match && itemYear >= from && itemYear <= to;
            } else if (
              group?.value !== "All" &&
              group.value === String(itemYear)
            ) {
              /* Single year match */
            } else if (
              group?.value !== "All" &&
              group.value !== String(itemYear) &&
              !(group?.from && group?.to)
            ) {
              match = false;
            }
          } else {
            match = false; // Invalid date, does not match year filter
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
    selectedUserItemType,
    selectedGenre,
    selectedRating,
    selectedYear,
    areSecondaryFiltersDisabled,
    filterBlockedContent,
    activeApiItemType,
    // currentGenresForFilterDropdown, // Not directly used in filter logic, but influences selectedGenre
  ]);

  const loadMoreItems = useCallback(() => {
    if (pageIncrementInProgress.current) {
      return;
    }
    if (
      initialLoadComplete &&
      !isLoading &&
      hasMore &&
      page < MAX_CLIENT_PAGES
    ) {
      pageIncrementInProgress.current = true;
      setPage((prevPage) => {
        if (prevPage >= MAX_CLIENT_PAGES) {
          setHasMore(false); // Should be caught by hasMore already, but good fallback
          // pageIncrementInProgress.current will be reset in fetchItems' finally
          return prevPage;
        }
        return prevPage + 1;
      });
    }
  }, [initialLoadComplete, isLoading, hasMore, page]);

  // Auto-fetch Decision Effect
  useEffect(() => {
    if (isLoading || !initialLoadComplete || error) {
      if (autoFetchState.shouldAttemptAutoFetch && (error || isLoading)) {
        setAutoFetchState((prev) => ({
          ...prev,
          shouldAttemptAutoFetch: false,
        }));
      }
      return;
    }

    if (
      autoFetchState.shouldAttemptAutoFetch &&
      (displayItems.length > 0 || !hasMore)
    ) {
      setAutoFetchState((prev) => ({ ...prev, shouldAttemptAutoFetch: false }));
      return;
    }

    const canStartAutoFetch =
      displayItems.length === 0 &&
      apiFetchedItems.length > 0 &&
      hasMore &&
      page < MAX_CLIENT_PAGES &&
      autoFetchState.attemptsDone < MAX_AUTO_FETCH_ATTEMPTS &&
      !autoFetchState.shouldAttemptAutoFetch;

    if (canStartAutoFetch) {
      setAutoFetchState((prev) => ({
        shouldAttemptAutoFetch: true,
        attemptsDone: prev.attemptsDone + 1,
      }));
    } else if (
      autoFetchState.attemptsDone >= MAX_AUTO_FETCH_ATTEMPTS &&
      displayItems.length === 0 &&
      autoFetchState.shouldAttemptAutoFetch
    ) {
      setAutoFetchState((prev) => ({ ...prev, shouldAttemptAutoFetch: false }));
    }
  }, [
    displayItems.length,
    apiFetchedItems.length,
    hasMore,
    isLoading,
    initialLoadComplete,
    autoFetchState.attemptsDone,
    autoFetchState.shouldAttemptAutoFetch,
    page,
    error,
  ]);

  // Auto-fetch Trigger Effect
  useEffect(() => {
    if (
      autoFetchState.shouldAttemptAutoFetch &&
      !isLoading &&
      hasMore &&
      initialLoadComplete &&
      page < MAX_CLIENT_PAGES // Ensure page is within bounds for auto-fetch trigger
    ) {
      loadMoreItems();
    }
  }, [
    autoFetchState.shouldAttemptAutoFetch,
    isLoading,
    hasMore,
    initialLoadComplete,
    loadMoreItems,
    page, // Added page
  ]);

  useEffect(() => {
    if (
      isMounted.current &&
      previousPrimaryFiltersKey.current === primaryFiltersKey // Only update context if filters haven't changed since last successful fetch for this key
    ) {
      setMoviesState({
        items: apiFetchedItems,
        page,
        filtersKey: primaryFiltersKey, // Store the key for which these items/page are valid
        selectedUserItemType,
        selectedListCategory,
        searchTerm, // Store raw search term
        selectedGenre,
        selectedRating,
        selectedYear,
        error, // Persist error state
        // totalPagesFromApi: could be stored if available and useful for hasMore logic on restore
      });
    }
  }, [
    apiFetchedItems,
    page,
    primaryFiltersKey, // This is key
    selectedUserItemType,
    selectedListCategory,
    searchTerm,
    selectedGenre,
    selectedRating,
    selectedYear,
    setMoviesState,
    error, // Include error in context
  ]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        initialLoadComplete &&
        !isLoading && // Check global loading
        !pageIncrementInProgress.current && // Check if a page increment is already in progress
        hasMore &&
        page < MAX_CLIENT_PAGES &&
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - SCROLL_OFFSET_TRIGGER
      ) {
        loadMoreItems();
      }
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [initialLoadComplete, isLoading, hasMore, loadMoreItems, page]); // page added

  useEffect(() => {
    if (
      initialLoadComplete &&
      !isLoading &&
      !pageIncrementInProgress.current &&
      hasMore &&
      page < MAX_CLIENT_PAGES
    ) {
      const scrollThresholdMet =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - SCROLL_OFFSET_TRIGGER;
      if (scrollThresholdMet) {
        loadMoreItems();
      }
    }
  }, [initialLoadComplete, isLoading, hasMore, loadMoreItems, page]); // page added

  // --- Event Handlers ---
  const handleUserItemTypeChange = (newType) => {
    if (selectedUserItemType === newType && !isSearching) return; // No change if not searching and type is same
    setSelectedUserItemType(newType);
    const currentCategoryDef = activeCategoryDef; // Use memoized
    // If current category is locked to a specific type and that type is not the newType,
    // reset category to default. This prevents being in "Upcoming Movies" but toggling to "TV".
    if (
      !isSearching &&
      currentCategoryDef?.itemTypeLock &&
      currentCategoryDef.itemTypeLock !== newType
    ) {
      setSelectedListCategory(DEFAULT_CATEGORY_VALUE);
    }
    // Reset genre, as available genres might change (e.g., movie genres vs TV genres)
    // Other filters like rating/year can often remain relevant.
    // Page, items, etc., will be reset by the primaryFiltersKey effect.
    setSelectedGenre("All");
  };

  const handleCategoryChange = (e) => {
    const newCategoryValue = e.target.value;
    if (selectedListCategory === newCategoryValue && !isSearching) return;

    setSelectedListCategory(newCategoryValue);
    setSearchTerm(""); // Changing category clears search
    setDebouncedSearchTerm("");

    const categoryDef = CATEGORY_OPTIONS_CONFIG[newCategoryValue];
    if (categoryDef?.itemTypeLock) {
      setSelectedUserItemType(categoryDef.itemTypeLock); // Lock item type if category demands it
    }
    // Reset secondary filters as their applicability/API support might change
    setSelectedGenre("All");
    setSelectedRating(RATING_OPTIONS.All.value);
    setSelectedYear("All");
    // Page, items, etc., reset by primaryFiltersKey effect
  };

  const handleSecondaryFilterChange = (setter) => (e) => {
    setter(e.target.value);
    // Page, items, etc., reset by primaryFiltersKey effect if these filters are part of primary key
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm(""); // Important to clear debounced term as well for immediate effect via primaryFiltersKey
    // Reset other filters to defaults when search is cleared
    setSelectedListCategory(DEFAULT_CATEGORY_VALUE);
    setSelectedUserItemType(DEFAULT_USER_ITEM_TYPE);
    setSelectedGenre("All");
    setSelectedRating(RATING_OPTIONS.All.value);
    setSelectedYear("All");
    // Page, items, etc., reset by primaryFiltersKey effect
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // --- Render Logic ---
  const showSkeletons =
    isLoading && // Global loading
    page === 1 && // Only for the first page of a set
    displayItems.length === 0 && // No items yet to display
    !error && // No error has occurred
    !initialLoadComplete; // Initial load for this filter set is not yet complete

  return (
    <div className="space-y-4 md:space-y-6 pb-8">
      <div className="container mx-auto px-3 sm:px-4 md:px-0 pt-6 pb-2 text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary flex items-center justify-center gap-x-2.5">
          {currentDisplayTitle}
        </h1>
      </div>

      <div
        className="py-4 bg-transparent border-y border-border/60 dark:border-border/30 sticky z-40 backdrop-blur-md dark:bg-card/80"
        style={{ top: HEADER_STICKY_OFFSET }}
      >
        <div className="container mx-auto px-3 sm:px-4 md:px-0">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 items-center">
            <div
              className={`relative w-full md:col-span-2 ${
                isSearching ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <label htmlFor="category-filter" className="sr-only">
                Category
              </label>
              <select
                id="category-filter"
                value={selectedListCategory}
                onChange={handleCategoryChange}
                disabled={isSearching}
                className="w-full appearance-none bg-card border-input rounded-md py-2 px-3 pr-8 leading-tight focus:outline-none focus:ring-1 focus:ring-ring focus:border-primary text-sm text-card-foreground h-[42px]"
                aria-label="Select category"
              >
                {Object.values(CATEGORY_OPTIONS_CONFIG).map((cat) => {
                  if (
                    cat.itemTypeLock &&
                    cat.itemTypeLock !== selectedUserItemType &&
                    !isSearching && // Don't hide if searching, as item type toggle is active
                    activeApiItemType !== API_ITEM_TYPES.ALL && // Allow if current API type is ALL (e.g. trending)
                    // Exception: if the category IS trending_week, which is 'ALL', it should always show.
                    // The activeApiItemType check should handle this implicitly if trending_week is selected.
                    // More precise: if the category itself is what causes activeApiItemType to be ALL, it should be shown.
                    !(cat.apiPathAll && selectedListCategory === cat.value)
                  ) {
                    // This logic might need refinement based on exact desired behavior for locked categories
                    // when user toggles type vs. when category itself dictates type.
                    // For now, if a category is locked to a type different from the user's selection (and not searching), hide it.
                    if (
                      cat.value !== CATEGORY_OPTIONS_CONFIG.trending_week.value
                    )
                      return null; // Allow trending week always
                  }
                  return (
                    <option key={cat.value} value={cat.value}>
                      {cat.label} {cat.subLabel || ""}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown size={18} />
              </div>
            </div>
            <div
              className={`flex space-x-1 rounded-md bg-muted dark:bg-card/50 p-0.5 h-[42px] items-stretch ${
                isSearching // If searching, item type toggle is always enabled
                  ? ""
                  : activeCategoryDef?.itemTypeLock // If category locks item type (and not searching), disable toggle
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
                  // Disable if category locks to a different type (and not searching)
                  !isSearching &&
                  activeCategoryDef?.itemTypeLock &&
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
                  // Disable if category locks to a different type (and not searching)
                  !isSearching &&
                  activeCategoryDef?.itemTypeLock &&
                  activeCategoryDef.itemTypeLock !==
                    USER_SELECTABLE_ITEM_TYPES.TV
                }
              />
            </div>
          </div>

          <div
            className={`grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 ${
              areSecondaryFiltersDisabled
                ? "opacity-50 pointer-events-none"
                : ""
            }`}
          >
            <div className="relative w-full">
              <label htmlFor="genre-filter" className="sr-only">
                Genre
              </label>
              <select
                id="genre-filter"
                value={selectedGenre}
                onChange={handleSecondaryFilterChange(setSelectedGenre)}
                disabled={areSecondaryFiltersDisabled}
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
            <div className="relative w-full">
              <label htmlFor="rating-filter" className="sr-only">
                Rating
              </label>
              <select
                id="rating-filter"
                value={selectedRating}
                onChange={handleSecondaryFilterChange(setSelectedRating)}
                disabled={areSecondaryFiltersDisabled}
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
            <div className="relative w-full">
              <label htmlFor="year-filter" className="sr-only">
                Year
              </label>
              <select
                id="year-filter"
                value={selectedYear}
                onChange={handleSecondaryFilterChange(setSelectedYear)}
                disabled={areSecondaryFiltersDisabled}
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

      <div className="container mx-auto mt-6 min-h-[60vh]">
        {error && !isLoading && displayItems.length === 0 && (
          <div className="text-center py-10">
            <p className="text-destructive text-lg mb-2">Error: {error}</p>
            <p className="text-muted-foreground">
              Could not load content. Please try adjusting filters or refresh.
            </p>
          </div>
        )}
        {error && isLoading && page > 1 && displayItems.length > 0 && (
          <div className="text-center py-2 text-destructive text-sm">
            <p>
              Error loading more items: {error}. Displaying previously loaded
              items.
            </p>
          </div>
        )}

        {showSkeletons && (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 18 }).map((_, index) => (
              <GridCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        )}

        {!showSkeletons && displayItems.length > 0 && (
          <MoviesGrid movies={displayItems} />
        )}

        {isLoading &&
          page > 1 &&
          !autoFetchState.shouldAttemptAutoFetch && // Don't show "Loading more..." if auto-fetch is active and might be causing this load
          !error && // No error
          displayItems.length > 0 && ( // Only if there are already items
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary dark:border-primary/70 border-t-transparent"></div>
              <p className="text-muted-foreground mt-2 text-sm">
                Loading more...
              </p>
            </div>
          )}

        {autoFetchState.shouldAttemptAutoFetch && // If an auto-fetch attempt is signaled
          isLoading && // And we are currently loading (likely due to that auto-fetch)
          displayItems.length === 0 && // And still no displayable items
          !error &&
          initialLoadComplete && (
            <p className="text-center text-muted-foreground mt-4 text-sm">
              Searching for more items matching your filters (Attempt:{" "}
              {autoFetchState.attemptsDone})...
            </p>
          )}

        {!isLoading &&
          !autoFetchState.shouldAttemptAutoFetch && // Not actively trying to auto-fetch
          displayItems.length === 0 &&
          !error &&
          initialLoadComplete && ( // Initial load is done, no items, no loading, no auto-fetch = no results
            <div className="text-center py-20">
              <SearchX className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
              <h2 className="text-xl sm:text-2xl text-foreground font-semibold">
                No{" "}
                {activeApiItemType === API_ITEM_TYPES.MOVIE
                  ? "movies"
                  : activeApiItemType === API_ITEM_TYPES.TV
                  ? "TV shows"
                  : "content"}{" "}
                found
                {activeCategoryDef &&
                !isSearching &&
                activeCategoryDef.value !==
                  CATEGORY_OPTIONS_CONFIG.discover.value
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
      </div>

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
