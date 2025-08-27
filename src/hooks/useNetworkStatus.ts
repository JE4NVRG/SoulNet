import { useEffect, useState } from 'react';

export type NetworkStatus = {
  online: boolean;
  lastChangeAt: number | null;
};

export default function useNetworkStatus(): NetworkStatus {
  const [online, setOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [lastChangeAt, setLastChangeAt] = useState<number | null>(null);

  useEffect(() => {
    const on = () => { setOnline(true); setLastChangeAt(Date.now()); };
    const off = () => { setOnline(false); setLastChangeAt(Date.now()); };

    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return { online, lastChangeAt };
}