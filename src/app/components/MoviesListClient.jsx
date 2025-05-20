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
]; //

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
const MAX_CLIENT_PAGES = 25; // Max pages to fetch/accumulate on client (e.g., 25 pages * 20 items/page = 500 items)
const DEBOUNCE_DELAY = 500;
const SCROLL_OFFSET_TRIGGER = 300; // Pixels from bottom to trigger next page
const HEADER_STICKY_OFFSET = "69px"; // Adjust if your header height changes

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
  // Helper to get initial state: URL param -> Context -> Default
  const getInitialState = useCallback(
    (key, defaultValue, contextValue, isNumeric = false) => {
      const urlValue = searchParams.get(key);
      if (urlValue !== null) return isNumeric ? Number(urlValue) : urlValue;
      if (contextValue !== undefined && contextValue !== null)
        return contextValue;
      return defaultValue;
    },
    [searchParams]
  ); // searchParams is the only dependency that changes this function's behavior

  const [selectedUserItemType, setSelectedUserItemType] = useState(() => {
    const urlItemType = searchParams.get("itemType")?.toUpperCase();
    if (urlItemType && USER_SELECTABLE_ITEM_TYPES[urlItemType])
      return urlItemType;
    const contextVal = moviesState.selectedUserItemType;
    if (contextVal && USER_SELECTABLE_ITEM_TYPES[contextVal]) return contextVal;
    const urlListCategory = searchParams.get("listCategory"); // Check category from URL for default item type
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm); // Initialize with searchTerm
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
  ); // Page can be from URL/context
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [autoFetchState, setAutoFetchState] = useState({
    isActive: false,
    attemptsDone: 0,
  });
  const isMounted = useRef(false); // Tracks if component has mounted at least once
  const previousPrimaryFiltersKey = useRef(moviesState.filtersKey || null); // Stores the key of the last successful primary fetch

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
    const currentCategoryDef = activeCategoryDef; // Use memoized version
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
        // Ensure not "ALL" for general categories
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
  }, []); // BLOCKLIST is stable

  const fetchItems = useCallback(
    async (pageToFetch, isNewPrimaryFilterSet) => {
      if (isLoading && !isNewPrimaryFilterSet && pageToFetch > page) {
        return;
      }
      setIsLoading(true);
      if (isNewPrimaryFilterSet) {
        setError(null);
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
        setHasMore(false);
        if (isNewPrimaryFilterSet || pageToFetch === 1)
          setInitialLoadComplete(true);
      } finally {
        setIsLoading(false);
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
      // Note: Removed initialLoadComplete & isLoading from here as they are setters or handled by callers
    ]
  );

  // --- Effects ---

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm)
        setDebouncedSearchTerm(searchTerm);
    }, DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  // Update URL from state
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
      if (
        !areSecondaryFiltersDisabled ||
        (categoryDef && categoryDef.allowsSecondaryFiltersInAPI)
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

  // Main data fetching trigger
  useEffect(() => {
    const isMounting = !isMounted.current;
    if (isMounting) {
      isMounted.current = true;
      // Attempt context restoration on true initial mount
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
        setDebouncedSearchTerm(moviesState.searchTerm || ""); // Sync debounced term
        setSelectedGenre(moviesState.selectedGenre || "All");
        setSelectedRating(
          moviesState.selectedRating || RATING_OPTIONS.All.value
        );
        setSelectedYear(moviesState.selectedYear || "All");

        const totalApiPages = moviesState.totalPagesFromApi || MAX_CLIENT_PAGES; // Assuming context might store this
        const moreFromApi = (moviesState.page || 1) < totalApiPages;
        const withinClientLimit = (moviesState.page || 1) < MAX_CLIENT_PAGES;
        setHasMore(
          moreFromApi && withinClientLimit && moviesState.items.length > 0
        );

        setIsLoading(false);
        setInitialLoadComplete(true);
        previousPrimaryFiltersKey.current = primaryFiltersKey;
        return;
      }
    }

    if (
      previousPrimaryFiltersKey.current !== primaryFiltersKey ||
      (isMounting && !initialLoadComplete)
    ) {
      if (!isMounting) {
        // Filter changed after initial mount
        setPage(1);
        setApiFetchedItems([]);
        setDisplayItems([]);
        setHasMore(true);
        setInitialLoadComplete(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (isMounting && !initialLoadComplete) {
        // True initial mount, no context restore
        if (page !== 1) setPage(1); // Ensure page is 1
        setInitialLoadComplete(false);
      }
      fetchItems(1, true);
    }
  }, [primaryFiltersKey, fetchItems, moviesState]);

  // Pagination effect: Fetch more items when page changes (and conditions are met)
  useEffect(() => {
    if (!isMounted.current || page === 1 || !initialLoadComplete || isLoading)
      return;
    if (previousPrimaryFiltersKey.current === primaryFiltersKey) {
      fetchItems(page, false);
    }
  }, [page, initialLoadComplete, isLoading, primaryFiltersKey, fetchItems]);

  // Derive displayItems from apiFetchedItems and apply client-side filters
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
          const itemYear = new Date(item.displayDate).getFullYear();
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
    currentGenresForFilterDropdown,
  ]);

  // Callback for loading more items (used by scroll handlers and auto-fetch)
  const loadMoreItems = useCallback(() => {
    if (
      initialLoadComplete &&
      !isLoading &&
      hasMore &&
      page < MAX_CLIENT_PAGES
    ) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [initialLoadComplete, isLoading, hasMore, page]); // page is a dependency here

  // Auto-fetch logic (decide if needed)
  useEffect(() => {
    if (isLoading || !initialLoadComplete) return;
    if (autoFetchState.isActive) {
      setAutoFetchState((prev) => ({ ...prev, isActive: false }));
      return;
    }
    const shouldStartAutoFetch =
      displayItems.length === 0 &&
      apiFetchedItems.length > 0 &&
      hasMore &&
      page < MAX_CLIENT_PAGES && // Respect client page limit for auto-fetch too
      autoFetchState.attemptsDone < MAX_AUTO_FETCH_ATTEMPTS;
    if (shouldStartAutoFetch) {
      setAutoFetchState((prev) => ({
        isActive: true,
        attemptsDone: prev.attemptsDone + 1,
      }));
    }
  }, [
    displayItems.length,
    apiFetchedItems.length,
    hasMore,
    isLoading,
    initialLoadComplete,
    autoFetchState.isActive,
    autoFetchState.attemptsDone,
    page,
  ]);

  // Auto-fetch logic (trigger fetch)
  useEffect(() => {
    if (
      autoFetchState.isActive &&
      !isLoading &&
      hasMore &&
      initialLoadComplete &&
      page < MAX_CLIENT_PAGES
    ) {
      loadMoreItems();
    }
  }, [
    autoFetchState.isActive,
    isLoading,
    hasMore,
    initialLoadComplete,
    loadMoreItems,
    page,
  ]);

  // Update context state
  useEffect(() => {
    if (
      isMounted.current &&
      previousPrimaryFiltersKey.current === primaryFiltersKey
    ) {
      setMoviesState({
        items: apiFetchedItems,
        page,
        filtersKey: primaryFiltersKey,
        selectedUserItemType,
        selectedListCategory,
        searchTerm,
        selectedGenre,
        selectedRating,
        selectedYear,
        // Consider storing totalPages from API if useful for context restoration's hasMore logic
      });
    }
  }, [
    apiFetchedItems,
    page,
    primaryFiltersKey,
    selectedUserItemType,
    selectedListCategory,
    searchTerm,
    selectedGenre,
    selectedRating,
    selectedYear,
    setMoviesState,
  ]);

  // Scroll event listener for manual pagination & scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (
        initialLoadComplete &&
        !isLoading &&
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
  }, [initialLoadComplete, isLoading, hasMore, loadMoreItems, page]);

  // Proactive check on load completion if user is already at bottom
  useEffect(() => {
    if (
      initialLoadComplete &&
      !isLoading &&
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
  }, [initialLoadComplete, isLoading, hasMore, loadMoreItems, page]);

  // --- Event Handlers ---
  const handleUserItemTypeChange = (newType) => {
    if (selectedUserItemType === newType && !isSearching) return;
    setSelectedUserItemType(newType);
    const currentCategoryDef = activeCategoryDef;
    if (
      !isSearching &&
      currentCategoryDef?.itemTypeLock &&
      currentCategoryDef.itemTypeLock !== newType
    ) {
      setSelectedListCategory(DEFAULT_CATEGORY_VALUE);
    } else {
      setSelectedGenre("All"); // Reset genre as the list might change
    }
    // Other resets (page, initialLoadComplete) are handled by primaryFiltersKey effect
  };

  const handleCategoryChange = (e) => {
    const newCategoryValue = e.target.value;
    if (selectedListCategory === newCategoryValue && !isSearching) return;
    setSelectedListCategory(newCategoryValue);
    setSearchTerm("");
    setDebouncedSearchTerm("");
    const categoryDef = CATEGORY_OPTIONS_CONFIG[newCategoryValue];
    if (categoryDef?.itemTypeLock) {
      setSelectedUserItemType(categoryDef.itemTypeLock);
    }
    // Reset secondary filters as they might become disabled/enabled or irrelevant
    setSelectedGenre("All");
    setSelectedRating(RATING_OPTIONS.All.value);
    setSelectedYear("All");
  };

  const handleSecondaryFilterChange = (setter) => (e) => {
    setter(e.target.value);
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  const handleClearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setSelectedListCategory(DEFAULT_CATEGORY_VALUE);
    setSelectedUserItemType(DEFAULT_USER_ITEM_TYPE);
    setSelectedGenre("All");
    setSelectedRating(RATING_OPTIONS.All.value);
    setSelectedYear("All");
  };
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // --- Render Logic ---
  const showSkeletons =
    isLoading &&
    page === 1 &&
    displayItems.length === 0 &&
    !error &&
    !initialLoadComplete;

  return (
    <div className="space-y-4 md:space-y-6 pb-8">
      <div className="container mx-auto px-3 sm:px-4 md:px-0 pt-6 pb-2 text-center">
        {/* Title is now an h1 for better page structure */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary flex items-center justify-center gap-x-2.5">
          {currentDisplayTitle}
        </h1>
      </div>

      {/* Filters UI */}
      <div
        className="py-4 bg-transparent border-y border-border/60 dark:border-border/30 sticky z-40 backdrop-blur-md bg-background/80 dark:bg-card/80"
        style={{ top: HEADER_STICKY_OFFSET }} // Dynamic top offset for sticky header
      >
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

          {/* Category and Item Type Toggles */}
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
                  // Don't show categories locked to a type different from the currently selected (unless it's "ALL" for trending, or we are searching)
                  if (
                    cat.itemTypeLock &&
                    cat.itemTypeLock !== selectedUserItemType &&
                    !isSearching &&
                    activeApiItemType !== API_ITEM_TYPES.ALL
                  )
                    return null;
                  let prefix = ""; /* ...icon logic based on cat.icon... */
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
            <div
              className={`flex space-x-1 rounded-md bg-muted dark:bg-card/50 p-0.5 h-[42px] items-stretch ${
                isSearching
                  ? ""
                  : activeCategoryDef?.itemTypeLock
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
                  isSearching ||
                  activeCategoryDef?.value ===
                    CATEGORY_OPTIONS_CONFIG.trending_week.value
                    ? false
                    : !!(
                        activeCategoryDef?.itemTypeLock &&
                        activeCategoryDef.itemTypeLock !==
                          USER_SELECTABLE_ITEM_TYPES.MOVIE
                      )
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
                  isSearching ||
                  activeCategoryDef?.value ===
                    CATEGORY_OPTIONS_CONFIG.trending_week.value
                    ? false
                    : !!(
                        activeCategoryDef?.itemTypeLock &&
                        activeCategoryDef.itemTypeLock !==
                          USER_SELECTABLE_ITEM_TYPES.TV
                      )
                }
              />
            </div>
          </div>

          {/* Secondary Filters */}
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

      {/* Content Area */}
      <div className="container mx-auto mt-6 min-h-[60vh]">
        {/* Error Display */}
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

        {/* Skeleton Loaders: Show only on initial load of a filter set when no items and no error */}
        {showSkeletons && (
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 18 }).map((_, index) => (
              <GridCardSkeleton key={`skeleton-${index}`} />
            ))}
          </div>
        )}

        {/* Display Grid: Show if not skeleton loading AND there are items */}
        {!showSkeletons && displayItems.length > 0 && (
          <MoviesGrid movies={displayItems} />
        )}

        {/* Loading More Indicator (for subsequent pages, not during auto-fetch's own loading state) */}
        {isLoading &&
          page > 1 &&
          !autoFetchState.isActive &&
          !error &&
          displayItems.length > 0 && (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary dark:border-primary/70 border-t-transparent"></div>
              <p className="text-muted-foreground mt-2 text-sm">
                Loading more...
              </p>
            </div>
          )}

        {/* Auto-fetch trying message */}
        {autoFetchState.isActive &&
          displayItems.length === 0 &&
          !error &&
          initialLoadComplete && (
            <p className="text-center text-muted-foreground mt-4 text-sm">
              Searching for more items matching your filters...
            </p>
          )}

        {/* No Results Message */}
        {!isLoading &&
          !autoFetchState.isActive &&
          displayItems.length === 0 &&
          !error &&
          initialLoadComplete && (
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
