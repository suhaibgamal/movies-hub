// src/app/login/LoginClient.jsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import Link from "next/link";

export default function LoginClient() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams(); // Get searchParams instance

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Get callbackUrl from URL query, default to "/" if not present
    const callbackUrlFromQuery = searchParams.get("callbackUrl") || "/";

    const res = await signIn("credentials", {
      redirect: false, // Prevent NextAuth from automatically redirecting
      username: form.username,
      password: form.password,
      callbackUrl: callbackUrlFromQuery, // Explicitly pass the resolved callbackUrl
    });

    if (res && res.error) {
      // Check if res exists before accessing res.error
      setError("Invalid username or password.");
    } else if (res && res.url) {
      router.push(res.url);
    } else {
      // Fallback if res is somehow null/undefined or res.url is not set, though unlikely on success
      router.push(callbackUrlFromQuery); // Or just router.push("/") as a last resort
    }
  };

  const handleGoogleLogin = async () => {
    const callbackUrlFromQuery = searchParams.get("callbackUrl") || "/";
    await signIn("google", { callbackUrl: callbackUrlFromQuery });
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent p-4 text-center mb-8">
          Login
        </h1>
        <form
          onSubmit={handleCredentialsLogin}
          className="w-full flex flex-col items-center gap-6 mb-8"
        >
          <div className="w-full flex flex-col items-center">
            <label
              htmlFor="username"
              className="text-foreground text-lg md:text-xl lg:text-2xl font-semibold mb-2"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-3/4 md:w-1/2 px-6 py-3 rounded-xl border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
            />
          </div>
          <div className="w-full flex flex-col items-center">
            <label
              htmlFor="password"
              className="text-foreground text-lg md:text-xl lg:text-2xl font-semibold mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-3/4 md:w-1/2 px-6 py-3 rounded-xl border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
            />
          </div>
          {error && <div className="text-destructive text-center">{error}</div>}
          <button
            type="submit"
            disabled={!form.username || !form.password}
            className={`w-3/4 md:w-1/2 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-blue-500 shadow-md transition-all ${
              !form.username || !form.password
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
            aria-label="Login with Credentials"
          >
            Login with Credentials
          </button>
        </form>
        <div className="w-full flex flex-col items-center gap-4">
          <button
            onClick={handleGoogleLogin}
            className="w-3/4 md:w-1/2 px-6 py-3 rounded-xl font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-primary shadow-md transition-all flex items-center justify-center gap-3"
            aria-label="Sign in with Google"
          >
            <FcGoogle className="h-5 w-5" />
            <span>Sign in with Google</span>
          </button>
          <div className="flex items-center mt-4">
            {" "}
            <span className="text-foreground text-sm md:text-lg lg:text-xl p-4">
              New?
            </span>
            <Link
              href="/register"
              className="text-sm md:text-lg lg:text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent py-4 hover:opacity-80 transition-opacity"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
