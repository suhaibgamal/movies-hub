// app/random/page.jsx (Server Component)
import RandomMovieClient from "@/app/random/RandomMovieClient";

export const metadata = {
  title: "Movies Hub - Random Movie Picker",
  description: "Let Movies Hub pick a random movie for you.",
  alternates: { canonical: "https://movies-hub-explore.vercel.app/random" },
};

export default function RandomMoviePage() {
  return <RandomMovieClient />;
}
