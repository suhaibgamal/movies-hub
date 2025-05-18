# Movies Hub 🎬

Welcome to Movies Hub! A modern, feature-rich web application designed for discovering, searching, and managing your favorite movies and TV shows. Built with Next.js 15 (App Router) for optimal performance and a sleek, responsive UI powered by TailwindCSS.

**Live Demo:** [https://movies.suhaeb.com](https://movies.suhaeb.com) 🚀 
*(Note: Replace with your actual live URL if different)*

## Features

* **Comprehensive Discovery:** Browse extensive catalogs of movies and TV shows.
* **Advanced Filtering & Search:**
    * Filter by categories (Discover, Popular, Top Rated, Trending This Week, Upcoming Movies).
    * Seamlessly toggle between discovering Movies and TV Shows.
    * Full-text search capabilities for titles.
    * Refine results by Genre, Rating, and Release/Air Year.
* **Detailed Information Pages:** In-depth views for both movies and TV shows, featuring:
    * Overviews, ratings, release/air dates, runtime/season count, taglines.
    * Embedded Trailers (from YouTube).
    * Top-billed cast with an option to view individual actor filmographies (currently movie roles).
    * For TV Shows: Interactive season and episode browser (fetches episode lists on demand).
    * Network information, series status, creators, and other relevant metadata.
    * Links to external sites like IMDb and official homepages (displaying hostnames).
    * Recommendations for similar content.
* **User Authentication:**
    * Secure account creation with username and password.
    * Option to sign in/register with Google (OAuth).
    * Persistent sessions managed by NextAuth.js.
* **Personalized Watchlist:**
    * Authenticated users can add/remove movies and TV shows to/from their personal watchlist.
    * Dedicated watchlist page with client-side filtering (All, Movies, TV).
    * Real-time UI updates reflecting watchlist status.
* **Random Picker:**
    * Can't decide what to watch? Use the random picker for movies or TV shows.
    * Option to filter random suggestions by genre.
* **External Watch Links:**
    * "Watch Now" / "Watch Series" / "Watch Episode" buttons redirect to an external streaming source aggregator (vidsrc.xyz) with a user disclaimer.
* **Responsive Design:** Fully responsive interface for optimal viewing on all devices (desktop, tablet, mobile).
* **Light/Dark Mode:** User-selectable theme toggling with preferences saved in local storage.
* **Optimized Performance:**
    * Built with Next.js 15 App Router, leveraging Server Components and Client Components appropriately.
    * Server-side data caching (`unstable_cache`) for TMDB API responses to reduce load times and API calls.
    * Image optimization using `next/image`.
    * Client-side state management with Zustand (for global watchlist status) and React Context (for movie list Browse state).
    * Efficient on-demand loading for TV show episode details using Server Actions.
* **User Experience Enhancements:**
    * Skeleton loaders for smoother perceived performance during data fetching.
    * Page transition progress bar.
    * Consistent UI elements and interactions across the application.

## Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) 15 (App Router)
* **Language:** JavaScript (with JSX)
* **Styling:** [TailwindCSS](https://tailwindcss.com/) with `postcss`
* **UI Components:** Custom components + elements inspired by/using [Shadcn UI](https://ui.shadcn.com/) principles (as suggested by `components.json` and UI primitives like `alert-dialog`, `button`).
* **Icons:** [Lucide React](https://lucide.dev/)
* **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Credentials & Google Provider)
* **Database ORM:** [Prisma](https://www.prisma.io/)
* **Database:** PostgreSQL (hosted on [Neon](https://neon.tech/))
* **API Data Source:** [The Movie Database (TMDB) API](https://www.themoviedb.org/documentation/api)
* **State Management:**
    * [Zustand](https://github.com/pmndrs/zustand) (for global client-side state like watchlist)
    * React Context (for UI-specific state like movie list Browse filters/results)
* **Form Validation:** [Zod](https://zod.dev/) (in backend API routes)
* **Linting:** ESLint with `eslint-config-next`
* **Deployment:** [Vercel](https://vercel.com/)

## Project Structure Highlights

* **`src/app/`**: Core application structure using Next.js App Router.
    * **Route Groups/Pages**: Separate directories for different sections (e.g., `/movie/[id]`, `/tv/[id]`, `/browse`, `/watchlist`, `/random`, `/about`, `/login`, `/register`). Each typically contains a `page.jsx`.
    * **`api/`**: Backend API routes.
        * `auth/`: Handles NextAuth.js setup and custom registration.
        * `watchList/`: Manages CRUD operations for user watchlists.
    * **`components/`**: Reusable React components.
        * `ui/`: Base UI primitives (e.g., `button.jsx`, `alert-dialog.jsx`).
        * Specific components like `MovieCard.jsx`, `SeriesCard.jsx`, `Header.jsx`, `TvSeasonsDisplay.jsx`, etc.
    * **`context/`**: React Context providers (e.g., `MoviesListContext.js`).
    * **`store/`**: Zustand store definitions (e.g., `watchlistStore.js`).
    * **`actions/`**: Server Actions (e.g., `tvActions.js` for fetching season details).
* **`lib/`**: Shared utility functions, TMDB API interaction logic (`tmdb.js`), and application constants (`constants.js`).
* **`prisma/`**: Database related files.
    * `schema.prisma`: Defines the database models (User, WatchlistItem).
    * `migrations/`: Contains database migration history.
* **`public/`**: Static assets like images (`tmdb_logo.svg`, `default.webp`, etc.) and `favicon.ico`.
* **Configuration Files**: `.env`, `.env.local`, `next.config.mjs`, `tailwind.config.mjs`, `postcss.config.mjs`, `jsconfig.json`, `components.json`, `eslint.config.mjs`.

## Environment Variables

To run this project, you need to set up the following environment variables. Create a `.env.local` file in the root directory:

```env
# Prisma / Database (e.g., Neon)
DATABASE_URL="your_neon_postgresql_connection_string_with_pooler"
POSTGRES_PRISMA_URL="your_neon_postgresql_connection_string_with_pgbouncer_true" # Often used by Vercel Data Proxy
POSTGRES_URL_NON_POOLING="your_neon_postgresql_direct_connection_string" # Used for Prisma migrations

# NextAuth.js
NEXTAUTH_SECRET="your_strong_random_nextauth_secret" # Recommended: openssl rand -base64 32
NEXTAUTH_URL="https://www.google.com/search?q=http://localhost:3000" # For local development. Vercel sets this in production.

# Google OAuth Provider (from Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_oauth_client_id"
GOOGLE_CLIENT_SECRET="your_google_oauth_client_secret"

# TMDB API (Get your v3 auth key from themoviedb.org)
NEXT_PUBLIC_TMDB_KEY="your_tmdb_api_key_v3"

# bcrypt salt rounds (optional, defaults to 12 in the registration API if not set)
BCRYPT_SALT_ROUNDS=12

# Optional: For temporarily disabling auth on detail pages during local development (remove for production)
# NEXT_PUBLIC_DEV_MODE_DISABLE_AUTH=false 
```

### Getting Started Locally

1. **Clone the Repository:**
    ```bash
    git clone https://github.com/suhaibgamal/movies-hub.git
    cd movies-hub
    ```
2. **Install Dependencies:**
    ```bash
    npm install
    # Or: yarn install / pnpm install / bun install
    ```
3. **Set Up Environment Variables:**
    - Create a `.env.local` file in the project root.
    - Copy the variable names from the "Environment Variables" section above.
    - Fill in your actual credentials and API keys.
4. **Database Setup (Prisma):**
    - Ensure your PostgreSQL database (e.g., Neon) is running and your `.env.local` has the correct `DATABASE_URL` (and `POSTGRES_URL_NON_POOLING` for migrations).
    - Apply database migrations to set up the schema:
      ```bash
      npx prisma migrate dev
      ```
    - Generate Prisma Client (this also runs on postinstall but can be run manually):
      ```bash
      npx prisma generate
      ```
5. **Run the Development Server:**
    ```bash
    npm run dev
    ```
6. **Open in Browser:**
    - Visit `http://localhost:3000` to view the application.

## Available Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production server (requires a prior build).
- `npm run lint`: Lints the codebase using ESLint.
- `npm run postinstall`: Automatically runs prisma generate after dependencies are installed.

## Deployment

This application is optimized for deployment on Vercel.

1. **Push to Git:** Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. **Import to Vercel:** Connect your Git repository to a new Vercel project.
3. **Configure Environment Variables:** In your Vercel project settings, add all the necessary environment variables listed above. Ensure `NEXTAUTH_URL` is set to your Vercel production domain (e.g., `https://your-project-name.vercel.app`).
4. **Build Command & Database:**
    - Vercel's build command will likely be `npm run build` (or `next build`). 
    - Your `package.json` correctly includes prisma generate in the build script.
5. **Database Migrations for Production:**
    - For applying database schema changes to your production Neon database, run:
      ```bash
      npx prisma migrate deploy
      ```
    - This can be integrated into a CI/CD pipeline or run manually before deployment.

## Data Attribution

This product uses the TMDb API but is not endorsed or certified by TMDb. All movie, TV show data, and related imagery are provided by The Movie Database (TMDb).
