"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const intervalRef = useRef(null);
  const safetyTimeoutRef = useRef(null);
  const prevUrlRef = useRef(pathname + (searchParams?.toString() || ""));

  // Build a full URL key (pathname + search params) to detect any navigation
  const currentUrl = pathname + (searchParams?.toString() || "");

  useEffect(() => {
    const handleClick = (event) => {
      // If click originated from a button (e.g. WatchlistButton inside a Link card),
      // it's an action, not a navigation — skip the progress bar
      let clickedElement = event.target;
      while (clickedElement && clickedElement.tagName !== "A") {
        if (clickedElement.tagName === "BUTTON") return;
        clickedElement = clickedElement.parentElement;
      }

      let target = event.target;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href || !href.startsWith("/") || href.startsWith("//")) return;

      // Don't start loading if clicking a link to the current page
      const hrefPathname = href.split("?")[0].split("#")[0];
      const currentPathname = pathname;
      if (hrefPathname === currentPathname) return;

      // Don't start if it's a hash-only link
      if (href.startsWith("#")) return;

      if (!isLoading) {
        setIsLoading(true);
        setVisible(true);
        setProgress(0);
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isLoading, pathname]);

  // Progress animation while loading
  useEffect(() => {
    if (isLoading) {
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + Math.random() * 10;
          return prev;
        });
      }, 300);

      // Safety timeout: auto-complete after 8s if navigation doesn't finish
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = setTimeout(() => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setProgress(100);
        setTimeout(() => {
          setVisible(false);
          setIsLoading(false);
          setProgress(0);
        }, 300);
      }, 8000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
    };
  }, [isLoading]);

  // Complete the bar when URL actually changes
  useEffect(() => {
    if (currentUrl !== prevUrlRef.current && isLoading) {
      prevUrlRef.current = currentUrl;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }
      setProgress(100);
      const timeout = setTimeout(() => {
        setVisible(false);
        setIsLoading(false);
        setProgress(0);
      }, 300);

      return () => clearTimeout(timeout);
    } else if (currentUrl !== prevUrlRef.current) {
      // URL changed without loading state (e.g. browser back/forward)
      prevUrlRef.current = currentUrl;
    }
  }, [currentUrl, isLoading]);

  if (!visible) return null;

  return (
    <div className="progress-bar-container">
      <div className="progress-bar" style={{ width: `${progress}%` }} />
      <style jsx>{`
        .progress-bar-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          z-index: 9999;
          background: transparent;
        }
        .progress-bar {
          height: 100%;
          background: #29d;
          transition: width 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

