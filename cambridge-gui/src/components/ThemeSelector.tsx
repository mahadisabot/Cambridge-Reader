import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { themes } from '../lib/themes';

export default function ThemeSelector() {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-white/5"
                title="Change Theme"
            >
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-primary via-accent to-secondary ring-2 ring-white/10" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-64 p-2 bg-card/95 backdrop-blur-3xl border border-border rounded-xl shadow-2xl z-[9999] max-h-[400px] overflow-y-auto hide-scrollbar"
                    >
                        <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                            Select Theme
                        </div>
                        <div className="space-y-1">
                            {themes.map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => setTheme(t.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-xs font-medium group ${theme.id === t.id
                                        ? 'bg-primary text-primary-foreground shadow-sm'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex -space-x-1">
                                        <div className="w-3 h-3 rounded-full border border-black/10" style={{ background: t.colors.background }} />
                                        <div className="w-3 h-3 rounded-full border border-black/10" style={{ background: t.colors.primary }} />
                                        <div className="w-3 h-3 rounded-full border border-black/10" style={{ background: t.colors.caret }} />
                                    </div>
                                    <span>{t.name}</span>
                                    {theme.id === t.id && <span className="ml-auto opacity-70">●</span>}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
