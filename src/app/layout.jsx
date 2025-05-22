// layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthProvider from "./api/auth/AuthProvider";
import ProgressBar from "./components/ProgressBar";
import { MoviesListProvider } from "@/app/context/MoviesListContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Improves font display performance
});

const geistMono = Geist_Mono({
  // Corrected: Use Geist_Mono (with underscore)
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://movies.suhaeb.com"),
  title: {
    default: "Movies Hub - Discover Movies & TV Shows",
    template: "%s - Movies Hub",
  },
  description:
    "Explore a vast collection of movies and TV shows on Movies Hub. Get details, watch trailers, manage your watchlist, and find your next favorite film or series. Your ultimate guide to entertainment.",
  keywords: [
    "movies-hub",
    "movies hub",
    "suhaeb.movies.com",
    "suhaib movies hub",
    "suhaeb movies hub",
    "movies by suhaib",
    "movies by suhaeb",
    "suhaib's movie hub",
    "suhaeb's movie hub",
    "suhaib",
    "suhaeb",
    "suhaeb movies",
    "movies",
    "TV shows",
    "TV series",
    "films",
    "series database",
    "movie database",
    "TV show database",
    "cinema listings",
    "online movie catalog",
    "online TV series catalog",
    "discover movies",
    "discover TV shows",
    "find movies",
    "find TV shows",
    "search movies",
    "search TV shows",
    "filter movies",
    "filter TV shows",
    "watch trailers",
    "movie details",
    "TV series details",
    "movie information",
    "TV show information",
    "movie ratings",
    "TV show ratings",
    "movie cast",
    "TV show cast",
    "actor filmography",
    "movie runtime",
    "TV show seasons",
    "TV show episodes",
    "entertainment discovery",
    "what to watch",
    "streaming availability",
    "movie streaming links",
    "TV show streaming links",
    "movie watchlist",
    "TV show watchlist",
    "track movies",
    "track TV shows",
    "random movie picker",
    "random TV show picker",
    "movie generator",
    "TV show generator",
    "movie recommendations",
    "TV show recommendations",
    "new movie releases",
    "upcoming movies",
    "popular movies",
    "top rated movies",
    "trending movies",
    "new TV shows",
    "popular TV shows",
    "top rated TV shows",
    "trending TV shows",
    "movie genres",
    "TV show genres",
  ],
  authors: [{ name: "Suhaeb Gamal", url: "https://suhaeb.com" }],
  creator: "Suhaeb Gamal",
  publisher: "Movies Hub",

  openGraph: {
    title: "Movies Hub - Discover Movies & TV Shows",
    description:
      "Your ultimate destination for movie and TV show discovery, watchlists, and recommendations.",
    url: "https://movies.suhaeb.com",
    siteName: "Movies Hub",
    images: [
      {
        url: "/images/default-og.png",
        width: 1200,
        height: 630,
        alt: "Movies Hub - Your Guide to Movies & TV Shows",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Movies Hub - Discover Movies & TV Shows",
    description:
      "Explore movies & TV shows, watch trailers, manage watchlists, and find your next favorite on Movies Hub.",
    creator: "@Suhaibgmal",
    images: ["/images/default-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect and DNS-prefetch hints for faster external connections */}
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="dns-prefetch" href="https://api.themoviedb.org" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />

        {/* Favicon & App Icons */}
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="48x48"
          href="/favicon-48x48.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon-180x180.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <ProgressBar />
        <AuthProvider>
          <Header />
          <main className="flex-grow">
            <MoviesListProvider>{children}</MoviesListProvider>
          </main>
          <Footer />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
