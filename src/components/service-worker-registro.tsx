"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistro() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Instalacao do app so e um extra - se falhar, o site continua
        // funcionando normalmente pelo navegador.
      });
    }
  }, []);

  return null;
}
