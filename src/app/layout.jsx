import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthProvider from "./api/auth/AuthProvider";
import ProgressBar from "./components/ProgressBar";

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

import { MoviesListProvider } from "@/app/context/MoviesListContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
      </body>
    </html>
  );
}
