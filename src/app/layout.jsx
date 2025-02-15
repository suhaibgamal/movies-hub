// layout.jsx
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthProvider from "./api/auth/AuthProvider";
import ProgressBar from "./components/ProgressBar";
import { MoviesListProvider } from "@/app/context/MoviesListContext";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Movies Hub",
  description: "Discover and explore a wide range of movies with Movies Hub.",
  keywords: "movies, films, movie, film, cinema, reviews, trailers",
  author: {
    name: "Suhaib Gamal",
    email: "sohibgamal28@gmail.com",
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
      </body>
    </html>
  );
}
