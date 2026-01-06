import { themes, type Theme } from '../lib/themes';

/**
 * Generates and injects the CSS Classes for all available themes into the document head.
 * This allows for extremely fast, atomic theme switching by simply toggling the <html> className.
 * 
 * Format:
 * .theme-{id} {
 *   --background: ...;
 *   --foreground: ...;
 *   ...
 * }
 */
export const injectThemeClasses = () => {
    if (document.getElementById('static-theme-classes')) return;

    const cssParts: string[] = [];

    themes.forEach((t: Theme) => {
        const c = t.colors;
        const block = `
            html[data-theme="${t.id}"] {
                --background: ${c.background} !important;
                --foreground: ${c.foreground} !important;
                --card: ${c.subAlt} !important;
                --card-foreground: ${c.foreground} !important;
                --popover: ${c.background} !important;
                --popover-foreground: ${c.foreground} !important;
                --primary: ${c.primary} !important;
                --primary-foreground: ${c.background} !important;
                --secondary: ${c.sub} !important;
                --secondary-foreground: ${c.foreground} !important;
                --muted: ${c.subAlt} !important;
                --muted-foreground: ${c.sub} !important;
                --accent: ${c.caret} !important;
                --accent-foreground: ${c.background} !important;
                --destructive: ${c.error} !important;
                --destructive-foreground: ${c.background} !important;
                --border: ${c.sub} !important;
                --input: ${c.subAlt} !important;
                --ring: ${c.caret} !important;
            }
        `;
        cssParts.push(block);
    });

    const style = document.createElement('style');
    style.id = 'static-theme-classes';
    style.textContent = cssParts.join('\n');
    document.head.appendChild(style);
};
