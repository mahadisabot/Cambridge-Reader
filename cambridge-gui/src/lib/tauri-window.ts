
// Web-Compatible Wrapper for Tauri's Window API
// This prevents crashes in the browser when accessing window controls.

export function getCurrentWindow() {
    // Check if we are in Tauri environment
    // @ts-ignore
    if (window.__TAURI__ && window.__TAURI__.window) {
        // @ts-ignore
        return window.__TAURI__.window.getCurrentWindow();
    }

    console.log("[Web Mock] getCurrentWindow() called");

    // Mock Window Object for Web Debugging
    return {
        minimize: async () => console.log("[Web Mock] Window Minimize"),
        toggleMaximize: async () => console.log("[Web Mock] Window Toggle Maximize"),
        close: async () => console.log("[Web Mock] Window Close"),
        isMaximized: async () => false,
        listen: async (event: string, _callback: any) => {
            console.log(`[Web Mock] Window Listen: ${event}`);
            return () => { }; // Unlisten function
        }
    };
}
