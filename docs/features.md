# Feature Deep Dive

## ⚡ Instant Startup (Optimistic Auth)
**Problem**: The Cambridge backend is slow. Verifying a session token takes 3-10 seconds.
**Solution**: We "trust" the local state initially.
- **Mechanism**: When you log in, we write `session_active=true` to LocalStorage.
- **Next Launch**: The app sees this flag and renders the Library immediately.
- **Encryption**: The actual authorization tokens are stored safely in the Rust backend's memory/cookie store, not exposed to JS.

## 🤖 Auto-Account Generation
**Problem**: Creating a temporary account manually is tedious (email verification, form filling).
**Solution**: One-click generation.
1.  **Email Provider**: Uses `mail.gw` (via `mail_tm.rs`) to provision a deterministic temp email.
2.  **Gigya Registration**: The app mimics the Cambridge/Gigya registration frames to Create Account -> Get RegToken -> Finalize.
3.  **Auto-Login**: Once created, the app immediately logs you in with the new credentials.
4.  **Clipboard**: Credentials are copied to the clipboard (errors suppressed if permission denied) for backup.

## 📚 Library Management & Filters
- **"Show All" Strategy**: Cambridge's API paginates generic searches. We use a parallel scraper to fetch all books for specific keywords ("IELTS", "Cambridge", "English") to populate the "Show All" list.
- **Deduping**: Logic in `commands.rs` ensures we don't show the same book key twice.
- **Filters**:
    - **Live Search**: Filters by Title or ISBN instantly.
    - **Downloaded**: Shows only books present on disk.

## 🎨 Theme Engine
The app includes a robust theming system.
- **Randomization**: On first boot, a random theme is picked (e.g., "Dracula", "Nord", "Cyberpunk") to give a unique feel.
- **Persistence**: Using `ThemeContext`, user preference is saved.
- **Hot-Reload**: Changing a theme instantly updates CSS variables (`--primary`, `--background`) globally.
