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
        url: "/images/default-og.png", // Relative to /public [cite: 49]
        width: 1200,
        height: 630,
        alt: "Movies Hub - Your Guide to Movies & TV Shows", // More descriptive alt
      },
      // You can add more images here if needed
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image", // [cite: 50]
    title: "Movies Hub - Discover Movies & TV Shows", // [cite: 50]
    description:
      "Explore movies & TV shows, watch trailers, manage watchlists, and find your next favorite on Movies Hub.",
    creator: "@YourTwitterHandle",
    images: ["/images/default-og.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false, // Allow caching
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false, // Allow image indexing
      "max-video-preview": -1, // Allow any length for video preview
      "max-image-preview": "large", // Show large image previews
      "max-snippet": -1, // Allow any length for snippets
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark`} // Assuming dark is your default theme based on merged_project
      style={{ colorScheme: "dark" }} // Helps browser adapt UI elements like scrollbars
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
        {/* DNS-prefetch as a fallback or for other less critical domains if needed */}
        {/* <link rel="dns-prefetch" href="https://api.themoviedb.org" /> */}
        {/* <link rel="dns-prefetch" href="https://image.tmdb.org" /> */}
        {/* Consider preconnecting to Vercel's analytics/insights if they are always loaded */}
        {/* <link rel="preconnect" href="https://vitals.vercel-insights.com" crossOrigin="anonymous" /> */}
      </head>
      <body className="bg-background text-foreground font-sans antialiased flex flex-col min-h-screen">
        <ProgressBar />
        <AuthProvider>
          <MoviesListProvider>
            {" "}
            {/* Evaluate if this is needed globally or can be scoped tighter */}
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
