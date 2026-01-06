
// Web-Compatible Wrapper for Tauri's invoke
// This allows the app to run in the browser for debugging purposes (UI/Themes)
// by mocking backend commands when window.__TAURI__ is missing.

export async function invoke<T>(cmd: string, args?: any): Promise<T> {
    // Check if we are in Tauri environment
    // @ts-ignore
    if (window.__TAURI__) {
        // @ts-ignore
        return window.__TAURI__.invoke(cmd, args);
    }

    console.log(`[Web Mock] invoke('${cmd}', ${JSON.stringify(args)})`);

    // Mock Responses for Web Debugging
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            switch (cmd) {
                case 'restore_session':
                    // Simulate session restore failure to force login screen, or success to go to dashboard.
                    // Let's assume we want to force login first, or if we have a mock token.
                    // For now, let's say "No session" to allow manual login testing.
                    // reject("No session found (Mock)");

                    // Actually, if we want to debug theme flicker quickly, let's restore successfully if we "logged in" previously.
                    // But simpler: just Reject so App shows Login screen.
                    reject("Mock Session Missing");
                    break;

                case 'create_account':
                    // Return mock credentials
                    resolve(["8284jade@comfythings.com", "Xd6G'GM,Q\"4g)h'"] as T);
                    break;

                case 'login':
                    // Always succeed with provided credentials
                    console.log("[Web Mock] Login Successful");
                    resolve(true as T);
                    break;

                case 'generate_key':
                    // Just in case this is used somewhere else
                    resolve(true as T);
                    break;

                default:
                    console.warn(`[Web Mock] Unknown command: ${cmd}`);
                    resolve(null as T);
            }
        }, 500); // 500ms network delay simulation
    });
}
