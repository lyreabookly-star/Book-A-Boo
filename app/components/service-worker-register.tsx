"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!( "serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((registration) => registration.update().catch(() => undefined))
      .catch(() => {
        // The site remains usable if service-worker registration is unavailable.
      });
  }, []);

  return null;
}
