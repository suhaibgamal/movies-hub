// app/register/RegisterClient.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterClient() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.username.trim()) {
      setError("Username is required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (typeof data.error === "object" && data.error !== null) {
          const messages = [];
          for (const field in data.error) {
            messages.push(`${field}: ${data.error[field].join(", ")}`);
          }
          setError(messages.join(" | "));
        } else {
          setError(data.error || "Registration failed. Please try again.");
        }
      } else {
        router.push("/login");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent p-4 text-center mb-8">
          Register
        </h1>
        <form
          onSubmit={handleSubmit}
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
              className="w-3/4 md:w-1/2 px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              autoComplete="username"
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
              className="w-3/4 md:w-1/2 px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              autoComplete="new-password"
            />
          </div>
          <div className="w-full flex flex-col items-center">
            <label
              htmlFor="confirmPassword"
              className="text-foreground text-lg md:text-xl lg:text-2xl font-semibold mb-2"
            >
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              className="w-3/4 md:w-1/2 px-6 py-3 rounded-xl border bg-card text-card-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all"
              required
              autoComplete="new-password"
            />
          </div>
          {error && <div className="text-destructive text-center">{error}</div>}
          <button
            type="submit"
            disabled={
              loading ||
              !form.username ||
              !form.password ||
              !form.confirmPassword
            }
            className={`px-6 py-2 md:px-8 md:py-3 lg:px-12 lg:py-4 text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg focus:ring-4 focus:ring-blue-500 focus:outline-none transition-all hover:from-blue-400 hover:to-purple-400 ${
              loading ||
              !form.username ||
              !form.password ||
              !form.confirmPassword
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer"
            }`}
            aria-label={loading ? "Registering..." : "Register"}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="flex">
          <p className="text-foreground text-sm md:text-lg lg:text-xl p-4 text-center">
            Already have an account?{" "}
          </p>
          <Link
            href="/login"
            className="text-sm md:text-lg lg:text-xl font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent py-4 text-center"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
