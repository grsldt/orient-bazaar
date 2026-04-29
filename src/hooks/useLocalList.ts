import { useCallback, useEffect, useState } from "react";

/** Tiny localStorage-backed string list with cross-tab sync. */
export function useLocalList(key: string) {
  const read = () => {
    try { return JSON.parse(localStorage.getItem(key) || "[]") as string[]; }
    catch { return []; }
  };
  const [items, setItems] = useState<string[]>(read);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === key) setItems(read()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const persist = useCallback((next: string[]) => {
    setItems(next);
    localStorage.setItem(key, JSON.stringify(next));
  }, [key]);

  const has = useCallback((id: string) => items.includes(id), [items]);
  const toggle = useCallback((id: string) => {
    persist(items.includes(id) ? items.filter((x) => x !== id) : [id, ...items].slice(0, 200));
  }, [items, persist]);
  const remove = useCallback((id: string) => persist(items.filter((x) => x !== id)), [items, persist]);
  const clear = useCallback(() => persist([]), [persist]);
  const add = useCallback((id: string) => { if (!items.includes(id)) persist([id, ...items].slice(0, 200)); }, [items, persist]);

  return { items, has, toggle, remove, clear, add };
}
