"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function ProgressBar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const intervalRef = useRef(null);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    const handleClick = (event) => {
      let target = event.target;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }
      if (!target) return;

      const href = target.getAttribute("href");
      if (href && href.startsWith("/") && !href.startsWith("//")) {
        if (!isLoading) {
          setIsLoading(true);
          setVisible(true);
          setProgress(0);
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isLoading]);
  useEffect(() => {
    if (isLoading) {
      if (intervalRef.current) clearInterval(intervalRef.current);

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 90) return prev + Math.random() * 10;
          return prev;
        });
      }, 300);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLoading]);
  useEffect(() => {
    if (pathname !== prevPathnameRef.current && isLoading) {
      prevPathnameRef.current = pathname;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setProgress(100);
      const timeout = setTimeout(() => {
        setVisible(false);
        setIsLoading(false);
        setProgress(0);
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [pathname, isLoading]);

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
          background: #29d; /* Change this color as desired */
          transition: width 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
