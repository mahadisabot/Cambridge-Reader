import { Trash2, BookOpen, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useCoverCache } from './CoverCacheContext';

interface BookCardProps {
    id: string;
    title: string;
    coverUrl: string | null;
    subtitle?: string | null;
    actionLabel?: string;
    onAction?: () => void;
    onClick?: () => void;
    disabled?: boolean;
    progress?: number;
    isDownloaded?: boolean;
    onCoverLoaded?: (url: string) => void;
    onDelete?: () => void;
    isSelecting?: boolean;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

// @ts-ignore
const BookCard: React.FC<BookCardProps> = ({
    id: _id, // Renamed to _id as it's not directly used in the component logic after destructuring
    title,
    coverUrl,
    subtitle,
    actionLabel,
    onAction,
    onClick,
    disabled,
    progress,
    isDownloaded,
    onDelete,
    onCoverLoaded,
    isSelecting,
    isSelected,
    onToggleSelect
}) => {

    const { getCachedCover, preloadCover } = useCoverCache();

    // Lazy Init: Check cache immediately to prevent FOUC (Flash of Unstyled Content)
    const [imageSrc, setImageSrc] = useState<string | null>(() => {
        if (!coverUrl) return null;
        return getCachedCover(coverUrl) || null;
    });

    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [localLoading, setLocalLoading] = useState(false); // Immediate visual feedback


    useEffect(() => {
        if (!coverUrl) return;
        // If we already have it from lazy init, finding it in cache again is fine,
        // but we should ensure we don't reset it if the cache is populated.
        // Actually, lazy init handles the MOUNT.
        // This effect handles UPDATES (if coverUrl changes or cache updates later?)
        // But getCachedCover is not reactive.
        // The CoverCacheProvider doesn't force re-render consumers when cache updates (it just provides the function).
        // So we MUST listen or poll?
        // Ah, CoverCacheContext implementation:
        // Cache is a Ref. It doesn't trigger updates.
        // So 'imageSrc' won't update unless we call 'setImageSrc'.
        // So we still need the Effect to trigger the fetch (preload) and update state when promise resolves.

        let active = true;

        const load = async () => {
            // 1. Check Cache (again, in case lazy init missed it or prop changed)
            const cached = getCachedCover(coverUrl);
            if (cached) {
                if (active) {
                    setImageSrc(cached);
                    onCoverLoaded?.(cached);
                }
                return;
            }

            // 2. Fetch (Deduplicated)
            try {
                // Pass _id to enable deterministic caching by Book ID
                await preloadCover(coverUrl, _id);
                if (active) {
                    const newCached = getCachedCover(coverUrl);
                    if (newCached) {
                        setImageSrc(newCached);
                        onCoverLoaded?.(newCached);
                    }
                }
            } catch (err) {
                console.error("Cover load error:", err);
                if (active) setImgError(true);
            }
        };
        load();
        return () => { active = false; };
    }, [coverUrl, getCachedCover, preloadCover]);

    // Cleanup local loading:
    // 1. If we are definitively downloading/installed (success path).
    // 2. If 'disabled' flips back to false (error/reset path).
    useEffect(() => {
        const isActuallyDownloading = progress !== undefined || actionLabel === 'DOWNLOADING' || actionLabel === 'STARTED';
        const isInstalled = isDownloaded || actionLabel === 'INSTALLED';

        if (isActuallyDownloading || isInstalled) {
            setLocalLoading(false);
        }
    }, [progress, actionLabel, isDownloaded]);

    // Separate effect for disabled prop to handle specific failure/reset cases cleanly
    useEffect(() => {
        if (disabled === false) {
            setLocalLoading(false);
        }
    }, [disabled]);

    // Unified Active State: If label indicates ANY activity, show the bar pane to prevent layout jumps
    const activeLabels = ['DOWNLOADING', 'STARTED', 'PROCESSING', 'PHASE'];
    const showProgressBar = (progress !== undefined && progress >= 0) || activeLabels.includes(actionLabel || '');

    // Generic loading state (Button Spinner) for invalid states or adding
    const showButtonSpinner = localLoading && !showProgressBar;

    const isReady = isDownloaded || actionLabel === 'DOWNLOADED' || actionLabel === 'IN LIBRARY' || actionLabel === 'INSTALLED';

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        // If selecting, the whole card is a toggle, so buttons should pass through or be disabled?
        // Actually, if selecting, we usually want to block the "Read" action and just toggle selection.
        if (isSelecting) {
            onToggleSelect?.();
            return;
        }

        // Allow action even if ready (Redownload) but block if already busy
        if (showProgressBar || showButtonSpinner || (disabled && !isReady)) return;

        setLocalLoading(true);
        if (onAction) onAction();
    };

    const handleCardClick = () => {
        if (isSelecting) {
            onToggleSelect?.();
        } else {
            onClick?.();
        }
    };

    return (
        <div // verified motion.div layoutId to prevent morphing glitches
            className={`group relative flex flex-col h-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-primary bg-primary/10' : 'bg-transparent'}`}
            onClick={handleCardClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Glossy Backdrop / Border Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-b from-border/10 to-card/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl border border-border/50`}></div>

            {/* Selecting Overlay Checkbox */}
            {isSelecting && (
                <div className="absolute top-2 right-2 z-50">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'bg-black/40 border-white/60'}`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                </div>
            )}

            {/* Main Container */}
            <div className={`relative flex flex-col h-full p-3 z-10 ${isSelecting ? 'pointer-events-none' : ''}`}>

                {/* Image Container */}
                <div
                    className={`relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-card transition-all duration-300 ${!isSelecting && 'group-hover:scale-[1.02]'}`}
                >
                    {imageSrc && !imgError ? (
                        <img
                            src={imageSrc}
                            alt={title}
                            className={`w-full h-full object-cover transition-transform duration-500 ${!isSelecting && 'group-hover:scale-105'}`}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-card p-4 text-center">
                            <span className="text-2xl mb-2 opacity-20">📕</span>
                            <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">No Cover</span>
                        </div>
                    )}

                    {/* Status Badge - Top Right (Visible if Ready) */}
                    {/* Status Badge / Delete Button Morph - Top Right (Visible if Ready) */}
                    <AnimatePresence mode="wait">
                        {isReady && !isHovered && !isSelecting && (
                            <motion.div
                                key="status-ready"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-2 right-2 flex items-center gap-1.5 bg-background/80 backdrop-blur-md text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/30 shadow-lg z-20 pointer-events-none"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                <span className="tracking-wide">{actionLabel === 'IN LIBRARY' ? 'OWNED' : 'READY'}</span>
                            </motion.div>
                        )}
                        {isReady && isHovered && !isSelecting && (
                            <motion.button
                                key="status-delete"
                                initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDelete) onDelete();
                                }}
                                className="absolute top-2 right-2 flex items-center justify-center w-8 h-8 rounded-full bg-destructive/90 hover:bg-destructive text-white shadow-lg border border-destructive/50 z-30 transition-colors"
                                title="Delete Book"
                            >
                                <Trash2 className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Hover Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none" />
                </div>

                {/* Content */}
                <div className="pt-4 flex-1 flex flex-col min-h-0">
                    <h3
                        className="text-sm font-bold text-foreground leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors"
                        title={title}
                    >
                        {title}
                    </h3>
                    <p
                        className="text-[10px] text-muted-foreground font-mono truncate mb-4"
                        title={subtitle || "CAMBRIDGE UNIVERSITY PRESS"}
                    >
                        {subtitle || "CAMBRIDGE UNIVERSITY PRESS"}
                    </p>

                    <div className="mt-auto relative z-30 h-10 w-full">
                        <AnimatePresence mode="wait">
                            {showProgressBar ? (
                                <motion.div
                                    key="progress"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full h-full bg-card/90 backdrop-blur rounded-lg border border-accent/20 relative overflow-hidden flex flex-col justify-center px-3"
                                >
                                    <div className="flex justify-between items-center text-[9px] font-mono text-accent mb-1 relative z-10">
                                        <span className="animate-pulse">{localLoading ? 'REQUESTING...' : (actionLabel === 'DOWNLOADING' ? 'DOWNLOADING' : actionLabel)}</span>
                                        <span>{localLoading ? '0%' : (progress ? Math.round(progress * 100) : 0)}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-muted rounded-full overflow-hidden relative z-10">
                                        <motion.div
                                            className="h-full bg-accent"
                                            initial={{ width: 0 }}
                                            animate={{ width: localLoading ? '10%' : `${(progress || 0) * 100}%` }}
                                            transition={{ type: "tween", ease: "linear", duration: 0.2 }}
                                        />
                                    </div>
                                </motion.div>
                            ) : isReady ? (
                                <motion.button
                                    key="ready"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                    onClick={handleAction}
                                    className="group/btn w-full h-full relative overflow-hidden rounded-lg transition-all duration-200"
                                >
                                    {/* Default State: READ */}
                                    {actionLabel === 'IN LIBRARY' ? (
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-secondary/80 text-secondary-foreground text-[10px] font-bold tracking-widest cursor-default whitespace-nowrap">
                                            <Check className="w-3 h-3" />
                                            IN LIBRARY
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-primary/90 hover:bg-primary/80 hover:brightness-110 text-primary-foreground text-[10px] font-bold tracking-widest transition-all duration-300 whitespace-nowrap">
                                            <BookOpen className="w-3 h-3" />
                                            READ
                                        </div>
                                    )}
                                </motion.button>
                            ) : (
                                <motion.button
                                    key="get"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    onClick={handleAction}
                                    disabled={disabled || showButtonSpinner || isSelecting}
                                    className={`
                                        w-full h-full relative overflow-hidden rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all duration-200
                                        ${showButtonSpinner
                                            ? 'bg-muted text-muted-foreground cursor-wait border border-border'
                                            : 'bg-primary text-primary-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] active:scale-95'
                                        }
                                        ${disabled || isSelecting ? 'opacity-50 cursor-not-allowed' : ''}
                                    `}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        {showButtonSpinner ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
                                                <span>{actionLabel === 'GET' ? 'ADDING...' : (actionLabel || 'PROCESSING...')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                {actionLabel || 'GET BOOK'}
                                            </>
                                        )}
                                    </span>
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div >
    );
}

export default BookCard;
