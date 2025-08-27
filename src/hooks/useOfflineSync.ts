import { useCallback, useEffect, useState } from 'react';
import useNetworkStatus from './useNetworkStatus';

const LS_KEY = 'soulnet:offlineQueue';

type QueueItem = {
  id: string;                 // uuid
  path: string;               // ex.: '/api/memories'
  method: 'POST'|'PUT'|'DELETE';
  body?: any;
  createdAt: number;
};

function readQueue(): QueueItem[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
  catch { return []; }
}
function writeQueue(q: QueueItem[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(q));
}
function uuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function useOfflineSync() {
  const { online } = useNetworkStatus();
  const [queue, setQueue] = useState<QueueItem[]>(() => readQueue());

  // persist
  useEffect(() => { writeQueue(queue); }, [queue]);

  const queueSize = queue.length;
  const hasQueuedItems = queueSize > 0;

  const addToQueue = useCallback((item: Omit<QueueItem, 'id'|'createdAt'>) => {
    const next = [...queue, { ...item, id: uuid(), createdAt: Date.now() }];
    setQueue(next);
  }, [queue]);

  // compat: alias pedido no código antigo
  const enqueue = addToQueue;

  const flush = useCallback(async () => {
    if (!online || queue.length === 0) return;

    const remaining: QueueItem[] = [];
    for (const item of queue) {
      try {
        const res = await fetch(item.path, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });
        if (!res.ok) throw new Error(`Failed ${item.method} ${item.path}`);
      } catch (e) {
        // se falhar, mantém na fila
        remaining.push(item);
      }
    }
    setQueue(remaining);
  }, [online, queue]);

  // auto-flush quando voltar a conexão
  useEffect(() => { if (online) { void flush(); } }, [online, flush]);

  return {
    online,
    queueSize,
    hasQueuedItems,
    addToQueue,
    enqueue,   // alias
    flush,
  };
}

// Export named para compatibilidade
export { useOfflineSync };