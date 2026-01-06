import { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import BookCard from './BookCard';
import Ripple from './Ripple';
import BookDetailModal from './BookDetailModal';

interface TrialBook {
    id: string;
    trial_id: string;
    name: string;
    pretty_url: string | null;
    cover_url: string | null;
}

interface SearchProps {
    onAdd: () => void;
    onLogout: () => void;
    ownedBooks?: any[]; // Using any[] to avoid importing Book interface circular dependency issues for now, or define locally
}

export default function Search({ onAdd, onLogout, ownedBooks = [] }: SearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<TrialBook[]>([]);
    const [loading, setLoading] = useState(false);
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true); // Assume more initially until proven empty
    const [moreLoading, setMoreLoading] = useState(false);
    const [selectedBook, setSelectedBook] = useState<TrialBook | null>(null);

    const handleSearch = async (e?: React.FormEvent, explicitQuery?: string) => {
        if (e) e.preventDefault();

        // Use explicit query if provided, otherwise fallback to state
        const targetQuery = explicitQuery ?? query;

        // Allow "*" as a "Show All" wildcard
        if (!targetQuery.trim() && targetQuery !== '*') return;

        setLoading(true);
        setError(null);
        setSearched(true);
        setResults([]);
        setRecentlyAdded(new Set());

        // If getting explicit input, ensure UI is synced (though setQuery is async)
        if (explicitQuery) setQuery(explicitQuery);

        try {
            // Send empty string if wildcard, effectively asking for "All"
            const effectiveQuery = targetQuery === '*' ? '' : targetQuery;
            const data = await invoke<TrialBook[]>('search_books', { query: effectiveQuery, page: 1 });
            setResults(data);
            setPage(1);
            setHasMore(data.length > 0);
        } catch (err: any) {
            setError("Search failed: " + err.toString());
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (book: TrialBook) => {
        if (addingIds.has(book.trial_id)) return;

        setAddingIds(prev => new Set(prev).add(book.trial_id));
        try {
            await invoke('add_to_library', { trialId: book.trial_id });
            // Mark as added locally immediately
            setRecentlyAdded(prev => new Set(prev).add(book.trial_id));
            onAdd();
        } catch (err: any) {
            const errorMsg = err.toString();
            if (errorMsg.includes("AUTH_EXPIRED")) {
                alert("Session Expired. Please login again.");
                onLogout();
                return;
            }
            alert("Failed to add book: " + errorMsg);
        } finally {
            setAddingIds(prev => {
                const next = new Set(prev);
                next.delete(book.trial_id);
                return next;
            });
        }
    };

    const handleLoadMore = useCallback(async () => {
        if (moreLoading || !hasMore) return;
        setMoreLoading(true);
        const nextPage = page + 1;

        try {
            const effectiveQuery = query === '*' ? '' : query;
            const data = await invoke<TrialBook[]>('search_books', { query: effectiveQuery, page: nextPage });
            if (data.length === 0) {
                setHasMore(false);
            } else {
                setResults(prev => [...prev, ...data]);
                setPage(nextPage);
            }
        } catch (err: any) {
            setError("Failed to load more: " + err.toString());
        } finally {
            setMoreLoading(false);
        }
    }, [query, page, hasMore, moreLoading]);



    // Infinite Scroll Observer (Effect-based)
    const loadingRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const node = loadingRef.current;
        if (!node || !hasMore) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !moreLoading) {
                handleLoadMore();
            }
        }, { root: null, rootMargin: '200px' });

        observer.observe(node);
        return () => observer.disconnect();
    }, [handleLoadMore, hasMore, moreLoading, results.length]);

    // Better: Make handleLoadMore stable or use a Ref to it.
    // Actually, simpler: just call the function directly if we include it in dependency.

    // Let's stick to the cleanest React pattern:
    // Effect depends on [handleLoadMore]. 
    // We wrap handleLoadMore in useCallback dependent on [page, moreLoading, hasMore].
    // Then effect is stable-ish.

    const isOwned = (trialId: string) => {
        // Check local explicit adds OR passed prop
        if (recentlyAdded.has(trialId)) return true;
        return ownedBooks.some(b => b.id === trialId || b.isbn === trialId);
    };

    const triggerShowAll = (e: React.SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setQuery('*');
        handleSearch(undefined, '*');
    };

    return (
        <div className="flex flex-col h-full relative">

            {/* Spotlight Search Container */}
            <motion.div
                layout
                className={`transition-all duration-500 ease-out ${results.length > 0 || searched ? 'py-4' : 'py-20 flex-1 flex flex-col justify-center'}`}
            >
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full group">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 rounded-full" />

                    <div className="relative flex items-center bg-card/40 backdrop-blur-xl border border-border rounded-2xl overflow-hidden focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-2xl">
                        <div className="pl-6 text-muted-foreground">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={query === '*' ? '' : query} // Don't show '*' to user
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search Cambridge Store..."
                            className="w-full bg-transparent border-none px-4 py-5 text-xl outline-none placeholder:text-muted-foreground/50 text-foreground font-medium"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || (!query.trim() && query !== '*')}
                            className="mr-2 relative overflow-hidden bg-primary/10 hover:bg-primary/20 text-primary px-6 py-2.5 rounded-xl font-medium transition-all disabled:opacity-0 disabled:scale-95 group"
                        >
                            <span className="relative z-10">
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
                                ) : 'Search'}
                            </span>
                            <Ripple color="rgba(var(--primary-rgb), 0.2)" />
                        </button>
                    </div>

                    {/* Search Suggestions or Hints (Only when idle) */}
                    {!searched && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center mt-6 space-y-4 opacity-70"
                        >
                            <div className="flex flex-wrap justify-center gap-2">
                                {/* SHOW ALL BUTTON - REWORKED WITH GLOW */}
                                <button
                                    type="button"
                                    onClick={triggerShowAll}
                                    className="relative group flex items-center gap-3 px-8 py-3 bg-card border border-primary/50 text-primary rounded-full font-bold text-sm uppercase tracking-widest hover:scale-105 transition-all duration-300 ring-2 ring-primary/20 hover:ring-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.6)]"
                                >
                                    <span className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <span className="text-xl">📚</span>
                                    <span className="relative z-10">Show Full Library</span>
                                </button>
                            </div>


                        </motion.div>
                    )}
                </form>
                {results.length > 0 && (
                    <p className="text-center text-xs text-muted-foreground mt-4 font-mono">
                        Showing {results.length} results
                    </p>
                )}
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="max-w-2xl mx-auto w-full bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl mb-6 flex items-center gap-3"
                    >
                        <span>⚠️</span> {error}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Loading Skeleton */}
            {loading ? (
                query === '*' ? (
                    <div className="flex flex-col items-center justify-center py-20 animate-pulse opacity-80">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-8" />
                        <p className="text-xl font-bold uppercase tracking-widest text-primary">Full Library Scan in Progress</p>
                        <p className="text-sm text-muted-foreground mt-2">Iterating through subject keywords... this may take up to 30 seconds.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 animate-pulse opacity-40">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-[3/4] bg-card rounded-xl border border-border" />
                        ))}
                    </div>
                )
            ) : results.length > 0 ? (
                <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{
                        hidden: { opacity: 0 },
                        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                    }}
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-12"
                >
                    {results.map((book, index) => {
                        const alreadyOwned = isOwned(book.trial_id);
                        return (
                            <motion.div
                                key={book.trial_id}
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    duration: 0.4,
                                    delay: (index % 20) * 0.05,
                                    ease: "easeOut"
                                }}
                                className="h-full"
                            >
                                <BookCard
                                    id={book.id}
                                    title={book.name}
                                    subtitle={book.pretty_url}
                                    coverUrl={book.cover_url}
                                    actionLabel={alreadyOwned ? 'IN LIBRARY' : (addingIds.has(book.trial_id) ? 'ADDING...' : 'GET')}
                                    onAction={() => handleAdd(book)}
                                    onClick={() => setSelectedBook(book)}
                                    disabled={addingIds.has(book.trial_id) || alreadyOwned}
                                />
                            </motion.div>
                        );
                    })}

                    {/* Load More Trigger / Sentinel / End Message */}
                    <div
                        ref={loadingRef}
                        className="col-span-full flex justify-center items-center py-8 min-h-[100px] w-full"
                    >
                        <AnimatePresence mode="wait">
                            {moreLoading ? (
                                <motion.div
                                    key="loading-more"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="flex items-center gap-2 text-muted-foreground animate-pulse"
                                >
                                    <div className="w-4 h-4 border-2 border-primary/50 border-t-primary rounded-full animate-spin" />
                                    <span>Loading more...</span>
                                </motion.div>
                            ) : !hasMore && results.length > 0 ? (
                                <motion.div
                                    key="end-message"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ type: "spring", bounce: 0.5 }}
                                    className="text-center text-muted-foreground opacity-50 py-4"
                                >
                                    <span className="block text-xl mb-2">🏁</span>
                                    <span className="text-sm font-medium">You've reached the end</span>
                                </motion.div>
                            ) : (
                                <div key="spacer" className="h-4 w-full" />
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ) : searched && !loading && !error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col items-center justify-center opacity-40 pb-20"
                >
                    <span className="text-6xl mb-4 grayscale">🤷‍♂️</span>
                    <p className="text-xl font-medium">No results found</p>
                    <p className="text-sm">We couldn't find anything for "{query}"</p>
                </motion.div>
            )}

            {/* Detailed View Modal */}
            <AnimatePresence>
                {selectedBook && (
                    <BookDetailModal
                        book={selectedBook}
                        onClose={() => setSelectedBook(null)}
                        downloadState={addingIds.has(selectedBook.trial_id) ? { [selectedBook.id || selectedBook.trial_id]: { status: 'adding', progress: 0 } } : {}}
                        onDownload={() => handleAdd(selectedBook)}
                        isOwned={isOwned(selectedBook.trial_id)}
                        actionLabel="ADD TO LIBRARY"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
