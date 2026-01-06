import { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Keyboard, Mousewheel } from 'swiper/modules';
import { motion } from 'framer-motion';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

import BookCard from './BookCard';

import type { Book } from '../types/book';

interface DownloadStatus {
    status: 'idle' | 'started' | 'downloading' | 'processing' | 'phase' | 'completed' | 'error';
    progress: number;
    detail: string;
}

interface CarouselViewProps {
    books: Book[];
    onSelect: (book: Book) => void;
    downloadState: Record<string, DownloadStatus>;
    onDownload: (book: Book) => void;
}

export default function CarouselView({ books, onSelect, downloadState, onDownload }: CarouselViewProps) {

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full h-[65vh] flex items-center justify-center py-10 perspective-distant"
        >
            <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                coverflowEffect={{
                    rotate: 25,
                    stretch: 0,
                    depth: 150,
                    modifier: 1,
                    slideShadows: false, // Custom shadows used instead
                }}
                keyboard={{
                    enabled: true,
                }}
                mousewheel={{
                    thresholdDelta: 50,
                    sensitivity: 1,
                }}
                modules={[EffectCoverflow, Keyboard, Mousewheel]}
                className="w-full h-full !overflow-visible"
                style={{
                    '--swiper-pagination-color': '#ffffff',
                } as any}
            >
                {books.map((book) => (
                    <SwiperSlide
                        key={book.id}
                        className="!w-[310px] !h-[600px]"
                    >
                        {({ isActive }) => (
                            <motion.div
                                animate={{
                                    scale: isActive ? 1.0 : 0.8,
                                    y: isActive ? 0 : 20,
                                    filter: isActive ? 'brightness(1) grayscale(0)' : 'brightness(0.5) grayscale(100%)',
                                    opacity: isActive ? 1 : 0.5
                                }}
                                style={{ backfaceVisibility: 'hidden' }}
                                className="w-full h-full relative"
                            >
                                <BookCard
                                    id={book.id}
                                    title={book.title}
                                    subtitle={book.isbn}
                                    coverUrl={book.cover}
                                    isDownloaded={book.is_downloaded || (book as any).license === 'ACTIVE'}
                                    progress={downloadState[book.id]?.progress}
                                    actionLabel={downloadState[book.id] ? downloadState[book.id].status.toUpperCase() : undefined}
                                    onAction={() => onDownload(book)}
                                    onClick={() => onSelect(book)}
                                />

                                {/* Reflection */}
                                <div
                                    className="absolute -bottom-12 left-0 right-0 h-24 bg-gradient-to-b from-white/10 to-transparent transform scale-y-[-1] opacity-20 pointer-events-none blur-md"
                                    style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }}
                                />

                                {/* Active Glow */}
                                {isActive && (
                                    <div className="absolute inset-0 bg-white/5 blur-3xl -z-10 rounded-full opacity-20" />
                                )}
                            </motion.div>
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>
        </motion.div>
    );
}
