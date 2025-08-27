import { useEffect, useState } from "react";

export function useOfflineSync() {
  const [online, setOnline] = useState<boolean>(navigator.onLine);
  const [queueSize, setQueueSize] = useState<number>(0);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // TODO: integrar com Background Sync/IndexedDB (4.1); por enquanto retorna estado básico
  return { online, queueSize, enqueue: (_: any) => {}, flush: async () => {} };
}

export default useOfflineSync;