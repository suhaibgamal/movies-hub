"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function WatchPlayer({ movieId }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const email = session?.user?.email;
  const username = session?.user?.name;

  if (status === "loading") return null;

  // Privileged users can be identified by email or username
  const isPrivileged =
    email === "sohibgamal28@gmail.com" || username === "sohib"|| username === "suhib";

  if (isPrivileged) {
    return (
      <iframe
        src={`https://vidsrc.xyz/embed/movie/${movieId}`}
        className="w-full h-[500px] rounded-xl border shadow-md"
        allowFullScreen
      />
    );
  }

  // If not privileged, render nothing or a message.
  // For now, it implicitly returns undefined, rendering nothing.
}
