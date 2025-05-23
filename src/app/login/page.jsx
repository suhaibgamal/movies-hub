// src/app/login/page.jsx
import LoginClient from "@/app/login/LoginClient";
import { Suspense } from "react"; // Import Suspense

export const metadata = {
  title: "Movies Hub - Login",
  description: "Login to your Movies Hub account.",
  alternates: { canonical: "https://movies.suhaeb.com/login" },
};

export default function LoginPage() {
  return (
    // Wrap LoginClient with Suspense
    <Suspense fallback={<LoginPageLoadingFallback />}>
      <LoginClient />
    </Suspense>
  );
}

// A simple loading fallback component for the login page
function LoginPageLoadingFallback() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent p-4 text-center mb-8">
          Login
        </h1>
        <div className="w-full max-w-md space-y-6">
          {/* Username Skeleton */}
          <div className="w-full flex flex-col items-center">
            <div className="text-foreground text-lg md:text-xl lg:text-2xl font-semibold mb-2 h-8 w-1/3 bg-muted rounded animate-pulse"></div>
            <div className="w-3/4 md:w-full h-12 px-6 py-3 rounded-xl border bg-card animate-pulse"></div>
          </div>
          {/* Password Skeleton */}
          <div className="w-full flex flex-col items-center">
            <div className="text-foreground text-lg md:text-xl lg:text-2xl font-semibold mb-2 h-8 w-1/3 bg-muted rounded animate-pulse"></div>
            <div className="w-3/4 md:w-full h-12 px-6 py-3 rounded-xl border bg-card animate-pulse"></div>
          </div>
          {/* Button Skeleton */}
          <div className="w-3/4 md:w-full h-12 px-6 py-3 rounded-xl bg-muted animate-pulse"></div>
          {/* Google Button Skeleton */}
          <div className="w-3/4 md:w-full h-12 px-6 py-3 rounded-xl bg-muted animate-pulse mt-4"></div>
        </div>
      </div>
    </main>
  );
}
