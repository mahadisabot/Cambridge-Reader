import { useState } from 'react';
import { motion } from 'framer-motion';
import { Folder, Moon, ArrowRight } from 'lucide-react';

interface SetupWizardProps {
    onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
    const [autoTheme, setAutoTheme] = useState(false);
    const [downloadPath, setDownloadPath] = useState('Documents/Cambridge Books');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-border/50 bg-background/50">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <div className="text-2xl">✨</div>
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Welcome to Phantom</h2>
                    <p className="text-sm text-muted-foreground mt-1">Let's verify a few settings before we begin.</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Theme Toggle */}
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <Moon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-foreground">Auto Theme Switching</label>
                                <button
                                    onClick={() => setAutoTheme(!autoTheme)}
                                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${autoTheme ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span
                                        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${autoTheme ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                            Automatically match system theme or conform to time of day.
                        </p>
                    </div>
                </div>

                {/* Download Path */}
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <Folder className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                        <label className="text-sm font-medium text-foreground block mb-2">Library Location</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={downloadPath}
                                onChange={(e) => setDownloadPath(e.target.value)}
                                className="flex-1 h-9 rounded-md border border-input bg-background/50 px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono text-muted-foreground"
                                readOnly // Readonly for now until implemented
                            />
                            <button
                                className="h-9 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                                disabled
                            >
                                Change
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-2 opacity-60">
                            Default storage path for downloaded books.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-muted/30 flex justify-end">
                <button
                    onClick={() => {
                        if (autoTheme) {
                            localStorage.setItem('phantom_auto_theme', 'true');
                        } else {
                            localStorage.removeItem('phantom_auto_theme');
                        }
                        onComplete();
                    }}
                    className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold rounded-xl transition-all shadow-[0_4px_14px_0_rgba(var(--primary-rgb),0.39)] hover:shadow-[0_6px_20px_rgba(var(--primary-rgb),0.23)] hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                >
                    Get Started
                    <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
        </motion.div >
    );
}
