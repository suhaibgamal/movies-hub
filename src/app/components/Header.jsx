"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBars, FaTimes, FaSun, FaMoon } from "react-icons/fa";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/app/components/ui/alert-dialog";

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);

  const toggleTheme = () => {
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.classList.add(savedTheme);
      setIsDark(savedTheme === "dark");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleHomeClick = (e) => {
    e.preventDefault();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="flex justify-between items-center p-5 bg-card">
        <div onClick={handleHomeClick} className="cursor-pointer">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Movies Hub
          </h1>
        </div>
        <div className="flex items-center h-full space-x-4">
          <button
            onClick={toggleTheme}
            className="text-card-foreground hover:text-muted-foreground"
            aria-label="Toggle Light/Dark Mode"
          >
            {isDark ? <FaSun size={24} /> : <FaMoon size={24} />}
          </button>
          <div className="lg:hidden">
            <button
              onClick={toggleMenu}
              className="text-card-foreground hover:text-muted-foreground"
            >
              {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
            </button>
          </div>
        </div>
        <nav
          className={`lg:flex lg:flex-row gap-6 font-semibold flex-col md:flex-col items-center ${
            isOpen ? "flex" : "hidden"
          }`}
        >
          {session ? (
            <>
              <div className="flex items-center gap-2 pr-4">
                <Image
                  src={session.user.image || "/images/user_profile.png"}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                  height={32}
                  width={32}
                  priority
                />
                <span className="text-card-foreground">
                  {session.user.name || session.user.email}
                </span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="text-card-foreground hover:text-muted-foreground">
                    Sign Out
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <p className="text-muted-foreground">
                      {session.user.name}! You will be signed out of your
                      account!
                    </p>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSignOut}>
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Link
              href="/login"
              className="text-card-foreground hover:text-muted-foreground"
            >
              Login
            </Link>
          )}
          <Link
            href="/watchlist"
            className="text-card-foreground hover:text-muted-foreground"
          >
            Watchlist
          </Link>
          <Link
            href="/random"
            className="text-card-foreground hover:text-muted-foreground"
          >
            Random
          </Link>
          <Link
            href="/about"
            className="text-card-foreground hover:text-muted-foreground"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
