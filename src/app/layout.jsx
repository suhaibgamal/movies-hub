// src/app/layout.jsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthProvider from "./api/auth/AuthProvider";
import ProgressBar from "./components/ProgressBar";
import { MoviesListProvider } from "@/app/context/MoviesListContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = GeistSans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Improves font display performance
});

const geistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap", // Improves font display performance
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
    "movies",
    "TV shows",
    "film",
    "series",
    "cinema",
    "watch trailers",
    "movie details",
    "TV series details",
    "streaming guide",
    "entertainment discovery",
    "movie watchlist",
    "TV show watchlist",
    "movie recommendations",
    "TV show recommendations",
    "new releases",
    "popular movies",
    "top rated tv shows",
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
    creator: "@suhaibgmal",
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
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
      style={{ colorScheme: "dark" }}
    >
      <head>
        {/* Preconnect to critical third-party domains */}
        <link
          rel="preconnect"
          href="https://api.themoviedb.org"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://image.tmdb.org"
          crossOrigin="anonymous"
        />

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
      <body className="bg-background text-foreground font-sans antialiased flex flex-col min-h-screen">
        <ProgressBar />
        <AuthProvider>
          <MoviesListProvider>
            <Header />
            <main className="flex-grow container mx-auto px-2 sm:px-4 py-6">
              {children}
            </main>
            <Footer />
          </MoviesListProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
