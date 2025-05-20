// src/app/random/page.jsx
import RandomClient from "@/app/random/RandomMovieClient"; // Assuming RandomMovieClient is the correct component name

export const metadata = {
  title: "Random Movie & TV Show Picker - Movies Hub",
  description:
    "Can't decide what to watch? Let Movies Hub pick a random movie or TV show for you, with options to filter by genre, rating, and year.",
  alternates: {
    canonical: "https://movies.suhaeb.com/random",
  },
  openGraph: {
    title: "Random Picker - Movies Hub",
    description:
      "Discover your next watch with our random movie and TV show generator.",
    url: "https://movies.suhaeb.com/random",
    images: [
      {
        url: "https://movies.suhaeb.com/images/default-og.png",
        width: 1200,
        height: 630,
        alt: "Random Picker - Movies Hub",
      },
    ],
    siteName: "Movies Hub",
  },
  twitter: {
    card: "summary_large_image",
    title: "Random Picker - Movies Hub",
    description:
      "Discover your next watch with our random movie and TV show generator.",
    images: ["https://movies.suhaeb.com/images/default-og.png"],
  },
};

export default function RandomPage() {
  // This is a Server Component rendering a Client Component
  return <RandomClient />;
}
