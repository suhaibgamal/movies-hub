"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginClient() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      username: form.username,
      password: form.password,
    });
    if (res.error) {
      setError("Invalid username or password.");
    } else {
      router.push("/");
    }
  };

  const handleGoogleLogin = async () => {
    await signIn("google");
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent p-4 text-center mb-8">
          Login
        </h1>
        <form
          onSubmit={handleCredentialsLogin}
          className="w-full flex flex-col items-center gap-4 mb-8"
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
              className="w-3/4 md:w-1/2 px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-blue-500 transition-all"
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
              className="w-3/4 md:w-1/2 px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          {error && <div className="text-destructive">{error}</div>}
          <button
            type="submit"
            disabled={!form.username || !form.password}
            className={`px-6 py-2 md:px-8 md:py-3 lg:px-12 lg:py-4 text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg focus:ring-4 focus:ring-blue-500 focus:outline-none transition-all hover:from-blue-400 hover:to-purple-400 ${
              !form.username || !form.password
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
            aria-label="Login with Credentials"
          >
            Login with Credentials
          </button>
        </form>
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleGoogleLogin}
            className="px-6 py-2 md:px-8 md:py-3 lg:px-12 lg:py-4 text-white bg-gradient-to-r from-red-500 to-pink-500 rounded-lg focus:ring-4 focus:ring-red-500 focus:outline-none transition-all hover:from-red-400 hover:to-pink-400"
            aria-label="Login wiht Google"
          >
            Login with Google
          </button>
          <div className="flex items-center">
            <span className="text-foreground text-sm md:text-lg lg:text-xl p-4">
              New?
            </span>
            <Link
              href="/register"
              className="text-sm md:text-lg lg:text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent py-4"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
