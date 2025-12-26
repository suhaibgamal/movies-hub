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
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL("https://movies.suhaeb.com"),
  // 1. Optimized Title with a clear default
  title: {
    default: "Movies Hub | Discover & Track Movies by Suhaeb",
    template: "%s | Movies Hub",
  },
  // 2. Clear, natural language description (Google uses this for snippets)
  description: "A personal movie discovery platform built by Suhaeb Gamal. Browse trending movies, manage your watchlist, and view detailed cast information.",
  
  // 3. Keywords: Kept only the relevant, specific ones.
  keywords: ["Suhaeb Gamal", "Movies Hub", "Next.js Movie App", "Personal Portfolio", "Movie Database"],
  
  authors: [{ name: "Suhaeb Gamal", url: "https://suhaeb.com" }],
  creator: "Suhaeb Gamal",
  
  // 4. Canonical URL helps Google know this is the 'real' version of the page
  alternates: {
    canonical: './',
  },

  openGraph: {
    title: "Movies Hub - Discover Movies & TV Shows",
    description: "Your ultimate destination for movie and TV show discovery.",
    url: "https://movies.suhaeb.com",
    siteName: "Movies Hub by Suhaeb",
    images: [
      {
        url: "/images/default-og.png",
        width: 1200,
        height: 630,
        alt: "Movies Hub Interface",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* These hints are excellent, keep them */}
        <link rel="preconnect" href="https://api.themoviedb.org" />
        <link rel="dns-prefetch" href="https://api.themoviedb.org" />
        <link rel="preconnect" href="https://image.tmdb.org" />
        <link rel="dns-prefetch" href="https://image.tmdb.org" />
        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
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
