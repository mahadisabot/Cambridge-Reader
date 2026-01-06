import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, AnimatePresence } from 'framer-motion';
import Ripple from './Ripple';

interface LoginProps {
    onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [view, setView] = useState<'generate' | 'login'>('generate');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setLoadingMessage('Authenticating...');
        setError(null);
        try {
            await invoke('login', { email, password });
            onLogin();
        } catch (err: any) {
            setError(err.toString());
            setIsLoading(false);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setLoadingMessage('Generating Identity...');
        setError(null);

        try {
            // 1. Create Account
            const creds = await invoke<string[]>('create_account');

            setLoadingMessage('Securing Session...');
            // 2. Auto-Login
            await invoke('login', { email: creds[0], password: creds[1] });

            // 3. Success Feedback & Transition
            try {
                await navigator.clipboard.writeText(`Email: ${creds[0]}\nPassword: ${creds[1]}`);
            } catch (clipboardErr) {
                console.warn("Clipboard write failed (likely permission denied), continuing login...", clipboardErr);
            }

            onLogin();
        } catch (err: any) {
            setError("Generation Failed: " + err.toString());
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden bg-background text-foreground selection:bg-primary/30">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-card via-background to-background opacity-80" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

            <div className="relative z-[100] w-full max-w-sm px-6">
                <AnimatePresence mode="wait">
                    {view === 'generate' ? (
                        <motion.div
                            key="generate"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center space-y-2">
                                <motion.div
                                    className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 bg-gradient-to-tr from-primary/20 to-accent/20 border border-primary/30 relative overflow-hidden"
                                    animate={{
                                        boxShadow: ["0 0 0px rgba(var(--primary-rgb), 0)", "0 0 40px rgba(var(--primary-rgb), 0.2)", "0 0 0px rgba(var(--primary-rgb), 0)"]
                                    }}
                                    transition={{ duration: 4, repeat: Infinity }}
                                >
                                    <span className="text-4xl filter drop-shadow-lg relative z-10 text-primary">⚡</span>
                                    <div className="absolute inset-0 bg-primary/10 blur-xl animate-pulse"></div>
                                </motion.div>
                                <h1 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-foreground to-muted-foreground">
                                    Instant Access
                                </h1>
                                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                                    One-click temporary Cambridge access
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="relative group">
                                    {/* Animated Ring */}
                                    {isLoading && (
                                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary via-accent to-primary opacity-75 blur-sm animate-[shimmer_2s_linear_infinite]" />
                                    )}

                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="relative w-full overflow-hidden bg-card border border-primary/50 hover:border-primary text-foreground font-bold py-5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-80 disabled:hover:scale-100 group shadow-2xl shadow-primary/20"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                        <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                                            {isLoading ? (
                                                <>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                        <span className="text-primary-foreground uppercase tracking-widest text-xs">{loadingMessage}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-lg tracking-tight text-foreground group-hover:text-primary-foreground transition-colors">Generate Account</span>
                                                    <span className="text-[10px] uppercase tracking-widest text-primary/80 font-mono">Auto-Login Enabled</span>
                                                </>
                                            )}
                                        </div>
                                        <Ripple color="rgba(var(--primary-rgb), 0.2)" />
                                    </button>
                                </div>

                                {error && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-xs text-destructive font-mono bg-destructive/10 p-2 rounded border border-destructive/20">
                                        {error}
                                    </motion.div>
                                )}

                                <div className="pt-4 text-center">
                                    <button
                                        onClick={() => setView('login')}
                                        disabled={isLoading}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors uppercase font-bold tracking-widest relative group"
                                    >
                                        <span className="relative z-10">Manual Login</span>
                                        <div className="absolute bottom-0 left-0 w-0 h-[1px] bg-foreground transition-all group-hover:w-full opacity-50"></div>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="login"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card/80 backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl relative"
                        >
                            <button
                                onClick={() => setView('generate')}
                                className="absolute top-4 left-4 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                            </button>

                            <div className="text-center mb-8 pt-2">
                                <h2 className="text-xl font-bold text-foreground">Manual Login</h2>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div className="space-y-1">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email"
                                        className="w-full bg-input/50 border border-border focus:border-primary rounded-lg px-4 py-3 text-sm outline-none transition-colors text-foreground placeholder-muted-foreground"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Password"
                                        className="w-full bg-input/50 border border-border focus:border-primary rounded-lg px-4 py-3 text-sm outline-none transition-colors text-foreground placeholder-muted-foreground"
                                        required
                                    />
                                </div>

                                {error && (
                                    <div className="text-xs text-destructive text-center bg-destructive/20 p-2 rounded">{error}</div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? 'Signing In...' : 'Sign In'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="fixed bottom-6 left-0 right-0 text-center pointer-events-none">
                    <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">
                        Cambridge Downloader v2.0 // <span className="text-primary/70">Secure</span>
                    </p>
                </div>
            </div>
        </div >
    );
}
