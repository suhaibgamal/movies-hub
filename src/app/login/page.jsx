// src/app/login/page.jsx
import LoginClient from "@/app/login/LoginClient";
import { Suspense } from "react";

export const metadata = {
  title: "Sign In | Movies Hub",
  description: "Access your personalized watchlist, and manage your account on Movies Hub.",
  alternates: { canonical: "https://movies.suhaeb.com/login" },
  robots: {
    index: true, // It's okay to index, but...
    follow: true, 
  }
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoadingFallback />}>
      <LoginClient />
    </Suspense>
  );
}

// ... keep your LoginPageLoadingFallback here ...
function LoginPageLoadingFallback() {
  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <div className="w-full max-w-md space-y-6 flex flex-col items-center">
             <div className="h-10 w-48 bg-muted rounded animate-pulse mb-8"></div>
             <div className="w-full h-12 bg-muted rounded-xl animate-pulse"></div>
             <div className="w-full h-12 bg-muted rounded-xl animate-pulse"></div>
             <div className="w-full h-12 bg-muted rounded-xl animate-pulse"></div>
        </div>
      </div>
    </main>
  );
}