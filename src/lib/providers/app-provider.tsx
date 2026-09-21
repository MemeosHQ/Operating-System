"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Client app state: data-mode awareness, watchlist persistence
 * (localStorage until auth exists — the storage key/shape is designed to map
 * 1:1 onto a server-side UserWatchlist later), and global search control.
 */

export type WatchItem = {
  kind: "token" | "wallet" | "narrative" | "creator";
  id: string; // address or slug
  label: string;
  addedAt: number;
};

interface AppState {
  mode: "demo" | "live";
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  walletOpen: boolean;
  setWalletOpen: (open: boolean) => void;
  watchlist: WatchItem[];
  isWatched: (kind: WatchItem["kind"], id: string) => boolean;
  toggleWatch: (item: Omit<WatchItem, "addedAt">) => void;
}

const Ctx = createContext<AppState | null>(null);
const STORAGE_KEY = "memeos.watchlist.v1";

export function AppProvider({ mode, children }: { mode: "demo" | "live"; children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchItem[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setWatchlist(JSON.parse(raw));
    } catch {
      /* corrupted storage — start clean */
    }
  }, []);

  const persist = useCallback((next: WatchItem[]) => {
    setWatchlist(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* storage full/private — in-memory only */
    }
  }, []);

  const isWatched = useCallback(
    (kind: WatchItem["kind"], id: string) =>
      watchlist.some((w) => w.kind === kind && w.id === id),
    [watchlist]
  );

  const toggleWatch = useCallback(
    (item: Omit<WatchItem, "addedAt">) => {
      const exists = watchlist.some((w) => w.kind === item.kind && w.id === item.id);
      persist(
        exists
          ? watchlist.filter((w) => !(w.kind === item.kind && w.id === item.id))
          : [...watchlist, { ...item, addedAt: Date.now() }]
      );
    },
    [watchlist, persist]
  );

  /* "/" opens global search; Escape closes. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (e.key === "/" && !typing) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setWalletOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      searchOpen,
      setSearchOpen,
      walletOpen,
      setWalletOpen,
      watchlist,
      isWatched,
      toggleWatch,
    }),
    [mode, searchOpen, walletOpen, watchlist, isWatched, toggleWatch]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}
