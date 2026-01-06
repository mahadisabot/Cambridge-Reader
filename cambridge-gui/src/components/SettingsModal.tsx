import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Folder, Moon, X, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { useTheme } from './ThemeContext';

import { open } from '@tauri-apps/plugin-dialog';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { autoThemeEnabled, toggleAutoTheme, confirmDeleteEnabled, toggleConfirmDelete, enableTheming, toggleEnableTheming } = useTheme();

    // Initialize from localStorage or default
    const [downloadPath, setDownloadPath] = useState(() => {
        return localStorage.getItem('phantom_library_path') || 'Documents/Cambridge Books';
    });

    const handleSelectPath = async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Library Location'
            });

            if (selected && typeof selected === 'string') {
                setDownloadPath(selected);
                localStorage.setItem('phantom_library_path', selected);
            }
        } catch (err) {
            console.error("Failed to open dialog:", err);
            // Fallback for web mode if plugin fails
            const manual = prompt("Enter full path:");
            if (manual) {
                setDownloadPath(manual);
                localStorage.setItem('phantom_library_path', manual);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-border/50 bg-background/50 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <SettingsIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Settings</h2>
                            <p className="text-xs text-muted-foreground">Manage your preferences</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-4 h-4" />
                    </button>
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
                                    onClick={toggleAutoTheme}
                                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${autoThemeEnabled ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span
                                        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${autoThemeEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Automatically rotate themes every 15 seconds.
                            </p>
                        </div>
                    </div>

                    {/* Enable Theming Toggle (New) */}
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <div className="w-5 h-5 flex items-center justify-center text-primary font-bold text-xs">🎨</div>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-foreground">Advanced App Theming</label>
                                <button
                                    onClick={toggleEnableTheming}
                                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${enableTheming ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span
                                        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${enableTheming ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Inject custom CSS styles into the external Reader app.
                            </p>
                        </div>
                    </div>

                    {/* Confirm Deletion Toggle */}
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                            <Trash2 className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-foreground">Confirm Deletion</label>
                                <button
                                    onClick={toggleConfirmDelete}
                                    className={`relative w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${confirmDeleteEnabled ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span
                                        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${confirmDeleteEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                                    />
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Show a confirmation popup before deleting books.
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
                                    readOnly // Readonly for now until invoked
                                />
                                <button
                                    onClick={handleSelectPath}
                                    className="h-9 px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium rounded-md transition-colors"
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
                        onClick={onClose}
                        className="h-9 px-4 hover:bg-muted text-muted-foreground text-xs font-medium rounded-lg transition-colors mr-2"
                    >
                        Close
                    </button>
                    <button
                        onClick={onClose}
                        className="h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-colors shadow-sm"
                    >
                        Done
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
