"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function WatchPlayer({ movieId }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const email = session?.user?.email;

  // Only our privileged user
  if (status === "loading") return null;
  if (email === "sohibgamal28@gmail.com") {
    return (
      <iframe
        src={`https://vidsrc.xyz/embed/movie/${movieId}`}
        className="w-full h-[500px] rounded-xl border shadow-md"
        allowFullScreen
      />
    );
  }

  return (
    <button
      onClick={() => router.push(`https://vidsrc.xyz/embed/movie/${movieId}`)}
      className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-xl shadow"
    >
      Watch Now
    </button>
  );
}
