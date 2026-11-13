"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // The site remains usable if service-worker registration is unavailable.
    });
  }, []);

  return null;
}
