# Cambridge Downloader v2.0 - Release Notes

## 🚀 New Features
- **Bundled Installer**: Single-file setup (`CambridgeSetup_v1.exe`) that installs both Cambridge Downloader and Readest automatically.
- **Modern UI Refresh**: 
    - Full-screen immersive Login page (no more dark strip!).
    - Randomized Theme on First Launch.
    - Sleek "Glowing Book" Taskbar Icon.
- **Instant Startup**: Optimistic authentication reduces startup time to near-zero.

## 🛠 Fixes & Improvements
- **Account Generation**: 
    - Switched email provider to `mail.gw` for reliability.
    - Suppressed clipboard errors during generation (no more failing if specific permissions are denied).
    - Hardened error handling for "Service Unavailable" scenarios.
- **Library**:
    - "Show All Books" button now properly loads results without duplication.
    - Cover images load reliably using a unified caching system.
    - Fixed infinite scroll glitches.

## 📦 Download
The installer is located at:  
`dist_suite\Output\CambridgeSetup_v1.exe`
