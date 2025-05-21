// c:\Users\Suhaib Gamal\Desktop\Programming\Front-End\NextJS\JavaScript\movies-hub\src\app\components\Header.jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/app/components/ui/alert-dialog";
import {
  Menu as MenuIcon,
  X as XIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  LogOut,
} from "lucide-react";

function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const { data: session } = useSession();
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    if (document.documentElement.classList.contains("dark")) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    setIsDark(newIsDark);
    localStorage.setItem("theme", newIsDark ? "dark" : "light");
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
    if (isOpen) setIsOpen(false); // Close menu if open
  };

  // Initialize theme from localStorage or system preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      setIsDark(savedTheme === "dark");
    } else {
      // No theme saved, use system preference and save it
      if (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
      ) {
        document.documentElement.classList.add("dark");
        setIsDark(true);
        localStorage.setItem("theme", "dark"); // Persist initial system preference
      } else {
        // System is light or no preference
        document.documentElement.classList.remove("dark");
        setIsDark(false);
        localStorage.setItem("theme", "light"); // Persist initial system preference
      }
    }
  }, []);

  const handleHomeClick = (e) => {
    // This function is now only used by the main "Movies Hub" logo link
    router.push("/");
    if (isOpen) setIsOpen(false); // Close menu if open
  };

  const navLinkClasses =
    "text-card-foreground hover:text-primary focus:outline-none focus-visible:text-primary focus-visible:underline focus-visible:underline-offset-4 transition-colors py-2 lg:py-0";
  const iconButtonClasses =
    "p-2 rounded-md text-card-foreground hover:bg-muted/80 dark:hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-all";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 dark:border-border/30 bg-card shadow-sm">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link
          href="/"
          onClick={handleHomeClick}
          className="focus:outline-none group"
        >
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-background rounded-sm">
            Movies Hub
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-6 font-medium">
          <Link href="/browse" className={navLinkClasses}>
            Browse
          </Link>
          <Link href="/watchlist" className={navLinkClasses}>
            Watchlist
          </Link>
          <Link href="/random" className={navLinkClasses}>
            Random
          </Link>
          <Link href="/about" className={navLinkClasses}>
            About
          </Link>

          {session ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2">
                <Image
                  unoptimized
                  src={session.user.image || "/images/user_profile.png"}
                  alt={session.user.name || "User"}
                  className="w-8 h-8 rounded-full"
                  height={32}
                  width={32}
                  priority
                />
                <span className="text-card-foreground py-0">
                  {session.user.name || session.user.email}
                </span>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    className={`${iconButtonClasses} px-2.5 py-1.5 text-sm flex items-center gap-1.5 bg-card hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20`}
                    aria-label="Sign Out"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you sure you want to sign out?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be logged out of your Movies Hub account.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSignOut}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Sign Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <Link
              href="/login"
              className={`${navLinkClasses} bg-primary text-primary-foreground px-4 py-1.5 rounded-md hover:bg-primary/90 hover:text-primary-foreground focus-visible:text-primary-foreground`}
            >
              Login
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className={iconButtonClasses}
            aria-label="Toggle Light/Dark Mode"
          >
            {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>
        </nav>

        {/* Mobile Menu Button & Theme Toggle (for mobile) */}
        <div className="lg:hidden flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className={iconButtonClasses}
            aria-label="Toggle Light/Dark Mode"
          >
            {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>
          <button
            onClick={toggleMenu}
            className={iconButtonClasses}
            aria-label="Toggle Menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-card shadow-md border-t border-border/60 dark:border-border/30">
          <nav className="flex flex-col space-y-2 p-4 font-medium">
            <Link
              href="/browse"
              onClick={() => setIsOpen(false)}
              className={navLinkClasses}
            >
              Browse
            </Link>
            <Link
              href="/watchlist"
              onClick={() => setIsOpen(false)}
              className={navLinkClasses}
            >
              Watchlist
            </Link>
            <Link
              href="/random"
              onClick={() => setIsOpen(false)}
              className={navLinkClasses}
            >
              Random
            </Link>
            <Link
              href="/about"
              onClick={() => setIsOpen(false)}
              className={navLinkClasses}
            >
              About
            </Link>

            <hr className="border-border/60 dark:border-border/30 my-2" />

            {session ? (
              <>
                <div className="flex items-center gap-2 py-2">
                  <Image
                    unoptimized
                    src={session.user.image || "/images/user_profile.png"}
                    alt={session.user.name || "User"}
                    className="w-8 h-8 rounded-full" // Removed focus/group styling
                    height={32}
                    width={32}
                    priority
                  />
                  <span className="text-card-foreground py-0">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      className={`${navLinkClasses} text-left flex items-center gap-1.5 text-destructive hover:text-destructive/80`}
                      aria-label="Sign Out"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you sure you want to sign out?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        You will be logged out of your Movies Hub account.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSignOut} // handleSignOut already closes menu if open
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sign Out
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className={`${navLinkClasses} bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-center`}
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
