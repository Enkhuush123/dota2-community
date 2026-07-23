"use client";

import { useEffect } from "react";

export function Ping() {
  useEffect(() => {
    // Ping on load
    fetch("/api/user/ping", { method: "POST" }).catch(() => {});
    
    // Ping every 3 minutes
    const interval = setInterval(() => {
      fetch("/api/user/ping", { method: "POST" }).catch(() => {});
    }, 3 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
