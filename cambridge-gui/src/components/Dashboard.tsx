import { useEffect, useState, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import Search from './Search';
import BookCard from './BookCard';
import BookDetailModal from './BookDetailModal';
import CarouselView from './CarouselView';
import ThemeSelector from './ThemeSelector';
import SetupWizard from './SetupWizard';
import SettingsModal from './SettingsModal';
import DeleteConfirmModal from './DeleteConfirmModal';

import { Settings as SettingsIcon } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { themes } from '../lib/themes';

import type { Book } from '../types/book';

interface DownloadStatus {
    status: 'idle' | 'started' | 'downloading' | 'processing' | 'phase' | 'completed' | 'error';
    progress: number;
    detail: string;
}

interface DashboardProps {
    onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
    // Persistent State Init Helper
    const usePersistentState = <T,>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] => {
        const [state, setState] = useState<T>(() => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : initialValue;
            } catch (error) {
                console.warn(`Error reading localStorage key "${key}":`, error);
                return initialValue;
            }
        });

        useEffect(() => {
            try {
                localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.warn(`Error saving localStorage key "${key}":`, error);
            }
        }, [key, state]);

        return [state, setState];
    };

    const { theme, confirmDeleteEnabled, enableTheming } = useTheme();
    const [deleteCandidate, setDeleteCandidate] = useState<Book | null>(null);

    const [activeTab, setActiveTab] = usePersistentState<'library' | 'search'>('dashboard_active_tab', 'library');
    const [viewMode, setViewMode] = usePersistentState<'grid' | 'carousel'>('dashboard_view_mode', 'grid');

    // Books: Initialize from cache for instant load
    const [books, setBooks] = useState<Book[]>(() => {
        try {
            const cached = localStorage.getItem('dashboard_books_cache');
            return cached ? JSON.parse(cached) : [];
        } catch { return []; }
    });

    // Loading: Only true if we have NO data. If we have cache, we sync in background.
    const [loading, setLoading] = useState(books.length === 0);

    const [error, setError] = useState<string | null>(null);
    const [downloadState, setDownloadState] = useState<Record<string, DownloadStatus>>({});
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    // New Feature States (Persisted)
    const [filter, setFilter] = usePersistentState<'all' | 'downloaded'>('dashboard_filter', 'all');
    const [sort, setSort] = usePersistentState<'title' | 'recent'>('dashboard_sort', 'title');

    const [searchQuery, setSearchQuery] = useState('');
    const [showSetup, setShowSetup] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        const hasRun = localStorage.getItem('phantom_setup_complete');
        if (!hasRun) {
            setShowSetup(true);
        }
    }, []);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set());

    const toggleSelectMode = () => {
        setIsSelectMode(prev => {
            if (prev) setSelectedBookIds(new Set()); // Clear on exit
            return !prev;
        });
    };

    const toggleSelection = (id: string) => {
        setSelectedBookIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedBookIds.size === filteredBooks.length) {
            setSelectedBookIds(new Set());
        } else {
            setSelectedBookIds(new Set(filteredBooks.map(b => b.id)));
        }
    };

    const downloadSelected = async () => {
        if (selectedBookIds.size === 0) return;
        const targets = books.filter(b => selectedBookIds.has(b.id));

        // Trigger generic download logic for each
        // Using Promise.all might flood, but handleDownload has checks?
        // handleDownload updates state. better to stagger them slightly or just fire.
        // We'll fire them sequentially to avoid UI freezing or race conditions in state updates
        setIsSelectMode(false); // Exit mode

        for (const book of targets) {
            await handleDownload(book);
            await new Promise(r => setTimeout(r, 100)); // 100ms stagger
        }
        setSelectedBookIds(new Set());
    };

    // Performance: Lift cover cache to share between Grid and Modal (Using Ref to avoid re-renders)
    const coverCache = useRef<Record<string, string>>({});
    // Targeted Reactivity: Only trigger re-render if the loaded cover is for the ACTIVE modal
    const [activeCover, setActiveCover] = useState<string | null>(null);

    const handleCoverLoaded = (id: string, url: string) => {
        try {
            if (!coverCache.current) return;
            coverCache.current[id] = url;
            // If this book is currently open in the modal, force an update
            if (selectedBook?.id === id) {
                setActiveCover(url);
            }
        } catch (e) {
            console.error("Dashboard cover handler error:", e);
        }
    };

    // Reset/Sync active cover when selection changes
    useEffect(() => {
        if (selectedBook) {
            setActiveCover(coverCache.current[selectedBook.id] || null);
        }
    }, [selectedBook]);

    const downloadedCount = books.filter(b => b.is_downloaded).length;
    const activeDownload = Object.entries(downloadState).find(([_, s]) => s.status === 'downloading' || s.status === 'started');

    useEffect(() => {
        if (activeTab === 'library') {
            loadBooks();
        }
    }, [activeTab]);

    // Listen for Background Session Restore to auto-refresh
    useEffect(() => {
        const unlistenPromise = listen('session-restored', () => {
            console.log("Session Restored Event: Refreshing Books...");
            loadBooks(true); // Silent refresh
        });
        return () => { unlistenPromise.then(f => f()); };
    }, []);

    useEffect(() => {
        const unlistenPromise = listen('download-progress', (event: any) => {
            const payload = event.payload;
            setDownloadState(prev => ({
                ...prev,
                [payload.book_id]: {
                    status: payload.status,
                    progress: payload.progress,
                    detail: payload.detail
                }
            }));

            // If completed, refresh the book list silently to update 'is_downloaded' status
            if (payload.status === 'completed') {
                loadBooks(true);
            }
        });

        return () => {
            unlistenPromise.then(unlisten => unlisten());
        };
    }, []);

    const handleDownload = async (book: Book) => {
        console.log("handleDownload called for:", book.title, "ID:", book.id, "Downloaded:", book.is_downloaded, "Status:", downloadState[book.id]?.status);

        // If already downloaded, open reader in NEW WINDOW
        // If already downloaded, open with EXTERNAL READEST
        if (book.is_downloaded || downloadState[book.id]?.status === 'completed') {
            console.log("Book is downloaded. Launching External Readest...");
            setDownloadState(prev => ({
                ...prev,
                [book.id]: { status: 'processing', progress: 1, detail: 'Launching Reader...' }
            }));

            try {
                // 2. Patch GLOBAL Readest settings (Theme Colors)
                await invoke<string>('patch_readest_settings', {
                    themeMode: theme.id,
                    primaryColor: theme.colors.primary,
                    bgColor: theme.colors.background,
                    fgColor: theme.colors.foreground,
                    enableTheming: enableTheming
                });
                console.log("Global settings patched.");

                // Force Book Config to use CSS INJECTION
                // We pass the colors again so Rust can generate the specific CSS file for THIS book
                console.log("Patching book specific config...");
                await invoke('patch_book_config', {
                    bookTitle: book.title,
                    bgColor: theme.colors.background,
                    fgColor: theme.colors.foreground,
                    primaryColor: theme.colors.primary,
                    subColor: theme.colors.sub,
                    subAltColor: theme.colors.subAlt,
                    errorColor: theme.colors.error,
                    caretColor: theme.colors.caret,
                    popupBg: theme.colors.subAlt, // Fallback
                    enableTheming: enableTheming
                });
                console.log("Book config patched.");
                // 3. Launch with tiny delay to ensure FS flush
                console.log("Waiting 1.5s for file system flush...");
                await new Promise(r => setTimeout(r, 1500));

                console.log("Launching Readest...");
                await invoke('launch_readest', { book });

                // Reset status after short delay
                setTimeout(() => {
                    setDownloadState(prev => {
                        const next = { ...prev };
                        delete next[book.id];
                        return next;
                    });
                }, 2000);

            } catch (e: any) {
                console.error("Failed to launch Readest:", e);
                const msg = e.toString();
                if (msg.includes("Readest executable not found")) {
                    // Prompt user?
                    // For now alert
                    alert("Readest Reader is not installed. Please install it to read books.");
                } else {
                    alert("Failed to launch reader: " + msg);
                }

                setDownloadState(prev => {
                    const next = { ...prev };
                    delete next[book.id];
                    return next;
                });
            }
            return;
        }

        if (downloadState[book.id]?.status === 'downloading' || downloadState[book.id]?.status === 'processing') return;

        setDownloadState(prev => ({
            ...prev,
            [book.id]: { status: 'started', progress: 0, detail: 'Initializing...' }
        }));

        try {
            await invoke('download_book', { book });
        } catch (err: any) {
            console.error("Download failed", err);
            const errorMsg = err.toString();

            if (errorMsg.includes("AUTH_EXPIRED")) {
                alert("Session Expired. Please login again.");
                await handleLogout();
                return;
            }

            setDownloadState(prev => ({
                ...prev,
                [book.id]: { status: 'error', progress: 0, detail: errorMsg }
            }));
            alert("Download failed: " + errorMsg);
        }
    };

    const handleDelete = async (book: Book) => {
        if (confirmDeleteEnabled) {
            setDeleteCandidate(book);
            return;
        }
        // Direct delete if disabled
        await performDeletion(book);
    };

    const performDeletion = async (book: Book) => {
        try {
            await invoke('delete_book', { book });
            // Update local state: mark as not downloaded
            setBooks(prev => prev.map(b => b.id === book.id ? { ...b, is_downloaded: false } : b));
            // Also clear download state
            setDownloadState(prev => {
                const next = { ...prev };
                delete next[book.id];
                return next;
            });
        } catch (err: any) {
            alert("Failed to delete: " + err.toString());
        }
    };

    const handleLogout = async () => {
        await invoke('logout');
        onLogout();
    };

    const handleSessionExpiry = async () => {
        try {
            console.log("Session expired. Attempting auto-refresh...");
            await invoke('refresh_session');
            alert("Session refreshed! Please try again.");
            loadBooks(true); // Reload data silently
        } catch (refreshErr) {
            console.error("Refresh failed", refreshErr);
            alert("Session expired and auto-login failed. Please sign in.");
            await handleLogout();
        }
    };

    const loadBooks = async (silent = false) => {
        // Only block UI if we have absolutely nothing (no cache)
        if (!silent && books.length === 0) setLoading(true);
        try {
            const result = await invoke<Book[]>('list_books');
            setBooks(result);
            // SWR: Update cache immediately
            localStorage.setItem('dashboard_books_cache', JSON.stringify(result));
        } catch (err: any) {
            const errorMsg = err.toString();
            if (errorMsg.includes("AUTH_EXPIRED")) {
                await handleSessionExpiry(); // Now defined
                return;
            }
            if (errorMsg.includes("AUTH_EXPIRED")) { // Fallback check
                await handleLogout();
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredBooks = useMemo(() => {
        let result = [...books];

        // 1. Text Search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b => b.title.toLowerCase().includes(q) || b.isbn?.includes(q));
        }

        // 2. Status Filter
        if (filter === 'downloaded') {
            result = result.filter(b => b.is_downloaded);
        }

        // 3. Sorting
        result.sort((a, b) => {
            if (sort === 'title') return a.title.localeCompare(b.title);
            return 0; // Add timestamp logic if available
        });

        return result;
    }, [books, searchQuery, filter, sort]);

    return (
        <LayoutGroup>
            <div className="flex flex-col h-screen text-foreground overflow-hidden bg-background selection:bg-primary/30">

                {/* Main Content Area (Below TitleBar) */}
                <div className="flex-1 flex flex-col pt-12 overflow-hidden relative z-10">

                    {/* Header / Sub-nav */}
                    <div className="px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-border bg-background/50 backdrop-blur-sm z-20">
                        {/* Tabs */}
                        <nav className="flex bg-card/50 p-1 rounded-lg">
                            {['library', 'search'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all relative ${activeTab === tab ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {activeTab === tab && (
                                        <motion.div layoutId="tab-bg" className="absolute inset-0 bg-primary shadow-lg rounded-md" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                                    )}
                                    <span className={`relative z-10 ${activeTab === tab ? 'text-primary-foreground' : ''}`}>{tab}</span>
                                </button>
                            ))}
                        </nav>

                        {/* Library Controls (Only visible in Library tab) */}
                        {activeTab === 'library' && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 flex-wrap justify-center"
                            >
                                <div className="relative group">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-400 transition-colors">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="FILTER..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-card/50 border border-border rounded-lg pl-9 pr-4 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-ring transition-colors w-40"
                                    />
                                </div>
                                <div className="h-4 w-[1px] bg-zinc-800" />
                                {isSelectMode ? (
                                    <>
                                        <button
                                            onClick={selectAll}
                                            className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors hover:bg-zinc-800 text-zinc-400"
                                        >
                                            {selectedBookIds.size === filteredBooks.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <button
                                            onClick={downloadSelected}
                                            disabled={selectedBookIds.size === 0}
                                            className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Download ({selectedBookIds.size})
                                        </button>
                                        <button
                                            onClick={toggleSelectMode}
                                            className="px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-colors hover:bg-destructive hover:text-white text-zinc-400"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex bg-card/50 rounded-lg p-0.5 border border-border relative">
                                            {[
                                                { id: 'all', label: 'All' },
                                                { id: 'downloaded', label: 'Ready' }
                                            ].map((tab) => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setFilter(tab.id as any)}
                                                    className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all relative ${filter === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                                >
                                                    {filter === tab.id && (
                                                        <motion.div
                                                            layoutId="filter-pill"
                                                            className="absolute inset-0 bg-muted rounded-md shadow-sm"
                                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                        />
                                                    )}
                                                    <span className="relative z-10">{tab.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={toggleSelectMode}
                                            className="ml-2 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase border border-border hover:bg-accent transition-colors text-muted-foreground"
                                        >
                                            Select
                                        </button>
                                    </>
                                )}
                                <div className="h-4 w-[1px] bg-zinc-800" />
                                <ThemeSelector />
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="p-1.5 text-zinc-500 hover:text-white transition-colors"
                                    title="Settings"
                                >
                                    <SettingsIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => setViewMode(v => v === 'grid' ? 'carousel' : 'grid')} className="p-1.5 text-zinc-500 hover:text-white transition-colors" title="Toggle View">
                                    {viewMode === 'grid' ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                                    )}
                                </button>
                            </motion.div>
                        )}
                        <button onClick={handleLogout} className="ml-auto text-xs text-muted-foreground hover:text-destructive transition-colors uppercase font-bold tracking-wider">Log Out</button>
                    </div>

                    {/* Content Body */}
                    <div
                        className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative scrollbar-track-transparent scrollbar-thumb-muted hover:scrollbar-thumb-muted-foreground"
                    >
                        <AnimatePresence mode="wait">
                            {activeTab === 'library' ? (
                                <motion.div
                                    key="library"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="min-h-full"
                                >
                                    {loading ? (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden mb-4">
                                                <div className="h-full bg-white w-1/3 animate-[shine_1s_infinite_linear]" />
                                            </div>
                                            <p className="text-zinc-600 font-mono text-xs uppercase animate-pulse">Initializing Database...</p>
                                        </div>
                                    ) : filteredBooks.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-zinc-700">
                                            <div className="text-5xl mb-4 opacity-20">📚</div>
                                            <p className="font-bold text-lg">No Results Found</p>
                                            {searchQuery ? (
                                                <p className="text-sm font-mono opacity-60">ADJUST FILTERS OR SEARCH TERM</p>
                                            ) : (
                                                <button
                                                    onClick={() => setActiveTab('search')}
                                                    className="mt-8 px-8 py-4 bg-card border-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground rounded-2xl transition-all font-bold text-sm uppercase tracking-widest shadow-[0_0_30px_rgba(var(--primary-rgb),0.2)] hover:shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)] hover:scale-105 hover:border-primary"
                                                >
                                                    + Add First Book
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        viewMode === 'grid' ? (
                                            <AnimatePresence mode="wait">
                                                <motion.div
                                                    key={filter + searchQuery + 'grid'}
                                                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 px-4"
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    {filteredBooks.map(book => (
                                                        <motion.div
                                                            key={book.id}
                                                            variants={{
                                                                hidden: { opacity: 0, y: 20 },
                                                                show: { opacity: 1, y: 0 }
                                                            }}
                                                            // Stagger effect comes from re-mounting the container
                                                            initial="hidden"
                                                            animate="show"
                                                            transition={{ type: "spring", stiffness: 300, damping: 24 }}
                                                            className="h-full"
                                                        >
                                                            <BookCard
                                                                id={book.id}
                                                                title={book.title}
                                                                subtitle={book.isbn}
                                                                coverUrl={book.cover}
                                                                progress={
                                                                    ['downloading', 'started', 'processing', 'phase'].includes(downloadState[book.id]?.status || '')
                                                                        ? downloadState[book.id]?.progress
                                                                        : undefined
                                                                }
                                                                onCoverLoaded={(url: string) => handleCoverLoaded(book.id, url)}
                                                                isDownloaded={book.is_downloaded}
                                                                onAction={() => handleDownload(book)}
                                                                actionLabel={
                                                                    ['downloading', 'started', 'processing', 'phase', 'completed'].includes(downloadState[book.id]?.status || '')
                                                                        ? (
                                                                            downloadState[book.id]?.status === 'completed' ? 'DOWNLOADED' :
                                                                                (downloadState[book.id]?.status === 'processing' || downloadState[book.id]?.status === 'phase' ? 'PROCESSING' : 'DOWNLOADING')
                                                                        )
                                                                        : book.is_downloaded
                                                                            ? 'READ'
                                                                            : 'GET'
                                                                }
                                                                onClick={() => setSelectedBook(book)}
                                                                onDelete={() => handleDelete(book)}
                                                                isSelecting={isSelectMode}
                                                                isSelected={selectedBookIds.has(book.id)}
                                                                onToggleSelect={() => toggleSelection(book.id)}
                                                            />
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </AnimatePresence>
                                        ) : (
                                            <CarouselView
                                                books={filteredBooks}
                                                onSelect={(book) => setSelectedBook(book)}
                                                downloadState={downloadState}
                                                onDownload={handleDownload}
                                            />
                                        )
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="search"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="h-full"
                                >
                                    <Search
                                        onAdd={() => {
                                            // Slight delay to ensure file system has synced before re-listing
                                            setTimeout(() => loadBooks(false), 1500);
                                        }}
                                        onLogout={handleSessionExpiry}
                                        ownedBooks={books}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Bottom Status Bar */}


                </div>

                {/* Modals */}
                <AnimatePresence>
                    {selectedBook && (
                        <BookDetailModal
                            key="book-detail-modal"
                            // Find the live book object from state to ensure updates (is_downloaded, etc.) reflect immediately
                            book={books.find(b => b.id === selectedBook.id) || selectedBook}
                            onClose={() => setSelectedBook(null)}
                            downloadState={downloadState}
                            onDownload={() => handleDownload(books.find(b => b.id === selectedBook.id) || selectedBook)}
                            cachedCover={activeCover || coverCache.current[selectedBook.id]}
                        />
                    )}
                    {showSetup && (
                        <SetupWizard
                            key="setup-wizard"
                            onComplete={() => {
                                localStorage.setItem('phantom_setup_complete', 'true');
                                setShowSetup(false);
                            }}
                        />
                    )}
                    {showSettings && (
                        <SettingsModal
                            isOpen={showSettings}
                            onClose={() => setShowSettings(false)}
                        />
                    )}
                    {deleteCandidate && (
                        <DeleteConfirmModal
                            key="delete-confirm-modal"
                            isOpen={!!deleteCandidate}
                            book={deleteCandidate}
                            onClose={() => setDeleteCandidate(null)}
                            onConfirm={async () => {
                                if (deleteCandidate) await performDeletion(deleteCandidate);
                            }}
                        />
                    )}

                </AnimatePresence>

            </div>
        </LayoutGroup >
    );
}
