import { getCurrentWindow } from '@tauri-apps/api/window';
import { useState, useEffect } from 'react';

export default function TitleBar() {
    const [isMaximized, setIsMaximized] = useState(false);

    // Tauri v2 API
    const appWindow = getCurrentWindow();

    useEffect(() => {
        const updateState = async () => {
            setIsMaximized(await appWindow.isMaximized());
        };
        updateState();

        const unlisten = appWindow.listen('tauri://resize', updateState);
        return () => {
            unlisten.then(f => f());
        };
    }, []);

    const minimize = () => appWindow.minimize();
    const toggleMaximize = async () => {
        await appWindow.toggleMaximize();
        setIsMaximized(await appWindow.isMaximized());
    };
    const close = () => appWindow.close();

    return (
        <div className="fixed top-0 left-0 right-0 h-10 z-50 flex items-center justify-between bg-transparent select-none">
            {/* Drag Region - Covers the entire bar except buttons */}
            <div data-tauri-drag-region className="absolute inset-0 z-0" />

            {/* App Title / Logo - Pass-through for drag */}
            <div className="relative z-10 text-[10px] font-black font-mono text-muted-foreground tracking-[0.25em] flex items-center gap-3 pointer-events-none pl-4">
                <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_10px_rgba(var(--primary-rgb),0.8)]" />
                PHANTOM
            </div>

            {/* Window Controls */}
            <div className="relative z-10 flex items-center h-full">
                <button
                    onClick={minimize}
                    className="h-full w-12 flex items-center justify-center hover:bg-primary/10 transition-colors group"
                >
                    <div className="w-3 h-[1px] bg-muted-foreground group-hover:bg-primary transition-colors" />
                </button>
                <button
                    onClick={toggleMaximize}
                    className="h-full w-12 flex items-center justify-center hover:bg-primary/10 transition-colors group"
                >
                    <div className={`border-muted-foreground group-hover:border-primary transition-colors box-border ${isMaximized ? 'w-2.5 h-2.5 border-t-[1px] border-l-[1px] border-r-[1px] border-b-[1px]' : 'w-2.5 h-2.5 border-[1px]'}`} />
                </button>
                <button
                    onClick={close}
                    className="h-full w-12 flex items-center justify-center hover:bg-destructive/10 transition-colors group"
                >
                    <svg className="w-3.5 h-3.5 text-muted-foreground group-hover:text-destructive transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>
    );
}
