import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import Ripple from './Ripple';

import { useCoverCache } from './CoverCacheContext';

interface BookDetailModalProps {
    book: any;
    onClose: () => void;
    downloadState: any;
    onDownload: () => void;
    isOwned?: boolean;
    actionLabel?: string;
    cachedCover?: string;
}

export default function BookDetailModal({ book, onClose, downloadState, onDownload, isOwned, actionLabel, cachedCover }: BookDetailModalProps) {
    const { getCachedCover, preloadCover } = useCoverCache();

    // 1. Try prop cache
    // 2. Try global context cache
    // 3. Fallback to raw URL
    const [imageSrc, setImageSrc] = useState<string | null>(() => {
        if (cachedCover) return cachedCover;
        const url = book.cover || book.img || book.cover_url;
        if (!url) return null;
        return getCachedCover(url) || url;
    });

    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        const url = book.cover || book.img || book.cover_url;
        if (!url) return;

        // If we already have a blob URL in cache, ensure state is synced
        const cached = getCachedCover(url);
        if (cached) {
            setImageSrc(cached);
            setImgError(false);
            return;
        }

        let active = true;
        // Preload via context (handles caching and dedup)
        preloadCover(url, book.id).then(() => {
            if (active) {
                const newCached = getCachedCover(url);
                if (newCached) setImageSrc(newCached);
            }
        }).catch(() => {
            if (active) setImgError(true);
        });

        return () => { active = false; };
    }, [book, getCachedCover, preloadCover]);

    const status = downloadState[book.id]?.status;
    const progress = downloadState[book.id]?.progress || 0;

    // Fallback Image Pattern (Geometric)
    const FallbackCover = () => (

        <div className="w-full h-full bg-card flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-muted to-background opacity-50" />
            <div className="text-muted-foreground text-6xl font-black rotate-[-15deg] opacity-20 select-none group-hover:scale-110 transition-transform duration-700">
                CAMBRIDGE
            </div>
            <div className="absolute inset-0 border-4 border-border/50 m-4 rounded-lg" />
        </div>
    );

    return (
        <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8"
        >
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background/90 backdrop-blur-xl"
                onClick={onClose}
            />

            {/* Modal Card */}
            <motion.div
                className="relative w-full max-w-5xl bg-card border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] backdrop-blur-md"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-background/40 hover:bg-background/80 rounded-full text-muted-foreground hover:text-foreground transition-all border border-border backdrop-blur-sm"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left: Cover & Hero */}
                <div className="relative md:w-2/5 p-8 flex items-center justify-center bg-gradient-to-br from-card/50 to-background/50">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-primary/5 blur-3xl" />

                    <div
                        className="relative w-full max-w-[240px] shadow-2xl rounded-lg z-10 aspect-[2/3]"
                    >
                        {imgError ? (
                            <FallbackCover />
                        ) : (
                            <img
                                src={imageSrc || book.cover || book.cover_url}
                                className="w-full h-full object-cover rounded-lg shadow-black/80 shadow-2xl ring-1 ring-white/10"
                                alt={book.title}
                                onError={() => setImgError(true)}
                            />
                        )}
                        {/* Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none mix-blend-overlay rounded-lg" />
                    </div>
                </div>

                {/* Right: Content */}
                <div className="flex-1 p-8 md:p-10 flex flex-col relative bg-card/20">
                    <div className="relative z-10 flex flex-col h-full">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-2 leading-tight tracking-tight text-balance">
                                {book.title || book.name}
                            </h2>
                            <p className="text-base text-muted-foreground font-medium mb-8 font-mono tracking-wide">
                                {book.isbn || "ID: " + book.id.substring(0, 8)}
                            </p>
                        </motion.div>

                        {/* Stats Grid */}
                        <motion.div
                            className="grid grid-cols-3 gap-4 mb-8"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="bg-card/50 p-4 rounded-xl border border-border hover:border-primary/20 transition-colors">
                                <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1 tracking-wider">SIZE</span>
                                <span className="text-foreground font-mono text-sm">~450MB</span>
                            </div>
                            <div className="bg-card/50 p-4 rounded-xl border border-border hover:border-primary/20 transition-colors">
                                <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1 tracking-wider">FORMAT</span>
                                <span className="text-foreground font-mono text-sm">PDF/WEB</span>
                            </div>
                            <div className="bg-card/50 p-4 rounded-xl border border-border hover:border-primary/20 transition-colors">
                                <span className="block text-[10px] uppercase text-muted-foreground font-bold mb-1 tracking-wider">LICENSE</span>
                                <span className="text-primary font-mono text-sm">ACTIVE</span>
                            </div>
                        </motion.div>

                        {/* Description */}
                        <div className="flex-1 overflow-y-auto mb-8 pr-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wider">Synopsis</h3>
                            <p className="text-foreground/80 leading-relaxed text-sm">
                                Experience the digital edition of this Cambridge University Press title.
                                Optimized for high-fidelity rendering on the "Phantom" engine.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto pt-6 border-t border-white/5 relative h-[72px]">
                            <AnimatePresence mode="wait">
                                {status === 'adding' ? (
                                    <motion.button
                                        key="adding"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        disabled
                                        className="w-full h-full bg-card text-accent font-bold py-4 rounded-xl relative overflow-hidden group transition-all border border-accent/40 cursor-wait flex items-center justify-center"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                                            <span className="text-sm uppercase tracking-wider">ADDING TO LIBRARY...</span>
                                        </div>
                                    </motion.button>
                                ) : status === 'downloading' || status === 'processing' || status === 'started' || status === 'phase' ? (
                                    <motion.div
                                        key="downloading"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full h-full bg-card backdrop-blur rounded-xl border border-accent/40 relative overflow-hidden flex flex-col justify-center px-4 py-4"
                                    >
                                        <div className="w-full relative z-10 flex flex-col gap-1">
                                            <div className="flex justify-between items-center text-[10px] font-mono text-accent">
                                                <span className="animate-pulse">{status === 'processing' || status === 'phase' ? 'PROCESSING...' : 'DOWNLOADING...'}</span>
                                                <span>{Math.round((progress || 0) * 100)}%</span>
                                            </div>
                                            <div className="h-1 min-h-[4px] w-full bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    className="h-full bg-accent"
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.max((progress || 0), 0.05) * 100}%` }}
                                                    transition={{ type: "tween", ease: "linear", duration: 0.2 }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : isOwned ? (
                                    <motion.button
                                        key="owned"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        disabled
                                        className="w-full h-full bg-primary/10 text-primary font-bold py-4 rounded-xl relative overflow-hidden group transition-all border border-primary/20 cursor-default flex items-center justify-center"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            <span className="text-sm uppercase tracking-wider">ADDED TO LIBRARY</span>
                                        </div>
                                    </motion.button>
                                ) : status === 'completed' || book.is_downloaded ? (
                                    <motion.div
                                        key="open"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full h-full flex gap-3"
                                    >
                                        <button
                                            onClick={onDownload}
                                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl relative overflow-hidden group transition-all shadow-lg shadow-white/5 flex items-center justify-center"
                                        >
                                            <div className="relative z-10 flex items-center justify-center gap-2 text-sm uppercase tracking-wide">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                OPEN READER
                                            </div>
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="download"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={onDownload}
                                        className="w-full h-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl relative overflow-hidden group transition-all shadow-lg shadow-primary/20 flex items-center justify-center"
                                    >
                                        <div className="relative z-10 flex items-center justify-center gap-3">
                                            <span className="text-sm uppercase tracking-wider">{actionLabel || "DOWNLOAD TO LIBRARY"}</span>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </div>
                                        <Ripple color="rgba(255,255,255,0.2)" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
