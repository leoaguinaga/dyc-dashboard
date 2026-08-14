"use client";

import { useEffect } from "react";

const RELOAD_FLAG = "dyc-stale-build-reload";

export function StaleBuildReload() {
  useEffect(() => {
    function onResourceError(event: Event) {
      const target = event.target as HTMLElement | null;
      const src =
        (target as HTMLLinkElement)?.href ?? (target as HTMLScriptElement)?.src;

      if (!src || !src.includes("/_next/static/")) return;

      if (sessionStorage.getItem(RELOAD_FLAG)) return;
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
    }

    window.addEventListener("error", onResourceError, true);
    return () => window.removeEventListener("error", onResourceError, true);
  }, []);

  return null;
}
