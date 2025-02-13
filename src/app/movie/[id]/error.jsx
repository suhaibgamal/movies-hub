"use client";

import Link from "next/link";

export default function ErrorBoundary() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-home-background">
      <h1 className="text-4xl font-bold text-red-600 mb-4">
        Oops! Something went wrong.
      </h1>
      <p className="text-lg text-gray-300 mb-6">
        We couldn't load the movie details. Please try again later.
      </p>
      <Link href="/" className="text-blue-500 hover:underline">
        Home
      </Link>
    </div>
  );
}
