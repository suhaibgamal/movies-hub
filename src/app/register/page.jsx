// app/register/page.jsx
import RegisterClient from "@/app/register/RegisterClient";

export const metadata = {
  title: "Join Movies Hub | Create Your Account",
  description: "Sign up for Movies Hub to start tracking your favorite movies, TV shows, and building your watchlist today.",
  alternates: { canonical: "https://movies.suhaeb.com/register" },
};

export default function RegisterPage() {
  return <RegisterClient />;
}