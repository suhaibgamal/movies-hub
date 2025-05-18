// src/app/random/page.jsx
import RandomClient from "@/app/random/RandomMovieClient"; // Ensure correct path
import { ChevronDown } from "lucide-react"; // This icon is now used in RandomClient, so no need to import it here if not used directly in this server page.

export const metadata = {
  title: "Random Picker - Movies Hub",
  description:
    "Let Movies Hub pick a random movie or TV show for you to watch.",
  alternates: { canonical: "https://movies.suhaeb.com/random" },
};

export default function RandomPage() {
  return <RandomClient />;
}
