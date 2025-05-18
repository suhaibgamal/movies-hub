// src/app/components/MoviesListClient.jsx
"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMoviesListContext } from "@/app/context/MoviesListContext";
import MoviesGrid from "@/app/components/MoviesGrid";
import { GENRES, TV_GENRES } from "@/lib/constants";
import {
  SearchX, // No results icon
  ListFilter, // Discover category icon
  XCircle, // Clear search icon
  Film, // Movies icon
  Tv, // TV icon
  ChevronDown, // Select dropdown arrow
  Star, // Rating icon (general)
  CalendarDays, // Year/Date icon
  TrendingUp, // Trending/Popular icon
  ThumbsUp, // Top Rated/Recommended icon
  Search as SearchIcon, // Search input icon
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
    value: "1970-1999",
    label: "1970-1999",
    from: "1970-01-01",
    to: "1999-12-31",
    icon: CalendarDays,
  },
];

// const BLOCKLIST = [
//   "porn",
//   "adult",
//   "xxx",
//   "explicit",
//   "sex",
//   "erotic",
//   "incest",
//   "nude",
//   "nudity",
//   "naked",
//   "erotica",
//   "hentai",
//   "bdsm",
//   "fetish",
//   "hardcore",
//   "masturbation",
//   "orgy",
//   "swinger",
//   "stripper",
//   "stripping",
//   "dildo",
//   "vibrator",
//   "anal",
//   "cum",
//   "masturbate",
//   "pornographic",
//   "obscene",
//   "x-rated",
//   "smut",
//   "sexploitation",
//   "boobs",
//   "ass",
//   "breasts",
//   "cleavage",
//   "jerk",
//   "dick",
//   "cock",
//   "pussy",
//   "tits",
//   "sexy",
//   "kink",
//   "orgasm",
//   "cunnilingus",
//   "fellatio",
//   "penis",
//   "vagina",
//   "clitoris",
//   "sperm",
//   "ejaculation",
//   "fuck",
// ];

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

const MAX_AUTO_FETCH_ATTEMPTS = 3; // Max number of additional pages to fetch automatically
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
  const [currentDisplayTitle, setCurrentDisplayTitle] = useState(<>&nbsp;</>);

  const [autoFetchState, setAutoFetchState] = useState({
    isActive: false,
    attemptsDone: 0,
  });
  const isMounted = useRef(false);
  const previousPrimaryFiltersKey = useRef(null);

  // --- Derived States (Order Matters for Dependencies) ---
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

    if (!isSearching && activeCategoryDef?.itemTypeLock) {
      typeForDeterminingGenres = activeCategoryDef.itemTypeLock;
    } else if (isSearching) {
      typeForDeterminingGenres = selectedUserItemType;
    } else if (
      activeCategoryDef?.value === CATEGORY_OPTIONS_CONFIG.trending_week.value
    ) {
      typeForDeterminingGenres = selectedUserItemType;
    }

    if (typeForDeterminingGenres === USER_SELECTABLE_ITEM_TYPES.MOVIE)
      return GENRES;
    if (typeForDeterminingGenres === USER_SELECTABLE_ITEM_TYPES.TV)
      return TV_GENRES;

    return {};
  }, [selectedUserItemType, activeCategoryDef, isSearching]);

  const primaryFiltersKey = useMemo(
    () =>
      JSON.stringify(
        // Call JSON.stringify with the result of the IIFE
        (() => {
          // Start of Immediately Invoked Function Expression (IIFE)
          const baseKey = {
            search: debouncedSearchTerm,
            listCategory: isSearching ? "" : selectedListCategory,
            itemTypeForAPI: activeApiItemType,
          };

          // If in "discover" mode (and not searching), and the category allows API-side secondary filtering,
          // then changes to these secondary filters should trigger a new primary fetch.
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
        })() // End of IIFE: invoke the function, its result is passed to JSON.stringify
      ),
    [
      isSearching,
      selectedListCategory,
      activeApiItemType,
      debouncedSearchTerm,
      activeCategoryDef, // Added dependency
      selectedGenre, // Added dependency
      selectedRating, // Added dependency
      selectedYear, // Added dependency
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
      if (isLoading && !isNewPrimaryFilterSet && pageToFetch > 1) {
        console.warn("fetchItems for pagination skipped: already loading");
        return;
      }
      setIsLoading(true);
      if (isNewPrimaryFilterSet) setError(null);

      let endpoint = "";
      let apiParams = new URLSearchParams({
        api_key: API_KEY,
        page: pageToFetch.toString(),
        language: "en-US",
        include_adult: "true",
      });
      let effectiveItemTypeForNormalization = activeApiItemType; // This is what API is queried with
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
          endpoint += "multi"; // activeApiItemType would be MOVIE or TV from toggle, but API needs "multi"
          // effectiveItemTypeForNormalization will be ALL for multi-search
          effectiveItemTypeForNormalization = API_ITEM_TYPES.ALL;
        }
        apiParams.append("query", debouncedSearchTerm);
      } else {
        titleForDisplay = currentCategoryDef.label;
        if (currentCategoryDef.subLabel)
          titleForDisplay += ` ${currentCategoryDef.subLabel}`;
        TitleIcon = currentCategoryDef.icon || ListFilter;

        if (
          currentCategoryDef.value === CATEGORY_OPTIONS_CONFIG.discover.value
        ) {
          endpoint =
            activeApiItemType === API_ITEM_TYPES.TV
              ? "discover/tv"
              : "discover/movie";
          titleForDisplay += ` ${
            activeApiItemType === API_ITEM_TYPES.MOVIE ? "Movies" : "TV Shows"
          }`;
          if (
            selectedGenre !== "All" &&
            !isGenreFilterDisabled &&
            currentGenresForFilterDropdown[selectedGenre]
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
          apiParams.append("sort_by", currentCategoryDef.defaultSort);
        } else {
          // Other predefined categories
          if (currentCategoryDef.apiPathAll) {
            endpoint = currentCategoryDef.apiPathAll;
            effectiveItemTypeForNormalization = API_ITEM_TYPES.ALL; // API returns mixed
            if (
              selectedUserItemType !== API_ITEM_TYPES.ALL &&
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
        console.warn("No API endpoint. Clearing items.");
        setApiFetchedItems([]);
        setHasMore(false);
        setIsLoading(false);
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
        setHasMore(
          pageToFetch < (data.total_pages || 0) && normalizedNewItems.length > 0
        );
        // DEBUG LOG
        // console.log(`fetchItems (page ${pageToFetch}): total_pages=${data.total_pages}, newItemsCount=${normalizedNewItems.length}, hasMore set to: ${pageToFetch < (data.total_pages || 0) && normalizedNewItems.length > 0}`);

        if (isNewPrimaryFilterSet || pageToFetch === 1)
          previousPrimaryFiltersKey.current = primaryFiltersKey;
      } catch (err) {
        console.error("Error fetching items:", err);
        setError(err.message || "Failed to load data.");
        setHasMore(false);
      } finally {
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
      // isLoading, // Removed as per previous suggestion
      currentGenresForFilterDropdown,
      selectedUserItemType,
      isGenreFilterDisabled,
      isRatingFilterDisabled,
      isYearFilterDisabled,
      activeCategoryDef, // Added as it's used in fetchItems logic
    ]
  );

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchTerm !== debouncedSearchTerm)
        setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  useEffect(() => {
    // Update URL
    const newParams = new URLSearchParams();
    if (isSearching) {
      newParams.set("search", debouncedSearchTerm);
      if (selectedUserItemType !== DEFAULT_USER_ITEM_TYPE)
        newParams.set("itemType", selectedUserItemType);
      if (selectedGenre !== "All") newParams.set("genre", selectedGenre);
      if (selectedRating !== RATING_OPTIONS.All.value)
        newParams.set("rating", selectedRating);
      if (selectedYear !== "All") newParams.set("year", selectedYear);
    } else {
      if (
        selectedListCategory &&
        selectedListCategory !== DEFAULT_CATEGORY_VALUE
      )
        newParams.set("listCategory", selectedListCategory);
      const categoryDef = CATEGORY_OPTIONS_CONFIG[selectedListCategory];
      const typeForURL = categoryDef?.itemTypeLock || selectedUserItemType;
      if (typeForURL !== DEFAULT_USER_ITEM_TYPE)
        newParams.set("itemType", typeForURL);
      if (
        (categoryDef && categoryDef.allowsSecondaryFiltersInAPI) ||
        !categoryDef?.itemTypeLock
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
    isGenreFilterDisabled,
    isRatingFilterDisabled,
    isYearFilterDisabled,
    router,
    searchParams,
  ]);

  useEffect(() => {
    // Main data fetching trigger
    const isInitialMount = !isMounted.current;
    if (isInitialMount) {
      isMounted.current = true;
    }

    // Try context restoration on initial mount if primary filters match context key
    if (
      isInitialMount &&
      moviesState.filtersKey === primaryFiltersKey &&
      moviesState.items?.length > 0 &&
      moviesState.page > 0
    ) {
      setApiFetchedItems(moviesState.items);
      setPage(moviesState.page || 1);
      setCurrentDisplayTitle(moviesState.currentDisplayTitle || <>&nbsp;</>);
      setHasMore(true); // Key line for context restore
      setIsLoading(false);
      previousPrimaryFiltersKey.current = primaryFiltersKey; // Ensure this is set
      return;
    }

    // Fetch if:
    // 1. Initial mount and context not restored
    // 2. Or, primary filters changed (not initial mount)
    if (
      isInitialMount ||
      previousPrimaryFiltersKey.current !== primaryFiltersKey
    ) {
      if (!isInitialMount) {
        // If filters changed after initial mount, reset state
        setPage(1);
        setApiFetchedItems([]);
        setDisplayItems([]);
        setHasMore(true); // Optimistic for filter change
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      fetchItems(1, true);
    }
  }, [primaryFiltersKey, fetchItems, moviesState]);

  useEffect(() => {
    // Pagination
    if (!isMounted.current || page === 1) return;
    // DEBUG LOG
    // console.log(`Pagination useEffect: page=${page}, prevKey=${previousPrimaryFiltersKey.current}, currentKey=${primaryFiltersKey}, match=${previousPrimaryFiltersKey.current === primaryFiltersKey}`);
    if (previousPrimaryFiltersKey.current === primaryFiltersKey) {
      // console.log(`Pagination useEffect: Calling fetchItems for page ${page}`);
      fetchItems(page, false);
    } else {
      // console.warn(`Pagination useEffect: Skipped fetchItems for page ${page} due to key mismatch.`);
    }
  }, [page, primaryFiltersKey, fetchItems]);

  // Effect to reset auto-fetch attempts when primary or secondary client-side filters change
  useEffect(() => {
    setAutoFetchState({ isActive: false, attemptsDone: 0 });
  }, [
    primaryFiltersKey,
    selectedUserItemType, // For trending/multi-search type filter
    selectedGenre,
    selectedRating,
    selectedYear, // Secondary client-side filters
  ]);

  // Effect to derive displayItems from apiFetchedItems and apply client-side filters
  useEffect(() => {
    let itemsToProcess = [...apiFetchedItems];

    // Client-side Item Type filter (if API returned "ALL")
    if (
      activeApiItemType === API_ITEM_TYPES.ALL &&
      selectedUserItemType !== API_ITEM_TYPES.ALL
    ) {
      itemsToProcess = itemsToProcess.filter(
        (item) => item.media_type === selectedUserItemType.toLowerCase()
      );
    }

    // Secondary client-side filters (genre, rating, year)
    const needsClientSideSecondaryFiltering =
      isSearching ||
      (activeCategoryDef && !activeCategoryDef.allowsSecondaryFiltersInAPI);
    if (needsClientSideSecondaryFiltering) {
      itemsToProcess = itemsToProcess.filter((item) => {
        if (!item) return false;
        let match = true;
        if (
          !isGenreFilterDisabled &&
          selectedGenre !== "All" &&
          item.genre_ids
        ) {
          match = match && item.genre_ids.includes(Number(selectedGenre));
        }
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
        if (
          !isYearFilterDisabled &&
          selectedYear !== "All" &&
          item.displayDate
        ) {
          const itemYear = new Date(item.displayDate).getFullYear();
          const group = YEAR_GROUPS.find((g) => g.value === selectedYear);
          if (group?.from && group?.to) {
            const from = new Date(group.from).getFullYear(),
              to = new Date(group.to).getFullYear();
            match = match && itemYear >= from && itemYear <= to;
          } else if (group?.value !== "All") match = false;
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
    isGenreFilterDisabled,
    isRatingFilterDisabled,
    isYearFilterDisabled,
    filterBlockedContent,
    activeApiItemType,
  ]);

  // Effect to decide and manage auto-fetching if displayItems is empty after client filtering
  useEffect(() => {
    if (isLoading) {
      // If currently loading (API call in progress), wait for it to complete.
      // autoFetchState.isActive might be true if this load was triggered by an auto-fetch.
      return;
    }

    // If an auto-fetch was active and loading just finished:
    if (autoFetchState.isActive) {
      // !isLoading is true here
      // The API fetch is done, and displayItems has been re-calculated by its own effect.
      // Mark this specific auto-fetch action's loading phase as complete.
      // The component will re-evaluate if another auto-fetch attempt is needed based on the new displayItems.
      setAutoFetchState((prev) => ({ ...prev, isActive: false }));
      return; // Allow re-render and re-evaluation in the next cycle.
    }

    // Conditions to consider starting a new auto-fetch attempt:
    const shouldStartAutoFetch =
      displayItems.length === 0 && // 1. No items are currently displayed.
      apiFetchedItems.length > 0 && // 2. API did return *some* items (so it's a client filter issue).
      hasMore && // 3. The API *might* have more pages.
      autoFetchState.attemptsDone < MAX_AUTO_FETCH_ATTEMPTS; // 4. Haven't exhausted attempts.

    if (shouldStartAutoFetch) {
      // Activate auto-fetch and increment attempt count.
      // This will trigger the next useEffect to call loadMoreItems.
      setAutoFetchState((prev) => ({
        isActive: true,
        attemptsDone: prev.attemptsDone + 1,
      }));
    }
  }, [
    displayItems, // Crucial: re-evaluate when displayItems changes
    apiFetchedItems, // Source of truth from API
    hasMore, // API pagination status
    isLoading, // Current loading status
    autoFetchState, // Current auto-fetch status
    // MAX_AUTO_FETCH_ATTEMPTS is a constant, not strictly needed but good for clarity
  ]);

  const loadMoreItems = useCallback(() => {
    if (!isLoading && hasMore) setPage((prev) => prev + 1);
  }, [isLoading, hasMore]);

  // Effect to *trigger* loadMoreItems if auto-fetch is active and not already loading
  useEffect(() => {
    if (autoFetchState.isActive && !isLoading) {
      loadMoreItems(); // This will increment page, call fetchItems, which sets isLoading=true
    }
  }, [autoFetchState.isActive, isLoading, loadMoreItems]);

  useEffect(() => {
    // Update context
    if (
      previousPrimaryFiltersKey.current === primaryFiltersKey &&
      isMounted.current
    ) {
      setMoviesState({
        items: apiFetchedItems,
        page,
        filtersKey: primaryFiltersKey,
        selectedUserItemType,
        selectedListCategory,
        currentDisplayTitle,
        selectedGenre,
        selectedRating,
        selectedYear,
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
    setMoviesState,
  ]);

  useEffect(() => {
    // Scroll handling
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 300 && // Adjusted threshold
        !isLoading &&
        hasMore
      ) {
        // DEBUG LOG
        // console.log("Scroll threshold reached, calling loadMoreItems(). isLoading:", isLoading, "hasMore:", hasMore);
        loadMoreItems();
      }
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoading, hasMore, loadMoreItems]);

  // Effect to proactively check if more items should be loaded if the user
  // is already at the bottom of the page when a loading operation completes.
  useEffect(() => {
    if (!isLoading && hasMore) {
      // Just finished loading, and there's potentially more to load
      // Check if we are already at/near the bottom of the page
      const scrollThresholdMet =
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 300; // Use the same threshold as handleScroll

      if (scrollThresholdMet) {
        // console.log("Auto-triggering loadMoreItems post-load as scroll threshold is met.");
        loadMoreItems();
      }
    }
  }, [isLoading, hasMore, loadMoreItems]); // Re-run when loading state or hasMore changes

  const handleUserItemTypeChange = (newType) => {
    setSelectedUserItemType(newType);
    const categoryDef = CATEGORY_OPTIONS_CONFIG[selectedListCategory];
    if (
      !isSearching &&
      categoryDef?.itemTypeLock &&
      categoryDef.itemTypeLock !== newType
    ) {
      setSelectedListCategory(DEFAULT_CATEGORY_VALUE);
      setSelectedGenre("All");
      setSelectedRating(RATING_OPTIONS.All.value);
      setSelectedYear("All");
    } else if (newType !== activeApiItemType) {
      // Reset genre if type changes and it affects genre list
      setSelectedGenre("All");
      // For discover, if type changes, secondary filters might need reset as they are API driven
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
    setSearchTerm("");
    setDebouncedSearchTerm(""); // Clear search
    const categoryDef = CATEGORY_OPTIONS_CONFIG[newCategoryValue];
    if (categoryDef?.itemTypeLock)
      setSelectedUserItemType(categoryDef.itemTypeLock);
    setSelectedGenre("All");
    setSelectedRating(RATING_OPTIONS.All.value);
    setSelectedYear("All");
  };

  const handleSecondaryFilterChange = (setter) => (e) => setter(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
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

  return (
    <div className="space-y-4 md:space-y-6 pb-8">
      <div className="container mx-auto px-3 sm:px-4 md:px-0 pt-6 pb-2 text-center">
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary flex items-center justify-center gap-x-2.5">
          {currentDisplayTitle}
        </div>
      </div>

      <div className="py-4 bg-transparent border-y border-border/60 dark:border-border/30">
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
                    !isSearching
                  )
                    return null;
                  let prefix = "";
                  if (cat.icon) {
                    // Simple emoji prefixes
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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

      {error && !isLoading && displayItems.length === 0 && (
        <div className="text-center py-10 container mx-auto">
          <p className="text-destructive text-lg mb-2">Error: {error}</p>
          <p className="text-muted-foreground">
            Could not load content. Please try adjusting filters or refresh.
          </p>
        </div>
      )}
      {error && !isLoading && displayItems.length > 0 && (
        <div className="text-center py-2 text-destructive text-sm container mx-auto">
          <p>
            Error loading more items: {error}. Previously loaded items are
            shown.
          </p>
        </div>
      )}

      {/* Shimmer Loading:
          1. Initial load (isLoading, no apiFetchedItems yet, page 1, not in auto-fetch decision phase)
          2. Auto-fetching and no displayable items found yet.
      */}
      {((isLoading &&
        apiFetchedItems.length === 0 &&
        page === 1 &&
        !autoFetchState.isActive) ||
        (autoFetchState.isActive && displayItems.length === 0)) &&
        !error && (
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

      {displayItems.length > 0 && ( // Always render grid if displayItems exist, error for pagination handled separately
        <div className="container mx-auto mt-6 min-h-[50vh]">
          <MoviesGrid movies={displayItems} />
        </div>
      )}

      {/* Loading Indicator for "Loading More..." (standard pagination) */}
      {isLoading &&
        displayItems.length > 0 &&
        page > 1 &&
        !autoFetchState.isActive &&
        !error && (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary dark:border-primary/70 border-t-transparent"></div>
            <p className="text-muted-foreground mt-2 text-sm">
              Loading more...
            </p>
          </div>
        )}

      {/* No Results Message (Definitive) */}
      {!isLoading && // Not currently loading
        !autoFetchState.isActive && // Not in an active auto-fetch decision/action cycle
        displayItems.length === 0 &&
        !error && // No error occurred
        isMounted.current && (
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
              {activeCategoryDef &&
              !isSearching &&
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
