"use client"; // not-found components must be client components

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md">
        <h1 className="text-6xl font-extrabold text-primary mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-foreground mb-6">
          Oops! Page Not Found.
        </h2>
        <p className="text-lg text-muted-foreground mb-8">
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background"
        >
          Go Back to Homepage
        </Link>
      </div>
    </main>
  );
}
