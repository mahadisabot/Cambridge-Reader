import React, { createContext, useContext, useRef, useCallback } from 'react';
import { invoke, convertFileSrc } from '@tauri-apps/api/core';

interface CoverCacheContextType {
    getCachedCover: (url: string) => string | undefined;
    preloadCover: (url: string, bookId?: string) => Promise<void>;
}

const CoverCacheContext = createContext<CoverCacheContextType>({
    getCachedCover: () => undefined,
    preloadCover: async () => { },
});

export const useCoverCache = () => useContext(CoverCacheContext);

export const CoverCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Memory Cache: Original URL -> Blob URL
    const cache = useRef<Map<string, string>>(new Map());
    // In-flight requests to deduplicate fetches
    const pending = useRef<Map<string, Promise<void>>>(new Map());

    const getCachedCover = useCallback((url: string) => {
        if (!url) return undefined;
        if (cache.current.has(url)) {
            return cache.current.get(url);
        }
        // Optimistic: If it's a local path, convert immediately so it's available on first render
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            try {
                // We don't write to cache here to avoid side-effects during render (Reference safety)
                // preloadCover will populate the cache properly later, or we just re-compute this cheap string.
                return convertFileSrc(url);
            } catch (e) {
                return undefined;
            }
        }
        return undefined;
    }, []);

    const preloadCover = useCallback(async (url: string, bookId?: string) => {
        if (!url) return;
        if (cache.current.has(url)) return;

        // Deduplication: Return existing promise if already fetching
        if (pending.current.has(url)) {
            return pending.current.get(url)!;
        }

        // Optimization: For local files, use Asset Protocol (instant, no invoke overhead)
        const isRemote = url.startsWith('http://') || url.startsWith('https://');
        if (!isRemote) {
            // Assume it's a local file path if not http
            try {
                const assetUrl = convertFileSrc(url);
                cache.current.set(url, assetUrl);
                return;
            } catch (e) {
                console.warn("convertFileSrc failed, falling back to fetch_cover", e);
            }
        }

        const fetchPromise = (async () => {
            try {
                // Fetch bytes from Rust (which handles Disk Cache by ID)
                // If bookId is provided, use it for cache key. If not, fallback to URL hash (legacy/safe)
                const bytes = await invoke<number[]>('fetch_cover', { url, bookId: bookId || "" });
                const blob = new Blob([new Uint8Array(bytes)]);
                const blobUrl = URL.createObjectURL(blob);

                cache.current.set(url, blobUrl);
            } catch (err) {
                console.error(`Failed to load cover for ${url}:`, err);
            } finally {
                pending.current.delete(url);
            }
        })();

        pending.current.set(url, fetchPromise);
        return fetchPromise;
    }, []);

    return (
        <CoverCacheContext.Provider value={{ getCachedCover, preloadCover }}>
            {children}
        </CoverCacheContext.Provider>
    );
};
