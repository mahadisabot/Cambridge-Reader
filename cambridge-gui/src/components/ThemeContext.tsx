import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { type Theme, themes, oledTheme } from '../lib/themes';
import { injectThemeClasses } from '../lib/ThemeManager';

interface ThemeContextType {
    theme: Theme;
    setTheme: (id: string) => void;
    autoThemeEnabled: boolean;
    toggleAutoTheme: () => void;
    confirmDeleteEnabled: boolean;
    toggleConfirmDelete: () => void;
    enableTheming: boolean;
    toggleEnableTheming: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: oledTheme,
    setTheme: () => { },
    autoThemeEnabled: false,
    toggleAutoTheme: () => { },
    confirmDeleteEnabled: true,
    toggleConfirmDelete: () => { },
    enableTheming: true,
    toggleEnableTheming: () => { },
});

export const useTheme = () => useContext(ThemeContext);




export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // LAZY INIT: Prevent flash to default
    const [theme, setThemeState] = useState<Theme>(() => {
        if (typeof window !== 'undefined') {
            const savedId = localStorage.getItem('app-theme');
            if (savedId) {
                const found = themes.find(t => t.id === savedId);
                if (found) return found;
            }
        }
        // Randomize initial theme on first startup
        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
        return randomTheme || oledTheme;
    });
    const [autoThemeEnabled, setAutoThemeEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('phantom_auto_theme') === 'true';
        }
        return false;
    });

    // 1. INJECT STATIC CSS ATTRIBUTE SELECTORS ON MOUNT
    useLayoutEffect(() => {
        injectThemeClasses();
        // Set initial attribute
        document.documentElement.setAttribute('data-theme', theme.id);
    }, []);

    // Also watch for theme changes (Safety)
    useLayoutEffect(() => {
        if (document.documentElement.getAttribute('data-theme') !== theme.id) {
            document.documentElement.setAttribute('data-theme', theme.id);
        }
    }, [theme]);


    // Interaction Tracking for Smart Idle (Global)
    const lastInteraction = React.useRef(Date.now());

    useEffect(() => {
        const handleInteraction = () => {
            lastInteraction.current = Date.now();
        };

        // Attach global listeners to detect user activity
        window.addEventListener('mousemove', handleInteraction, { passive: true });
        window.addEventListener('scroll', handleInteraction, { passive: true, capture: true });
        window.addEventListener('keydown', handleInteraction, { passive: true });
        window.addEventListener('click', handleInteraction, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleInteraction);
            window.removeEventListener('scroll', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('click', handleInteraction);
        };
    }, []);

    // Auto Switcher
    // Track current theme in ref to avoid effect re-running
    const themeRef = React.useRef(theme);
    useEffect(() => {
        themeRef.current = theme;
    }, [theme]);

    // Auto Switcher
    useEffect(() => {
        if (!autoThemeEnabled) return;

        console.log("Auto-Theme: Timer Started");
        const interval = setInterval(() => {
            // SMART IDLE CHECK: Only switch if user hasn't interacted for 2 seconds
            if (Date.now() - lastInteraction.current > 2000) {
                const randomTheme = themes[Math.floor(Math.random() * themes.length)];

                // Use Ref current value to check against
                if (randomTheme.id !== themeRef.current.id) {
                    console.log("Auto-Theme: Switching to", randomTheme.name);
                    triggerThemeTransition(randomTheme);
                }
            }
        }, 15000);

        return () => {
            console.log("Auto-Theme: Timer Stopped");
            clearInterval(interval);
        };
    }, [autoThemeEnabled]); // Removed 'theme' dependency
    const triggerThemeTransition = (newTheme: Theme) => {
        // Fallback
        if (!(document as any).startViewTransition) {
            document.body.classList.add('theme-transitioning');
            setThemeState(newTheme);
            document.documentElement.setAttribute('data-theme', newTheme.id);
            localStorage.setItem('app-theme', newTheme.id);
            setTimeout(() => document.body.classList.remove('theme-transitioning'), 1000);
            return;
        }

        const transition = (document as any).startViewTransition(() => {
            // ATOMIC ATTRIBUTE SWAP + SCAFFOLD + ANIMATION KILLER
            flushSync(() => {
                setThemeState(newTheme);

                // 1. SCAFFOLD: Force inline CSS VARIABLES via style attribute
                // This holds the values even if index.css hasn't recalculated the attribute selector yet.
                // It's a "Belt and Suspenders" approach.
                const root = document.documentElement;
                root.style.setProperty('--background', newTheme.colors.background, 'important');
                root.style.setProperty('--foreground', newTheme.colors.foreground, 'important');
                root.style.setProperty('--card', newTheme.colors.subAlt, 'important');

                // 2. SWAP ATTRIBUTE (ATOMIC)
                // Unlike classes, an attribute can only have ONE value. 
                // This physically prevents specificity wars.
                root.setAttribute('data-theme', newTheme.id);

                // 3. ANIMATION KILLER: Inject style to kill all transitions globally
                // We target pseudo-elements (::before, ::after) too, as Tailwind uses them heavily.
                // This ensures a complete 0ms visual snap for the entire DOM tree.
                if (!document.getElementById('transition-killer')) {
                    const killer = document.createElement('style');
                    killer.id = 'transition-killer';
                    killer.textContent = '*, *::before, *::after { transition: none !important; animation: none !important; }';
                    document.head.appendChild(killer);
                }
            });

            // Force Reflow
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            document.documentElement.offsetHeight;

            localStorage.setItem('app-theme', newTheme.id);
        });

        // Cleanup: IMMUTABLE SCAFFOLD STRATEGY
        transition.finished.then(() => {
            // 1. DO NOT REMOVE INLINE VARIABLES
            // We leave --background, --foreground, --card permanently on the HTML tag.
            // This acts as a hard shield against specificty reversion.
            // They will simply be overwritten by the next transition.

            // 2. REMOVE KILLER AFTER DELAY (HAMMER LATCH)
            // We wait 100ms to ensure absolutely every trace of the old state is gone
            // and the browser has fully recalculated the new layout.
            setTimeout(() => {
                const killer = document.getElementById('transition-killer');
                if (killer) killer.remove();

                // Ensure attribute is stuck (Just in case)
                const root = document.documentElement;
                if (root.getAttribute('data-theme') !== newTheme.id) {
                    root.setAttribute('data-theme', newTheme.id);
                }
            }, 100);
        });
    };

    const setTheme = (id: string) => {
        const found = themes.find(t => t.id === id);
        if (found) triggerThemeTransition(found);
    };

    const toggleAutoTheme = () => {
        const newValue = !autoThemeEnabled;
        setAutoThemeEnabled(newValue);
        if (newValue) {
            localStorage.setItem('phantom_auto_theme', 'true');
        } else {
            localStorage.removeItem('phantom_auto_theme');
        }
    };

    const [confirmDeleteEnabled, setConfirmDeleteEnabled] = useState(() => {
        if (typeof window !== 'undefined') {
            const val = localStorage.getItem('phantom_confirm_delete');
            return val === null ? true : val === 'true'; // Default to true
        }
        return true;
    });

    const toggleConfirmDelete = () => {
        const newValue = !confirmDeleteEnabled;
        setConfirmDeleteEnabled(newValue);
        localStorage.setItem('phantom_confirm_delete', String(newValue));
    };

    const [enableTheming, setEnableTheming] = useState(() => {
        if (typeof window !== 'undefined') {
            const val = localStorage.getItem('phantom_enable_theming');
            return val === null ? true : val === 'true'; // Default to true
        }
        return true;
    });

    const toggleEnableTheming = () => {
        const newValue = !enableTheming;
        setEnableTheming(newValue);
        localStorage.setItem('phantom_enable_theming', String(newValue));
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            setTheme,
            autoThemeEnabled,
            toggleAutoTheme,
            confirmDeleteEnabled,
            toggleConfirmDelete,
            enableTheming,
            toggleEnableTheming
        }}>
            {children}
        </ThemeContext.Provider>
    );
};
