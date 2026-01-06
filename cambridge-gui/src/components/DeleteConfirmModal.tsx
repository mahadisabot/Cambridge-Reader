import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface Book {
    id: string;
    title: string;
    [key: string]: any;
}

interface DeleteConfirmModalProps {
    isOpen: boolean;
    book: Book | null;
    onClose: () => void;
    onConfirm: () => Promise<void>;
}

export default function DeleteConfirmModal({ isOpen, book, onClose, onConfirm }: DeleteConfirmModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        if (isDeleting) return;
        setIsDeleting(true);
        try {
            await onConfirm();
        } finally {
            setIsDeleting(false);
            onClose();
        }
    };

    if (!isOpen || !book) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isDeleting) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-sm bg-card border border-destructive/30 rounded-2xl shadow-2xl overflow-hidden relative"
            >
                {/* Decorative Background Mesh */}
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent pointer-events-none" />

                <div className="p-6 flex flex-col items-center text-center relative z-10">
                    <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4 text-destructive animate-pulse">
                        <Trash2 className="w-8 h-8" />
                    </div>

                    <h2 className="text-xl font-bold text-foreground mb-2">Delete Book?</h2>

                    <div className="bg-muted/50 rounded-lg p-3 w-full mb-4 border border-border/50">
                        <p className="text-sm font-medium text-foreground line-clamp-2 leading-relaxed">
                            {book.title}
                        </p>
                    </div>

                    <p className="text-xs text-muted-foreground mb-8 max-w-[260px]">
                        This will permanently remove the book and all its resources from your computer. You can download it again later.
                    </p>

                    <div className="flex w-full gap-3">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 h-10 rounded-xl border border-border bg-background hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isDeleting}
                            className="flex-1 h-10 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-sm font-bold shadow-lg shadow-destructive/20 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Deleting...</span>
                                </>
                            ) : (
                                <span>Delete Forever</span>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
