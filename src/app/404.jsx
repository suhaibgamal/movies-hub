"use client";

import { useState } from "react";

export default function NotFound() {
  const [error] = useState("404 - Page Not Found");

  return (
    <main className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto text-center text-white">
        <header>
          <h1 className="text-4xl font-extrabold mb-4">Oops!</h1>
        </header>
        <section>
          <p className="text-lg mb-6">
            The page you're looking for doesn't exist.
          </p>
          <p className="mb-6">{error}</p>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl border border-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
            aria-label="Go back to home"
          >
            Go Back to Home
          </button>
        </section>
      </div>
    </main>
  );
}
