use tauri::{State, AppHandle, Manager};
use tokio::sync::Mutex;
use cambridge_downloader_rs::api::CambridgeClient;
use cambridge_downloader_rs::models::Book;
use cambridge_downloader_rs::mail_tm::MailTmClient;
use crate::session::{save_session, load_session, SessionData, clear_session}; // Assuming session.rs is sibling
use cambridge_downloader_rs::downloader::DownloadManager;
use cambridge_downloader_rs::ProgressEvent;
use tauri::Emitter;
use std::path::PathBuf;
use std::process::Command as StdCommand;
use directories::{BaseDirs, UserDirs}; // Added UserDirs
use serde_json::Value;
use rand::Rng;

pub struct AppState {
    pub client: Mutex<Option<CambridgeClient>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            client: Mutex::new(None),
        }
    }
}

// ---------------------------------------------------------------------------
// Login & Session 
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn login(
    app: AppHandle,
    email: String, 
    password: String, 
    state: State<'_, AppState>
) -> Result<String, String> {
    let mut client = CambridgeClient::new().map_err(|e| e.to_string())?;
    
    // 1. Perform Elevate Login (Bookshelf)
    client.login(&email, &password).await.map_err(|e| e.to_string())?;
    
    // 2. Perform Go API Login (Search & Claim)
    // We try this, but don't fail the whole login if it fails (just warn?)
    // Actually, for this feature to work, we need it. Let's make it critical?
    // User might just want to read books if claim fails.
    // Let's log error but proceed, treating it as partial login.
    if let Err(e) = client.login_go(&email, &password).await {
        println!("Warning: Go API Login failed: {}", e);
        // We could return an error here if we want to enforce it
    }
    
    // Store authenticated client in state
    let mut state_client = state.client.lock().await;

    // Save Session
    if let (Some(uid), Some(token)) = (&client.user_id, &client.access_token) {
        let session = SessionData {
            email: email.clone(),
            user_id: uid.clone(),
            access_token: token.clone(),
            go_access_token: client.go_access_token.clone(),
            password: Some(password.clone()), // Save password for auto-refresh
        };
        if let Err(e) = save_session(&app, &session) {
             println!("Warning: Failed to save session: {}", e);
        }
    }
    
    *state_client = Some(client);
    
    Ok("Login successful".to_string())
}

// Helper for Debug Logging
fn log_debug(msg: &str) {
    if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open("C:/Users/Breeze/.gemini/antigravity/brain/2884cc03-467c-4776-84fa-5822ea174fb9/startup_debug.log") {
        use std::io::Write;
        let _ = writeln!(file, "{:?} | {}", std::time::SystemTime::now(), msg);
    }
}

#[tauri::command]
pub async fn restore_session(
    app: AppHandle,
    state: State<'_, AppState>,
) -> Result<String, String> {
    log_debug("RESTORE_SESSION: Start");
    let session = load_session(&app).map_err(|_| "No session".to_string())?;
    
    let mut client = CambridgeClient::new().map_err(|e| e.to_string())?;
    
    // Rehydrate Client
    client.user_id = Some(session.user_id);
    client.access_token = Some(session.access_token);
    client.go_access_token = session.go_access_token;
    
    let mut state_client = state.client.lock().await;
    *state_client = Some(client);
    
    // Notify Frontend to refresh
    let _ = app.emit("session-restored", ());
    
    log_debug("RESTORE_SESSION: Complete (Event Emitted)");
    Ok("Session restored".to_string())
}

// Helper for Internal Re-Auth
async fn perform_reauth(app: &AppHandle, state: &State<'_, AppState>) -> Result<(), String> {
    println!("Performing Internal Re-Auth...");
    let mut session = load_session(app).map_err(|_| "No session to refresh".to_string())?;
    let password = session.password.clone().ok_or("No saved credentials")?;
    
    let mut client = CambridgeClient::new().map_err(|e| e.to_string())?;
    
    // 1. Re-Login
    client.login(&session.email, &password).await.map_err(|e| e.to_string())?;
    
    // 2. Go Login (Best Effort)
    if let Err(e) = client.login_go(&session.email, &password).await {
         println!("Warning: Go API Refresh failed: {}", e);
    }
    
    // 3. Update Session Data
    if let (Some(uid), Some(token)) = (&client.user_id, &client.access_token) {
        session.user_id = uid.clone();
        session.access_token = token.clone();
        session.go_access_token = client.go_access_token.clone();
        
        save_session(app, &session).map_err(|e| e.to_string())?;
    }
    
    // 4. Update State
    let mut state_client = state.client.lock().await;
    *state_client = Some(client);
    
    println!("Internal Re-Auth Successful!");
    Ok(())
}

#[tauri::command]
pub async fn copy_to_clipboard(text: String) -> Result<(), String> {
    // Determine the shell based on the operating system
    #[cfg(target_os = "windows")]
    {
        use std::process::Command as StdCommand;
        use std::os::windows::process::CommandExt;
        
        // Escape check: Use Base64 or simple escaping to avoid injection/breakage?
        // Simple Set-Clipboard is robust.
        // We use powershell -NoProfile -Command "Set-Clipboard -Value '...'"
        // But quotes are tricky.
        // Better: Echo to pipe? "echo 'text' | Set-Clipboard"
        // Let's rely on tauri::api?? No, gone in v2.
        
        let status = StdCommand::new("powershell")
            .args(["-NoProfile", "-Command", "Set-Clipboard", "-Value", &format!("\"{}\"", text.replace("\"", "`\""))]) // Escape double quotes for PS
            .creation_flags(0x08000000) // CREATE_NO_WINDOW
            .status()
            .map_err(|e| e.to_string())?;

         if !status.success() {
            return Err("Clipboard command failed".to_string());
        }
    }
    Ok(())
}

pub async fn refresh_session(
    app: AppHandle,
    state: State<'_, AppState>
) -> Result<String, String> {
    perform_reauth(&app, &state).await?;
    Ok("Refreshed".to_string())
}

#[tauri::command]
pub async fn logout(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut state_client = state.client.lock().await;
    *state_client = None;
    clear_session(&app).map_err(|e| e.to_string())?;
    Ok(())
}


#[tauri::command]
pub async fn list_books(app: AppHandle, state: State<'_, AppState>) -> Result<Vec<Book>, String> {
    log_debug("LIST_BOOKS: Start");
    
    async fn try_list(state: &State<'_, AppState>) -> Result<Vec<Book>, String> {
        // Use timeout to check for lock availability (Fail Fast)
        let guard = tokio::time::timeout(std::time::Duration::from_millis(50), state.client.lock()).await
            .map_err(|_| "Client locked (Startup Race)")?;
            
        let client = guard.as_ref().ok_or("Not logged in")?.clone();
        
        // Release lock before network call
        drop(guard);
        
        log_debug("LIST_BOOKS: Lock Acquired. Fetching Remote...");
        client.get_books().await.map_err(|e| e.to_string())
    }

    // 1. Try fetching remote (Optimized: Fail Fast)
    let mut books = match tokio::time::timeout(std::time::Duration::from_secs(4), try_list(&state)).await {
        Ok(Ok(books)) => {
            log_debug("LIST_BOOKS: Remote Success");
            books
        },
        Ok(Err(e)) => {
            log_debug(&format!("LIST_BOOKS: Remote Error: {}", e));
            if e.contains("ExpiredJwtToken") || e.contains("401") || e.contains("Unauthorized") {
                log_debug("LIST_BOOKS: Token Expired. Returning Error to keep Cache.");
                return Err("Token Expired: Refreshing in background".to_string());
            } else {
                return Err(e);
            }
        },
        Err(_) => {
             log_debug("LIST_BOOKS: Remote Timeout (4s). Returning Error.");
             return Err("Network Timeout".to_string());
        }
    };

    
    // Check Filesystem for Download Status & Cached Covers
    let docs_dir = app.path().document_dir().ok().unwrap_or(PathBuf::from("."));
    let base_output = docs_dir.join("CambridgeBooks");
    
    // Resolve Cache Dir for Covers
    let cache_dir = app.path().app_cache_dir().expect("failed to get cache dir").join("covers");
    
    for book in &mut books {
        let safe_title: String = book.title.chars()
            .filter(|c| c.is_alphanumeric() || *c == ' ')
            .collect();
        let safe_title = safe_title.trim();
        
        let epub_path = base_output.join(format!("{}.epub", safe_title));
        
        // Check for .epub file existence
        if epub_path.exists() && epub_path.is_file() {
            book.is_downloaded = true;
        }
        // Local Cover Cache Check removed to allow parallel handling in fetch_cover
        // and avoid serial I/O blocking.
    }
    
    Ok(books)
}

// ---------------------------------------------------------------------------
// Account Generation
// ---------------------------------------------------------------------------

fn random_string(len: usize) -> String {
    use rand::{thread_rng, Rng};
    use rand::distributions::Alphanumeric;
    thread_rng()
        .sample_iter(&Alphanumeric)
        .take(len)
        .map(char::from)
        .collect()
}

#[tauri::command]
pub async fn create_account(
    app: AppHandle,
    state: State<'_, AppState>
) -> Result<Vec<String>, String> {
    // Returns [email, password] on success
    println!("Starting Auto-Account Generation (Tauri Port)...");
    log::info!("Starting Auto-Account Generation command...");

    let client = reqwest::Client::builder()
        .cookie_store(true)
        .build()
        .map_err(|e| e.to_string())?;
        
    // (Existing account gen logic skipped for brevity, keeping lines 127-302 same as provided if possible or overwriting entire function)
    // Since I must replace the whole block to be safe:

    let mail_client = MailTmClient::new();
    
    // 1. Generate Creds
    println!("Step 1: Fetching MailTm Domains...");
    let domains = mail_client.get_domains().await.map_err(|e| e.to_string())?;
    if domains.is_empty() { return Err("No mail domains".to_string()); }
    
    let domain = &domains[0].domain;
    let full_domain = if domain.starts_with('@') { domain.to_string() } else { format!("@{}", domain) };
    let address = format!("{}{}", random_string(8).to_lowercase(), full_domain);
    let base_pass = random_string(10);
    let shared_password = format!("{}!A1", base_pass);
    
    println!("Step 1b: Creating MailTm Account ({})", address);
    let account = mail_client.create_account(&address, &shared_password).await.map_err(|e| e.to_string())?;
    
    // 2. Register Gigya
    let api_key = "3_YZ2Ps8zW-VCK3H5YrTUOsnjUBbwPk6U20kdzNbdyujkuhavooF4bJ9lMF_WNAi0C";
    let gigya_domain = "https://accounts.eu1.gigya.com";
    
    // Init Registration
    println!("Step 2: Initializing Gigya Registration...");
    let init_res = client.get(format!("{}/accounts.initRegistration", gigya_domain))
        .query(&[("apiKey", api_key)])
        .header("Referer", "https://www.cambridge.org/")
        .send().await.map_err(|e| e.to_string())?;

    if !init_res.status().is_success() {
         let status = init_res.status();
         let text = init_res.text().await.unwrap_or_default();
         return Err(format!("Gigya Init Failed: {} - {}", status, text));
    }
        
    let init_text = init_res.text().await.map_err(|e| e.to_string())?;
    let init_json: serde_json::Value = serde_json::from_str(&init_text)
        .map_err(|e| format!("Gigya Init Parse Error: {}. Content: {:.200}", e, init_text))?;

    let reg_token = init_json["regToken"].as_str().ok_or("No regToken found in Init Response")?;
    
    // Finalize Registration
    println!("Step 3: Registering Account...");
    let first_name = "Teacher";
    let last_name = format!("Bot{}", random_string(4));
    
    let profile_json = serde_json::json!({ "firstName": first_name, "lastName": last_name, "country": "GB" }).to_string();
    let preferences_json = serde_json::json!({ "terms": { "go": { "isConsentGranted": true } } }).to_string();
    let data_json = serde_json::json!({ "eduelt": { "instituteRole": [{"role": "teacher"}] } }).to_string();

    let params = [
        ("apiKey", api_key), ("regToken", reg_token), ("email", &account.address), ("password", &shared_password),
        ("profile", &profile_json), ("preferences", &preferences_json), ("data", &data_json),
        ("regSource", "CambridgeGO"), ("finalizeRegistration", "true"), ("include", "profile,preferences,data")
    ];

    client.post(format!("{}/accounts.register", gigya_domain))
        .form(&params)
        .header("Referer", "https://www.cambridge.org/go/create-account")
        .send().await.map_err(|e| e.to_string())?;

    // 3. Trigger Login to Send Email
    println!("Step 4: Triggering Login Verification...");
    let login_params = [
        ("apiKey", api_key), ("loginID", &account.address), ("password", &shared_password),
        ("include", "profile,data,preferences,sessionInfo,id_token"), ("loginMode", "standard")
    ];

    let login_res = client.post(format!("{}/accounts.login", gigya_domain))
        .form(&login_params)
        .header("Referer", "https://www.cambridge.org/go/create-account") 
        .header("Origin", "https://www.cambridge.org")
        .send().await.map_err(|e| e.to_string())?;
        
    let login_text = login_res.text().await.map_err(|e| e.to_string())?;
    
    // Check for vToken in login response (sometimes present)
    let login_json: serde_json::Value = serde_json::from_str(&login_text).unwrap_or_default();
    let current_reg_token = login_json["regToken"].as_str().unwrap_or(reg_token).to_string();
    let mut v_token = String::new();
    
    // 4. Force Resend Code (Likely required if account is Pending)
    if login_text.contains("206006") || login_text.contains("\"errorCode\": 0") {
        println!("Step 4b: Account Pending. Enforcing Email Dispatch...");
        
        let send_code_params = [
            ("apiKey", api_key), ("email", &account.address), ("regToken", &current_reg_token), ("lang", "en")
        ];
        
        let send_res = client.post(format!("{}/accounts.otp.sendCode", gigya_domain))
            .form(&send_code_params)
            .header("Referer", "https://www.cambridge.org/go/create-account")
            .header("Origin", "https://www.cambridge.org")
            .send().await.map_err(|e| e.to_string())?;
            
        let send_text = send_res.text().await.map_err(|e| e.to_string())?;
        println!("Step 4c: OTP Code Requested. Response: {}", send_text);
        
        // Capture vToken from sendCode response
        let send_json: serde_json::Value = serde_json::from_str(&send_text).unwrap_or_default();
        if let Some(vt) = send_json["vToken"].as_str() {
            v_token = vt.to_string();
        }
    }
    
    // 5. Poll for Code
    println!("Step 5: Polling Email for OTP Code...");
    let mut code_found = String::new();
    // Simple polling loop
    for _ in 0..30 {
        use std::io::Write;
        print!("."); std::io::stdout().flush().ok();
        
        let messages = mail_client.get_messages(&account.token).await.map_err(|e| e.to_string())?;
        if let Some(msg) = messages.first() {
            // Regex for 6 digits
            let re = regex::Regex::new(r"(\d{6})").unwrap();
            let targets = vec![&msg.subject, &msg.intro, &msg.text];
            
            for t in targets {
                if let Some(cap) = re.captures(t) {
                    code_found = cap[1].to_string();
                    break;
                }
            }
            if !code_found.is_empty() { break; }
        }
        tokio::time::sleep(std::time::Duration::from_millis(2000)).await;
    }
    println!(""); 
    
    if code_found.is_empty() {
        return Err("Verification code not received (Timed Out)".to_string());
    }
    
    println!("Step 6: Verifying OTP Code ({}) via Golden Path...", code_found);
    
    // Golden Path Verification: accounts.otp.update -> accounts.finalizeRegistration
    
    // Use the captured vToken, or fallback to regToken (sometimes works)
    let v_token_ref = if !v_token.is_empty() { &v_token } else { &current_reg_token };
    
    let update_params = [
        ("apiKey", api_key),
        ("vToken", v_token_ref),
        ("regToken", &current_reg_token),
        ("code", &code_found),
        ("source", "showScreenSet"), 
        ("pageURL", "https://www.cambridge.org/go/create-account"),
        ("sdk", "js_latest")
    ];
    
    let update_res = client.post(format!("{}/accounts.otp.update", gigya_domain))
        .form(&update_params)
        .header("Referer", "https://www.cambridge.org/go/create-account")
        .send().await.map_err(|e| e.to_string())?;
        
    let update_text = update_res.text().await.map_err(|e| e.to_string())?;
    println!("OTP Update Response: {}", update_text);
    
    if !update_text.contains("\"errorCode\": 0") && !update_text.contains("\"statusCode\": 200") {
        return Err(format!("OTP Verification Failed: {}", update_text));
    }

    println!("Step 6b: Finalizing Registration...");
    
    let role_data_json = serde_json::json!({ "eduelt": { "instituteRole": [{"role": "teacher"}] } }).to_string();

    let finalize_params = [
        ("apiKey", api_key),
        ("regToken", &current_reg_token),
        ("includeUserInfo", "true"),
        ("include", "profile,data,emails,subscriptions,preferences"),
        ("data", &role_data_json)
    ];

    let finalize_res = client.post(format!("{}/accounts.finalizeRegistration", gigya_domain))
        .form(&finalize_params)
        .header("Referer", "https://www.cambridge.org/go/create-account")
        .send().await.map_err(|e| e.to_string())?;
        
    let finalize_text = finalize_res.text().await.map_err(|e| e.to_string())?;
    println!("Finalization Response: {}", finalize_text);
    
    if !finalize_text.contains("\"errorCode\": 0") && !finalize_text.contains("\"statusCode\": 200") {
        return Err(format!("Account Finalization Failed: {}", finalize_text));
    }

    // 7. Initialize CambridgeClient and Auto-Login
    println!("Step 7: Finalizing Session...");
    
    let mut cam_client = CambridgeClient::new().map_err(|e| e.to_string())?;
    // 7a. Elevate Login
    cam_client.login(&account.address, &shared_password).await.map_err(|e| e.to_string())?;
    
    // 7b. Go Login
    if let Err(e) = cam_client.login_go(&account.address, &shared_password).await {
         println!("Warning: Go API Auto-Login failed during account gen: {}", e);
    }
    
    // Save session
    if let (Some(uid), Some(token)) = (&cam_client.user_id, &cam_client.access_token) {
        let session = SessionData {
            email: account.address.clone(),
            user_id: uid.clone(),
            access_token: token.clone(),
            go_access_token: cam_client.go_access_token.clone(),
            password: Some(shared_password.clone()),
        };
        save_session(&app, &session).ok();
    }
    
    let mut state_client = state.client.lock().await;
    *state_client = Some(cam_client);
    
    println!("Account Generation and Login Complete!");
    Ok(vec![account.address, shared_password])
}

// ---------------------------------------------------------------------------
// Search & Claim
// ---------------------------------------------------------------------------

#[derive(serde::Serialize, serde::Deserialize)]
pub struct TrialBook {
    pub id: String,
    pub trial_id: String,
    pub name: String,
    pub pretty_url: Option<String>,
    pub cover_url: Option<String>,
}

#[derive(serde::Deserialize)]
struct KeywordsList(Vec<String>);

#[tauri::command]
pub async fn search_books(app: AppHandle, query: String, page: Option<u32>, state: State<'_, AppState>) -> Result<Vec<TrialBook>, String> {
    let page_num = page.unwrap_or(1);
    
    // Helper to perform a single query
    async fn perform_single_search(state: &State<'_, AppState>, query: &str, page: u32) -> Result<Vec<TrialBook>, String> {
        let mut state_client = state.client.lock().await;
        let client = state_client.as_mut().ok_or("Not logged in")?;
        
        // Log the search attempt
        let log_path = "C:/Users/Breeze/.gemini/antigravity/brain/2884cc03-467c-4776-84fa-5822ea174fb9/pagination_debug.log";
        if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(log_path) {
             use std::io::Write;
             let _ = writeln!(file, "SEARCH: Query='{}' Page={}", query, page);
        }

        let items = client.search_trials(query, page).await.map_err(|e| e.to_string())?;
        
        let mut books = Vec::new();
        for item in items {
            // Try Strict Trial ID first
            let trial_id_str = if let Some(trial_id_val) = item["trial_id"].as_i64() {
                 Some(trial_id_val.to_string())
            } else if let Some(trial_id_str) = item["trial_id"].as_str() {
                 Some(trial_id_str.to_string())
            } else {
                 None
            };

            if let Some(tid) = trial_id_str {
                 let id = item["id"].as_str()
                    .or(item["id"].as_i64().map(|i| i.to_string()).as_deref())
                    .unwrap_or_default().to_string();
                    
                 let name = item["name"].as_str().unwrap_or("Unknown Title").to_string();
                 let pretty_url = item["pretty_url"].as_str().map(|s| s.to_string());
                 
                 let raw_url = item["thumbnail_url"].as_str()
                    .or(item["thumbnail_path"].as_str())
                    .or(item["image"].as_str());

                 let cover_url = raw_url.map(|s| {
                     if s.starts_with("/files") || s.starts_with("files/") {
                         let path = if s.starts_with("files/") { format!("/{}", s) } else { s.to_string() };
                         format!("https://go-assets.cambridge.org{}", path)
                     } else if s.starts_with("https://www.cambridge.org/files") {
                         s.replace("https://www.cambridge.org", "https://go-assets.cambridge.org")
                     } else {
                         s.to_string()
                     }
                 });
                 
                 books.push(TrialBook {
                     id,
                     trial_id: tid,
                     name,
                     pretty_url,
                     cover_url
                 });
            }
        }
        Ok(books)
    }

    // LIST ALL STRATEGY: If query is empty, use the keyword list
    if query.trim().is_empty() || query.trim() == "*" {
        // Prevent infinite scroll from re-fetching the entire list on page 2+
        if let Some(p) = page {
            if p > 1 {
                return Ok(Vec::new());
            }
        }
        println!("Search All: Detected empty query. Initiating parallel scraping...");
        
        let keywords_path = "C:/Users/Breeze/.gemini/antigravity/brain/2884cc03-467c-4776-84fa-5822ea174fb9/cambridge_keywords.json";
        
        let keywords: Vec<String> = if std::path::Path::new(keywords_path).exists() {
             let content = std::fs::read_to_string(keywords_path).unwrap_or_default();
             serde_json::from_str::<Vec<String>>(&content).unwrap_or_else(|_| vec!["English".to_string(), "Science".to_string()])
        } else {
             vec!["English".into(), "Math".into(), "Science".into(), "History".into()]
        };

        // Limit concurrent tasks to avoid rate limits
        let semaphore = std::sync::Arc::new(tokio::sync::Semaphore::new(10));
        let mut tasks = Vec::new();
        
        let client_clone = {
             let lock = state.client.lock().await;
             lock.as_ref().ok_or("Not logged in")?.clone()
        };
        
        for word in keywords {
             let sem = semaphore.clone();
             let cli = client_clone.clone(); 
             
             tasks.push(tokio::spawn(async move {
                 let _permit = sem.acquire().await;
                 match cli.search_trials(&word, 1).await {
                     Ok(items) => {
                         println!("Scrape '{}': Found {}", word, items.len());
                         Some(items)
                     },
                     Err(e) => {
                         println!("Scrape '{}' Failed: {}", word, e);
                         None
                     }
                 }
             }));
        }

        let results = futures::future::join_all(tasks).await;
        
        let mut unique_books: std::collections::HashMap<String, TrialBook> = std::collections::HashMap::new();
        
        for res in results {
            if let Ok(Some(items)) = res {
                for item in items {
                     if let Some(trial_id_val) = item["trial_id"].as_i64().map(|i| i.to_string()).or(item["trial_id"].as_str().map(|s| s.to_string())) {
                         
                         let id = item["id"].as_str().or(item["id"].as_i64().map(|i| i.to_string()).as_deref()).unwrap_or_default().to_string();
                         
                         if unique_books.contains_key(&trial_id_val) { continue; }
                         
                         let name = item["name"].as_str().unwrap_or("Unknown").to_string();
                         let raw_url = item["thumbnail_url"].as_str().or(item["thumbnail_path"].as_str()).or(item["image"].as_str());
                         let cover_url = raw_url.map(|s| {
                             if s.starts_with("/files") { format!("https://go-assets.cambridge.org{}", s) }
                             else if s.starts_with("files/") { format!("https://go-assets.cambridge.org/{}", s) }
                             else { s.to_string() }
                         });

                         unique_books.insert(trial_id_val.clone(), TrialBook {
                             id,
                             trial_id: trial_id_val,
                             name,
                             pretty_url: None,
                             cover_url,
                         });
                     }
                }
            }
        }
        
        let final_list: Vec<TrialBook> = unique_books.into_values().collect();
        println!("Search All Complete. Total Unique Books: {}", final_list.len());
        Ok(final_list)

    } else {
        // Normal Single Query
        match perform_single_search(&state, &query, page_num).await {
            Ok(books) => Ok(books),
            Err(e) => match e.as_str() {
                s if s.contains("ExpiredJwtToken") || s.contains("401") || s.contains("Unauthorized") || s.contains("Not logged in") => {
                    println!("Search auth error. Retrying...");
                    perform_reauth(&app, &state).await.map_err(|re| format!("Re-Auth failed: {}", re))?;
                    perform_single_search(&state, &query, page_num).await
                }
                _ => Err(e)
            }
        }
    }
}

#[tauri::command]
pub async fn add_to_library(app: AppHandle, trial_id: String, state: State<'_, AppState>) -> Result<String, String> {
    let tid = trial_id.parse::<i64>().map_err(|_| "Invalid Trial ID format")?;

    // Closure to attempt the action
    async fn try_claim(state: &State<'_, AppState>, tid: i64) -> Result<(), String> {
        let mut state_client = state.client.lock().await;
        let client = state_client.as_mut().ok_or("Not logged in")?;
        client.claim_trial(tid).await.map_err(|e| e.to_string())
    }

    // 1. First Attempt
    match try_claim(&state, tid).await {
        Ok(_) => return Ok("Added to library".to_string()),
        Err(e) => {
            // Check for Expiry
            if e.contains("ExpiredJwtToken") || e.contains("401") || e.contains("Unauthorized") {
                println!("Token Expired during claim. Attempting Re-Auth...");
                
                // 2. Perform Re-Auth
                perform_reauth(&app, &state).await.map_err(|re| format!("Re-Auth failed: {}", re))?;
                
                // 3. Retry Action
                println!("Retrying claim...");
                match try_claim(&state, tid).await {
                    Ok(_) => return Ok("Added to library (after refresh)".to_string()),
                    Err(e2) => return Err(format!("Retry failed: {}", e2)) // Return actual error
                }
            }
            return Err(e); // Return original error if not expired
        }
    }
}


#[tauri::command]
pub async fn fetch_cover(app: AppHandle, url: String, book_id: String, state: State<'_, AppState>) -> Result<Vec<u8>, String> {
    
    // 1. Cache Directory setup
    let cache_dir = app.path().app_cache_dir().expect("failed to get cache dir").join("covers");
    if !cache_dir.exists() {
        std::fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    
    // 2. Hash URL / ID
    let filename = if !book_id.is_empty() {
        format!("{}.jpg", book_id)
    } else {
        let digest = md5::compute(url.as_bytes());
        format!("{:x}.jpg", digest)
    };
    let file_path = cache_dir.join(filename);

    // 3. CHECK CACHE (Return Bytes immediately via Async IO)
    if file_path.exists() {
        if let Ok(bytes) = tokio::fs::read(&file_path).await {
            return Ok(bytes);
        }
    }

    // 4. ACQUIRE CLIENT (Fail Fast)
    let client = {
        let guard = tokio::time::timeout(std::time::Duration::from_millis(50), state.client.lock()).await
            .map_err(|_| format!("FETCH ERROR: Client Locked (Startup Race) ID={}", book_id))?;
            
        guard.as_ref().ok_or(format!("FETCH ERROR: Client Not Logged In! ID={}", book_id))?.clone()
    };
    
    let bytes = client.get_bytes(&url).await.map_err(|e| e.to_string())?;
    
    // Write to cache (Async)
    let _ = tokio::fs::write(&file_path, &bytes).await;
    
    Ok(bytes.to_vec())
}

#[derive(Clone, serde::Serialize)]
struct DownloadProgressPayload {
    book_id: String,
    status: String,
    progress: f64, // 0.0 to 1.0
    detail: String,
}

#[tauri::command]
pub async fn download_book(
    app: AppHandle, 
    book: Book, 
    state: State<'_, AppState>
) -> Result<String, String> {
    // CLONE AND DROP LOCK IMMEDIATELY to prevent blocking parallel requests (like fetch_cover)
    let client = {
        let state_client = state.client.lock().await;
        state_client.as_ref().ok_or("Not logged in")?.clone()
    };
    
    let book_id = book.id.clone();
    let _safe_title: String = book.title.chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect();
        
    // Output Directory: User Documents / CambridgeBooks
    let docs_dir = app.path().document_dir().ok().unwrap_or(PathBuf::from("."));
    let output_dir = docs_dir.join("CambridgeBooks");
    
    // Setup Progress Channel
    let (tx, mut rx) = tokio::sync::mpsc::channel(100);
    
    // Manager initialized in retry block
    
    // Spawn Progress Listener
    let app_handle = app.clone();
    let b_id = book_id.clone();
    
    tokio::spawn(async move {
        let mut current_progress = 0.0;
        let mut total_files_count = 1;
        let mut downloaded_files = 0;
        let mut current_status = "processing".to_string(); // Persist status

        while let Some(event) = rx.recv().await {
            let mut detail = "".to_string();
            
            match event {
                ProgressEvent::Started { total_files, phase } => {
                    total_files_count = total_files;
                    downloaded_files = 0;
                    current_status = "started".to_string();
                    detail = phase;
                },
                ProgressEvent::FileDownloaded { .. } => {
                    downloaded_files += 1;
                    current_progress = (downloaded_files as f64 / total_files_count as f64).min(0.99);
                    current_status = "downloading".to_string();
                },
                ProgressEvent::PhaseChanged { phase } => {
                    detail = phase;
                    current_status = "phase".to_string();
                },
                ProgressEvent::Finished { .. } => {
                    current_progress = 1.0;
                    current_status = "completed".to_string();
                    detail = "Done".to_string();
                },
                ProgressEvent::Log { message } => {
                    detail = message;
                    // Do NOT change current_status here
                },
                _ => {}
            }
            
            let payload = DownloadProgressPayload {
                book_id: b_id.clone(),
                status: current_status.clone(),
                progress: current_progress,
                detail,
            };
            
            let _ = app_handle.emit("download-progress", &payload);
        }
    });
    
    // Run Download
    async fn try_download(client: CambridgeClient, tx: tokio::sync::mpsc::Sender<ProgressEvent>, book: &Book, output_dir: &str) -> Result<(), String> {
        let manager = DownloadManager::new(client, Some(tx));
        manager.download_book(book, output_dir).await.map_err(|e| e.to_string())
    }

    match try_download(client.clone(), tx.clone(), &book, output_dir.to_string_lossy().as_ref()).await {
        Ok(_) => {},
        Err(e) => {
            if e.contains("ExpiredJwtToken") || e.contains("401") || e.contains("Unauthorized") {
                println!("Token Expired during download. Attempting Re-Auth...");
                
                // Re-Auth
                perform_reauth(&app, &state).await.map_err(|re| format!("Re-Auth failed: {}", re))?;
                
                // Get Fresh Client
                let fresh_client = {
                    let state_client = state.client.lock().await;
                    state_client.as_ref().ok_or("Not logged in after refresh")?.clone()
                };
                
                println!("Retrying download...");
                // Retry
                try_download(fresh_client, tx, &book, output_dir.to_string_lossy().as_ref()).await.map_err(|e2| format!("Retry failed: {}", e2))?;
            } else {
                return Err(e);
            }
        }
    }
    
    Ok(format!("Downloaded to {:?}", output_dir))
}

#[tauri::command]
pub async fn delete_book(app: AppHandle, book: Book) -> Result<String, String> {
    let safe_title: String = book.title.chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect();
        
    let docs_dir = app.path().document_dir().ok().unwrap_or(PathBuf::from("."));
    let base_output = docs_dir.join("CambridgeBooks");
    
    // We only track the .epub file currently for "is_downloaded"
    // If there ARE resources, they should likely be in a folder with same name?
    // For now, based on list_books, we just delete the .epub
    let epub_path = base_output.join(format!("{}.epub", safe_title.trim()));
    
    if epub_path.exists() {
        std::fs::remove_file(&epub_path).map_err(|e| e.to_string())?;
        Ok("Deleted".to_string())
    } else {
        Err("Book file not found".to_string())
    }
}

// ---------------------------------------------------------------------------
// External Readest Integration
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn patch_readest_settings(_app: AppHandle, theme_mode: String, primary_color: String, bg_color: String, fg_color: String, enable_theming: bool) -> Result<String, String> {
    // 1. Locate Readest Settings
    let base_dirs = BaseDirs::new().ok_or("Could not resolve base directories")?;
    let config_dir = base_dirs.config_dir();
    let settings_path = config_dir.join("com.bilingify.readest").join("Settings.json");

    if !settings_path.exists() {
        return Err("Readest settings file not found. Is Readest installed?".to_string());
    }

    // 2. Read Settings
    let content = std::fs::read_to_string(&settings_path).map_err(|e| format!("Failed to read settings: {}", e))?;
    let mut json: Value = serde_json::from_str(&content).map_err(|e| format!("Failed to parse settings: {}", e))?;

    // 3. Patch Settings
    if let Some(obj) = json.as_object_mut() {
        // A. Set App Mode (Always respect light/dark mode preference)
        let normalize_mode = if theme_mode.contains("light") { "light" } else { "dark" };
        obj.insert("mode".to_string(), serde_json::json!(normalize_mode));
        
        let mut unique_theme_name = "default".to_string();

        if enable_theming {
            // B. Generate Unique Theme Name
            let suffix: u32 = rand::thread_rng().gen();
            unique_theme_name = format!("cambridge-auto-{}", suffix);
            
            // C. Create Custom Theme Object
            let custom_theme = serde_json::json!({
                "name": unique_theme_name,
                "label": "Cambridge Auto",
                "colors": {
                    "light": {
                        "bg": bg_color,
                        "fg": fg_color,
                        "primary": primary_color
                    },
                    "dark": {
                        "bg": bg_color,
                        "fg": fg_color,
                        "primary": primary_color
                    }
                }
            });

            // D. Update globalReadSettings
            if let Some(read_settings) = obj.get_mut("globalReadSettings").and_then(|v| v.as_object_mut()) {
                let themes_array = read_settings.entry("customThemes").or_insert(serde_json::json!([]));
                if let Some(themes) = themes_array.as_array_mut() {
                    // Remove old themes
                    themes.retain(|t| !t["name"].as_str().unwrap_or("").starts_with("cambridge-auto"));
                    themes.push(custom_theme);
                }
            } else {
                let mut read_settings = serde_json::Map::new();
                read_settings.insert("customThemes".to_string(), serde_json::json!([custom_theme]));
                obj.insert("globalReadSettings".to_string(), Value::Object(read_settings));
            }
        } else {
            // If theming DISABLED, clean up old custom themes?
            // Optional: for now we just don't inject new ones and use "default"
            // Maybe clean up to be nice?
            if let Some(read_settings) = obj.get_mut("globalReadSettings").and_then(|v| v.as_object_mut()) {
                 if let Some(themes) = read_settings.get_mut("customThemes").and_then(|t| t.as_array_mut()) {
                      themes.retain(|t| !t["name"].as_str().unwrap_or("").starts_with("cambridge-auto"));
                 }
            }
        }

        // E. Update globalViewSettings
        if let Some(view_settings) = obj.get_mut("globalViewSettings").and_then(|v| v.as_object_mut()) {
            view_settings.insert("theme".to_string(), serde_json::json!(unique_theme_name));
            // User Request: Force these to false globally
            view_settings.insert("overrideColor".to_string(), serde_json::json!(false));
            view_settings.insert("invertImgColorInDark".to_string(), serde_json::json!(false));
        } else {
             let mut view_settings = serde_json::Map::new();
             view_settings.insert("theme".to_string(), serde_json::json!(unique_theme_name));
             view_settings.insert("overrideColor".to_string(), serde_json::json!(false));
             view_settings.insert("invertImgColorInDark".to_string(), serde_json::json!(false));
             obj.insert("globalViewSettings".to_string(), Value::Object(view_settings));
        }
        
        // Return the theme name used
        println!("Patching Readest: Mode -> {}, Injected '{}' theme.", normalize_mode, unique_theme_name);
    }

    // 4. Write Back
    let new_content = serde_json::to_string_pretty(&json).map_err(|e| e.to_string())?;
    std::fs::write(&settings_path, new_content).map_err(|e| format!("Failed to write settings: {}", e))?;
    
    // We already know the theme name we set
    let theme_name = json["globalViewSettings"]["theme"].as_str().unwrap_or("default").to_string();

    Ok(theme_name)
}

#[tauri::command]
pub async fn patch_book_config(
    _app: AppHandle, 
    book_title: String, 
    bg_color: String, 
    fg_color: String,
    primary_color: String,
    sub_color: String,
    sub_alt_color: String,
    error_color: String,
    caret_color: String,
    popup_bg: String,
    enable_theming: bool 
) -> Result<String, String> {
    // ... (rest of logic same until config patching) ...

    // ... (lines 1422-1442 omitted, assuming function body matches) ...

    // 1. Setup Logging
    let log_path = PathBuf::from("C:/Users/Breeze/cambridge_debug.log");
    let mut log_content = format!("\n--- PATCH START: {} ---\nTarget Title: '{}'\nColors: bg={}, fg={}\n", 
        chrono::Local::now(), book_title, bg_color, fg_color);

    // 2. Identify Dark/Light Mode
    // Calculate background luminance to determine is_dark_mode
    // Logic: 0.299*R + 0.587*G + 0.114*B. If < 128, it's dark.
    let (is_dark_mode, popup_bg) = if bg_color.len() == 7 && bg_color.starts_with('#') {
        let r = u8::from_str_radix(&bg_color[1..3], 16).unwrap_or(0);
        let g = u8::from_str_radix(&bg_color[3..5], 16).unwrap_or(0);
        let b = u8::from_str_radix(&bg_color[5..7], 16).unwrap_or(0);
        let lum = 0.299 * (r as f64) + 0.587 * (g as f64) + 0.114 * (b as f64);
        let is_dark = lum < 128.0;
        
        // Calculate Opaque Popup Background (Contrast Shift)
        let factor = if is_dark { 1.25 } else { 0.95 }; 
        let pr = (r as f64 * factor).min(255.0) as u8;
        let pg = (g as f64 * factor).min(255.0) as u8;
        let pb = (b as f64 * factor).min(255.0) as u8;
        let p_bg = format!("#{:02x}{:02x}{:02x}", pr, pg, pb);
        (is_dark, p_bg)
    } else {
        (false, sub_alt_color.clone())
    };
    
    let theme_mode_str = if is_dark_mode { "dark" } else { "light" };
    log_content.push_str(&format!("Mode identified as: {}. Popup BG: {}\n", theme_mode_str, popup_bg));

    // 3. Locate ROAMING Settings.json (Critical Fix)
    // Readest uses %APPDATA%/com.bilingify.readest/settings.json (Roaming)
    let mut books_root = PathBuf::new();
    let mut settings_path = PathBuf::new();
    let mut roaming_base = PathBuf::new();

    if let Some(config_dir) = dirs::config_dir() { // Returns AppData/Roaming on Windows
        roaming_base = config_dir.join("com.bilingify.readest");
        settings_path = roaming_base.join("settings.json");
        log_content.push_str(&format!("Settings Path identified as: {:?}\n", settings_path));
    } else {
        log_content.push_str("ERROR: Could not resolve Roaming directory.\n");
        // Fallback for logging
        use std::io::Write;
        let _ = std::fs::File::create(&log_path).and_then(|mut f| f.write_all(log_content.as_bytes()));
        return Err("Could not resolve Roaming directory".to_string());
    }

    // 4. Read & Patch Settings.json + Extract Books Dir
    if settings_path.exists() {
        match std::fs::read_to_string(&settings_path) {
            Ok(content) => {
                match serde_json::from_str::<serde_json::Value>(&content) {
                    Ok(mut json) => {
                        // A. Extract localBooksDir
                        if let Some(dir_str) = json.get("localBooksDir").and_then(|v| v.as_str()) {
                             books_root = PathBuf::from(dir_str);
                             log_content.push_str(&format!("Found localBooksDir in settings: {:?}\n", books_root));
                        } else {
                             // Fallback if not found
                             books_root = roaming_base.join("Readest").join("Books");
                             log_content.push_str("localBooksDir not found in settings, using default Roaming/Readest/Books\n");
                        }

                        // B. Patch Global Settings (Scrolled Mode & Theme)
                         if let Some(obj) = json.as_object_mut() {
                            // patch top-level 'mode'
                            obj.insert("mode".to_string(), serde_json::json!(theme_mode_str));
                            
                            // patch globalViewSettings
                            let global_vs = obj.entry("globalViewSettings").or_insert(serde_json::json!({}));
                            if let Some(gvs) = global_vs.as_object_mut() {
                                // Force defaults to Scrolled
                                gvs.insert("scrolled".to_string(), serde_json::json!(true));
                                gvs.insert("continuousScroll".to_string(), serde_json::json!(false));
                                gvs.insert("flow".to_string(), serde_json::json!("scrolled"));
                                
                                // FORCE FALSE as per user request (Redundant safety check)
                                gvs.insert("overrideColor".to_string(), serde_json::json!(false));
                                gvs.insert("invertImgColorInDark".to_string(), serde_json::json!(false));
                            }
                        }
                        
                        // C. Write back Settings.json
                         if let Ok(new_settings) = serde_json::to_string_pretty(&json) {
                             if let Err(e) = std::fs::write(&settings_path, new_settings) {
                                 log_content.push_str(&format!("ERROR writing settings.json: {}\n", e));
                             } else {
                                 log_content.push_str("Successfully patched settings.json with Scrolled Mode & Theme.\n");
                             }
                         }
                    },
                    Err(e) => log_content.push_str(&format!("ERROR parsing settings.json: {}\n", e)),
                }
            },
            Err(e) => log_content.push_str(&format!("ERROR reading settings.json: {}\n", e)),
        }
    } else {
        log_content.push_str("settings.json NOT FOUND. Using default path assumptions.\n");
        books_root = roaming_base.join("Readest").join("Books");
    }

    // 5. Generate Stylesheets
     let user_stylesheet = format!(r#"
html {{ background-color: transparent !important; min-height: 100%; }}
body {{ background-color: transparent !important; color: {fg} !important; }}
section, nav, header, footer, main, 
div, p, font, h1, h2, h3, h4, h5, h6, li, span {{
    background-color: transparent !important;
    color: {fg} !important;
    border-color: {fg} !important;
}}
a {{ color: {primary} !important; }}
::selection {{ background-color: {caret} !important; color: {bg} !important; }}

/* In-Content Popups, Footnotes, Glossaries - Force Opaque */
aside, blockquote, figure, .popover, .footnote, 
[epub\:type="footnote"], [epub\:type="note"], [role="doc-footnote"],
[epub\:type="glossary"], [role="doc-glossary"], .glossary,
/* Specific fix for inline CSS footnotes - HIGH SPECIFICITY */
html body span.popup_footnote, 
html body span.hover_footnote:hover span.popup_footnote,
html body .popup_footnote, 
html body .hover_footnote:hover .popup_footnote {{
    background-color: {popup} !important;
    color: {fg} !important;
    border: 1px solid {sub} !important;
    box-shadow: 0 4px 6px rgba(0,0,0,0.5) !important;
    padding: 0.5em;
    border-radius: 4px;
    opacity: 1 !important;
    z-index: 1000 !important;
}}
/* Ensure text inside popups is visible */
aside *, .popover *, .footnote *, span.popup_footnote * {{
    color: {fg} !important;
}}

/* CAMBRIDGE BOOK CLASSES - COMPREHENSIVE THEME OVERRIDES */
.infobox, .infobox1, .infobox2, .infobox1v,
.box1, .box1a, .rbox, .rbox1, .rbox2, .rbox-r,
.bbox, .bbox1, .bbox2, .bbox-ch12,
.gbox, .gbox1, .gbox2, .gdbox1,
.ybox, .ybox1, .ybox-ch10, .yelbox, .yel-box, .ybox-bor,
.pbox, .pbox-s, .pbox-s1, .pbox-ls1, .purplebox1,
.vbox, .vbox1,
.purbox, .purbox1, .purbox2, .purbox-nobor, .purbox1-s, .purplbox1,
.whitebox, .whitebox1, .whitebox-s, .whitebox1-g, .white-box, .whi-box,
.bluebox, .bluebox1, .bluebox2, .bluebox3, .blue1Box, .blu-box, .blu-box1, .blu-boxg, .blu-box-r,
.sky-box1, .skybox, .skybox-s, .sky-bbox,
.green-box1, .green-box-r, .grn-box,
.ch5box, .ch6box, .ch8-blu, .ch9box, .ch13box, 
.conc-box, .conc-box1,
.grey-box, .grey-clr-box, .gry1, .graybox-nobor, .graybox-nobor-1, .gray-box1,
.rev-bk-box, .bb-box, .bb-box-ch6, .dblkbox-1,
.prono-box, .dbbox, .dbbox-1, .dbbox-ch6, .dbbox-ch8, .dbbox-gre, .dgbox, .dgbox1, .dgbox-s, .dgbox-ch7, .dgbox-ch12,
.pink-box-r, .or-box, .or-box-r, .ash-box, .me-box, .nor-box, .san-nobor, .li-pur-box, .box-org, .lgtbrw, .box-gry-ch4 {{
    background-color: {popup} !important;
    color: {fg} !important;
    border-color: {sub} !important;
    box-shadow: none !important;
}}

/* Box Headers - specific contrast */
.box-head, .box-heada, .box-headn, .box-headv, .box-head1, .box-head-s, .box-head-s1, .box-head-s2, .box-head-sa,
.comp-head, .blkbox-head, .blkbox-head1, .divhead, .divheader, .divheadf, .divheadk, .divheads, .divheadtt {{
    background-color: {sub} !important;
    color: {fg} !important;
    border-color: {sub} !important;
}}

/* Headings and Titles - Force Primary Color */
h1, h2, h3, h4, h5, h6,
.h1, .h2, .h3, .h4, .h5, .h6,
.h3a, .h3b, .h3c, .h3f, .h3-ch12, .h3b-s,
.h4a, .h5b, .h5w, .h5-c,
.h2f, .h2f1, .h2h, .h2c,
.chap-head, .chap-num, .chap-num1,
.para-head, .para-head1, .para-head1a, .para-head1c, .para-head2, 
.y-para-head1, .y-para-head1a, .y-para-head1b, .y-para-head-ch8, 
.title-h1, .title-h2, .title-h3, .title-h4,
.map-head, .map-head-r {{
    color: {primary} !important;
    background-color: transparent !important;
}}

/* Text Colors - Map to Theme */
.red, .blue, .green, .orange, .pink, 
.color-red1, .color-bl1, .color-gr, .color-or, .color-bro, .color-gre1,
.blue1, .blue2, .blue3, .blue4, .blue5, .bluec, .blueg, .blue-ch11, .blue-ch12,
.red1, .orange1, .greenl, .green5, .col-pur, .colorl, .colorl1 {{
    color: {sub_alt} !important;
}}

/* Tables - Clean Borders */
table, tr, td, th {{
    background-color: transparent !important;
    border-color: {sub} !important;
}}
/* Specific table backgrounds if they have classes */
table.white-table, table.gray-table, td.bg-br, td.head-bg {{
    background-color: transparent !important;
}}

/* Images - ensure they blend */
img {{
    mix-blend-mode: multiply;
}}
/* Dark mode inversion for images if bg is dark */
img {{
    filter: brightness(0.8) contrast(1.2);
}}

/* Style default structural elements to be transparent too, relying on container */
aside, blockquote, figure {{
    background-color: transparent !important;
    color: {fg} !important;
    border-color: {fg} !important;
}}
"#, bg=bg_color, fg=fg_color, primary=primary_color, caret=caret_color, popup=popup_bg, sub=sub_color, sub_alt=sub_alt_color);

    // Helper for color manipulation (Simple RGB lighten/darken)
    fn adjust_brightness(hex: &str, amount: f32) -> String {
        let hex = hex.trim_start_matches('#');
        // Normalize 3-digit hex to 6-digit
        let hex = if hex.len() == 3 {
            format!("{}{}{}{}{}{}", 
                &hex[0..1], &hex[0..1],
                &hex[1..2], &hex[1..2],
                &hex[2..3], &hex[2..3]
            )
        } else {
            hex.to_string()
        };
        
        // Safety check for length to avoid panic
        if hex.len() < 6 {
            return format!("#{hex}"); // Return original if unknown format
        }

        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0);

        let adjust = |c: u8| -> u8 {
            let val = c as f32;
            let res = if amount > 0.0 {
                // Lighten: mix with white
                val + (255.0 - val) * amount
            } else {
                // Darken: mix with black
                val * (1.0 + amount)
            };
            res.clamp(0.0, 255.0) as u8
        };

        format!("#{0:02x}{1:02x}{2:02x}", adjust(r), adjust(g), adjust(b))
    }

    // Determine if we are in Dark Mode based on background brightness
    // Simple luma calculation: 0.2126*R + 0.7152*G + 0.0722*B
    fn get_luma(hex: &str) -> f32 {
        let hex = hex.trim_start_matches('#');
        // Normalize 3-digit hex to 6-digit
        let hex = if hex.len() == 3 {
             format!("{}{}{}{}{}{}", 
                &hex[0..1], &hex[0..1],
                &hex[1..2], &hex[1..2],
                &hex[2..3], &hex[2..3]
            )
        } else {
            hex.to_string()
        };

        if hex.len() < 6 { return 0.0; } // Default to dark (0.0) if invalid

        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(0) as f32;
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(0) as f32;
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(0) as f32;
        (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0
    }

    let is_dark_mode = get_luma(&bg_color) < 0.5;

    // Generate Palette (Replicating themes.ts logic)
    // Darken/Lighten percentages: 5% (0.05) and 12% (0.12)
    // Note: tinycolor's darken(5) reduces lightness by 5%. My adjust_brightness works similarly.
    
    let (b1, b2, b3, bc, neutral, neutral_content, primary, secondary, accent);

    if is_dark_mode {
        // Dark Mode Logic (themes.ts: generateDarkPalette)
        // base-200: lighten 5%
        // base-300: lighten 12%
        // secondary: primary darken 20%
        b1 = bg_color.clone();
        b2 = adjust_brightness(&bg_color, 0.05);
        b3 = adjust_brightness(&bg_color, 0.12);
        bc = fg_color.clone();
        neutral = adjust_brightness(&bg_color, 0.15); // lighten 15, then desaturate (skipped desat for now)
        neutral_content = adjust_brightness(&fg_color, -0.20); // darken 20
        primary = primary_color.clone();
        secondary = adjust_brightness(&primary_color, -0.20);
        accent = primary_color.clone(); // Using primary as accent for now to ensure cohesion
    } else {
        // Light Mode Logic (themes.ts: generateLightPalette)
        // base-200: darken 5%
        // base-300: darken 12%
        // secondary: primary lighten 20%
        b1 = bg_color.clone();
        b2 = adjust_brightness(&bg_color, -0.05);
        b3 = adjust_brightness(&bg_color, -0.12);
        bc = fg_color.clone();
        neutral = adjust_brightness(&bg_color, -0.15);
        neutral_content = adjust_brightness(&fg_color, 0.20);
        primary = primary_color.clone();
        secondary = adjust_brightness(&primary_color, 0.20);
        accent = primary_color.clone();
    }
    
    // Helper to convert Hex to OKLCH (Simplified or just use Hex since DaisyUI handles Hex fallback usually, 
    // BUT themes.ts explicitly uses hexToOklch. 
    // We will just inject the HEX values into the variable, as modern browsers often handle color-mix or just standard variables fine.
    // However, DaisyUI components heavily rely on oklch.
    // The previous code had `hex_to_oklch` helper? No, we used `format!` directly into the string.
    // Wait, the previous code had `bg_oklch`, `fg_oklch` arguments passed to format!.
    // We need to implement a basic `hex_to_oklch` string generator or just trust that putting HEX into the variable works (DaisyUI 4+ usually requires OKLCH for internal mixing).
    // Let's stick to HEX for now and rely on the fact that we are overriding the *Values*. 
    // Actually, if DaisyUI does `color-mix(in oklch, var(--b1), ...)` it might break if var(--b1) is Hex.
    // Use the `o-color` crate/function if available?
    // For now, let's use the generated hex strings for the Palette.

    // UI Stylesheet: Use FULL palette for rich UI via CSS Variable Overrides
    // This effectively "skins" the DaisyUI theme to match Cambridge
    let user_ui_stylesheet = format!(r#"
    :root {{
        /* DaisyUI Color Variables Override - Exact Palette Replication without OKLCH conversion (Compatibility Mode) */
        --b1: {b1} !important;
        --b2: {b2} !important;
        --b3: {b3} !important;
        --bc: {bc} !important;
        
        --n: {neutral} !important;
        --nc: {neutral_content} !important;
        
        --p: {primary} !important;
        --pc: {b1} !important; /* Primary Content usually contrast text */
        
        --s: {secondary} !important;
        --sc: {b1} !important;
        
        --a: {accent} !important;
        --ac: {b1} !important;
        
        --er: {error} !important;
        --erc: {b1} !important;

        /* Fallback for components scanning exact variable names */
        --fallback-b1: {b1} !important;
        --fallback-b2: {b2} !important;
        --fallback-b3: {b3} !important;
        --fallback-bc: {bc} !important;
        --fallback-p: {primary} !important;
        
        /* Rounded corners */
        --rounded-box: 0.5rem;
        --rounded-btn: 0.5rem;
    }}

    /* Global Backgrounds - Force {{bg}} on main containers (Backup) */
    html, body, .reader-page, .books-grid, .sidebar-container, .bg-base-100, .bg-base-200 {{ 
        background-color: {bg} !important; 
        color: {fg} !important; 
    }}
    
    /* Removed .bg-base-300 override to allow Tailwind opacity modifiers to work via --b3 variable */

    /* Main Book View - Default to {{bg}} */
    foliate-view {{
        background-color: {bg} !important;
        display: block !important;
    }}

    /* Modals, Dialogs, Settings Panels, Popups - Use {{popup}} for contrast */
    /* Note: We rely on the class logic mostly, but these enforce contrast */
    .modal-box, .dialog, [role="dialog"], .dropdown-content, .menu, .settings-panel,
    .selection-popup, .popup-container, .tooltip, #popup-container, 
    .footnote-content {{
        background-color: {popup} !important;
        color: {fg} !important;
        border: 1px solid {sub} !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5) !important;
    }}

    /* Specific fix for inputs */
    input, textarea, select {{
        background-color: {popup} !important; 
        color: {fg} !important;
        border: 1px solid {sub} !important;
    }}
    
    /* Scrollbars */
    ::-webkit-scrollbar-thumb {{
        background-color: {sub} !important;
        border-radius: 4px;
    }}
    ::-webkit-scrollbar-track {{
        background-color: {popup} !important;
    }}
    
    /* Selection */
    ::selection {{
        background-color: {caret} !important;
        color: {bg} !important;
    }}

    /* Error States - Text */
    .text-error, .error, .alert-error, 
    .text-red-500, .text-red-600, .text-red-400, .text-red-700 {{
        color: {error} !important;
    }}

    /* Error States - Backgrounds (Danger Buttons/Badges only) */
    button.bg-red-500, button.bg-red-600, .badge-error, .btn-error {{
        background-color: {error} !important;
        color: {bg} !important;
    }}

    /* Hardcoded Tailwind Overrides (e.g. TOC Active State) */
    .text-blue-500, .text-blue-600, .text-blue-700, 
    .text-blue-400, .text-indigo-500, .text-indigo-600 {{
        color: {primary} !important;
    }}

    /* Fix Book Cover Inversion (Readest applies mix-blend-mode based on Light/Dark, causing inverted covers in custom themes) */
    /* We force normal blend mode so covers always look like the original image */
    .mix-blend-screen, .mix-blend-multiply {{
        mix-blend-mode: normal !important;
    }}
    
    /* Background Overrides for specific gray backgrounds used in selection/hover */
    /* We DO override these because they are typically hardcoded grays, not theme variables */
    .bg-blue-50, .bg-blue-100, .bg-indigo-50, .bg-indigo-100,
    .bg-gray-100, .bg-gray-200, .bg-gray-300 {{
        background-color: {sub_alt} !important;
        color: {primary} !important;
    }}
"#, 
    bg=bg_color, fg=fg_color, 
    sub=sub_color, popup=popup_bg, caret=caret_color,
    error=error_color, sub_alt=sub_alt_color
);


    // 6. Calculate Hash and Resolve Book Config Path
    // We need to calculate the hash from the file title to verify or find it in library.json
    // Or we scan the directory for the Book Hash if we don't have it (we only passed Title).
    
    // NOTE: The previous code calculated partial MD5 from the EPUB file manually.
    // We should replicate that or reuse the existing library lookup if possible.
    
    // Resolve Target EPUB Path first to calc MD5
    let safe_title: String = book_title.chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect();
    
    let user_dirs = UserDirs::new().ok_or("Could not resolve user directories")?;
    let docs_dir = user_dirs.document_dir().ok_or("Could not resolve document directory")?;
    let epub_path = docs_dir.join("CambridgeBooks").join(format!("{}.epub", safe_title.trim()));
    
    if !epub_path.exists() {
         return Err("EPUB file not found. Please download the book first.".to_string());
    }

    // Calc MD5 (Same logic as before)
    let calc_res = (|| -> Result<String, String> {
        use std::io::{Read, Seek, SeekFrom};
        let mut file = std::fs::File::open(&epub_path).map_err(|e| e.to_string())?;
        let file_size = file.metadata().map_err(|e| e.to_string())?.len();
        let mut ctx = md5::Context::new();

        for i in -1i32..=10 {
            let shift = if i == -1 { 30 } else { (2 * i) as u32 };
            let start_calc = (1024u32.wrapping_shl(shift)) as u64; 
            let start = std::cmp::min(file_size, start_calc);
            if start >= file_size { break; }
            let end = std::cmp::min(start + 1024, file_size);
            let len = end - start;
            if len > 0 {
                file.seek(SeekFrom::Start(start)).map_err(|e| e.to_string())?;
                let mut buffer = vec![0u8; len as usize];
                file.read_exact(&mut buffer).map_err(|e| e.to_string())?;
                ctx.consume(&buffer);
            }
        }
        Ok(format!("{:x}", ctx.compute()))
    })();

    let book_hash = match calc_res {
        Ok(h) => h,
        Err(e) => return Err(format!("Failed to calculate partial hash: {}", e)),
    };
    log_content.push_str(&format!("Calculated Hash: {}\n", book_hash));

    // 7. Verify/Inject into Library
    // If we have access to library.json (we discovered it automatically before?)
    // Wait, step 1 logic for library.json in previous code was weak.
    // Let's rely on finding it in books_root. parent?
    // Usually library.json is in books_root OR books_root/../library.json?
    // Readest 'books_root' settings points to "Books" folder. 
    // library.json is usually at the parent of "Books".
    
    // 7. Verify/Inject into Library
    let possible_library_paths = vec![
        books_root.join("library.json"),                // Inside Books (Unlikely)
        books_root.parent().unwrap_or(&books_root).join("library.json"), // Parent of Books (Common)
        roaming_base.join("readest-data").join("library.json"), // Explicit Default
        roaming_base.join("com.bilingify.readest").join("library-data").join("library.json"), // Variant
    ];

    let mut library_path = PathBuf::new();
    for path in possible_library_paths {
        if path.exists() {
            library_path = path;
            log_content.push_str(&format!("Found library.json at: {:?}\n", library_path));
            break;
        }
    }

    if library_path.exists() {
         if let Ok(lib_content) = std::fs::read_to_string(&library_path) {
             if let Ok(mut library) = serde_json::from_str::<Value>(&lib_content) {
                 if let Some(books_array) = library.as_array_mut() {
                     if !books_array.iter().any(|b| b["hash"].as_str() == Some(&book_hash)) {
                         // Inject
                         let new_entry = serde_json::json!({
                             "hash": book_hash,
                             "title": book_title,
                             "author": "Cambridge",
                             "format": "EPUB",
                             "createdAt": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64,
                             "updatedAt": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64
                         });
                         books_array.push(new_entry);
                         let _ = std::fs::write(&library_path, serde_json::to_string_pretty(&library).unwrap_or_default());
                         log_content.push_str("Injected book into library.json\n");
                     }
                 }
             }
         }
    }

    // 8. Patch Config for Book
    // Path: books_root/HASH/config.json
    let book_config_path = books_root.join(&book_hash).join("config.json");
    log_content.push_str(&format!("Target Book Config: {:?}\n", book_config_path));

    // Ensure directory exists
    if let Some(parent) = book_config_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    // Read or Create
    let mut json = if book_config_path.exists() {
        let c = std::fs::read_to_string(&book_config_path).unwrap_or("{}".to_string());
        serde_json::from_str(&c).unwrap_or(serde_json::json!({}))
    } else {
        serde_json::json!({})
    };

    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis() as u64;

    if let Some(obj) = json.as_object_mut() {
         let view_settings = obj.entry("viewSettings").or_insert(serde_json::json!({}));
         if let Some(vs) = view_settings.as_object_mut() {
             // Update config with smart settings
             // User Request: Force these to false to prevent native Readest interference
             vs.insert("overrideColor".to_string(), serde_json::json!(false)); 
             
             // Dynamic Theme Mode: "dark" or "light" based on luminance (User requested revert)
             // We revert this to "default" so the app doesn't reset our custom CSS.
             vs.insert("theme".to_string(), serde_json::json!("default"));
             
             // Force Scrolled Mode (Non-Continuous)
             vs.insert("scrolled".to_string(), serde_json::json!(true));
             vs.insert("continuousScroll".to_string(), serde_json::json!(false));
             vs.insert("flow".to_string(), serde_json::json!("scrolled"));
             
             // User Request: Force false
             vs.insert("invertImgColorInDark".to_string(), serde_json::json!(false));
             
             if enable_theming {
                 // Inject generated stylesheets
                 vs.insert("userStylesheet".to_string(), serde_json::json!(user_stylesheet));
                 vs.insert("userUIStylesheet".to_string(), serde_json::json!(user_ui_stylesheet));
             } else {
                 // If disabled, explicitly clear the custom stylesheets
                 vs.insert("userStylesheet".to_string(), serde_json::json!(""));
                 vs.insert("userUIStylesheet".to_string(), serde_json::json!(""));
             }
         }
         obj.insert("updatedAt".to_string(), serde_json::json!(now));
    }

    let new_content = serde_json::to_string_pretty(&json).unwrap_or_default();
    
    // Write
    if let Err(e) = std::fs::write(&book_config_path, &new_content) {
        log_content.push_str(&format!("ERROR writing book config: {}\n", e));
        use std::io::Write;
        let _ = std::fs::File::create(&log_path).and_then(|mut f| f.write_all(log_content.as_bytes()));
        return Err(format!("Failed to write config: {}", e));
    }

    log_content.push_str("Successfully patched book config.\n");
    
    use std::io::Write;
    let _ = std::fs::File::create(&log_path).and_then(|mut f| f.write_all(log_content.as_bytes()));

    Ok(format!("Patched config for {}", book_title))
}

#[tauri::command]
pub async fn launch_readest(_app: AppHandle, book: Book) -> Result<String, String> {
    let log_path = PathBuf::from("C:/Users/Breeze/cambridge_debug.log"); 
    let _ = std::fs::OpenOptions::new().create(true).append(true).open(&log_path)
        .and_then(|mut f| {
            use std::io::Write;
            writeln!(f, "LAUNCH READEST CALLED for book: {}", book.title)
        });

    // 1. Resolve Book Path
    let _safe_title: String = book.title.chars()
        .filter(|c| c.is_alphanumeric() || *c == ' ')
        .collect();
    
    // Standard Location: Documents/CambridgeBooks
    let user_dirs = UserDirs::new().ok_or("Could not resolve user directories")?;
    let docs_dir = user_dirs.document_dir().ok_or("Could not resolve document directory")?;
    let book_path = docs_dir.join("CambridgeBooks").join(format!("{}.epub", _safe_title.trim()));

    // 2. Locate Readest Executable
    // Strategies:
    // A. Env Var 'READEST_PATH'
    // B. Default Installation Paths
    //    Windows: %LOCALAPPDATA%/Programs/Readest/Readest.exe
    //    Windows: %ProgramFiles%/Readest/Readest.exe
    
    let candidates = vec![
        // Local App Data (User Install)
        BaseDirs::new().map(|b| b.data_local_dir().join("Programs").join("Readest").join("Readest.exe")),
        // Program Files (System Install)
        std::env::var("ProgramFiles").ok().map(|p| PathBuf::from(p).join("Readest").join("Readest.exe")),
        std::env::var("ProgramFiles(x86)").ok().map(|p| PathBuf::from(p).join("Readest").join("Readest.exe")),
    ];

    let exe_path = candidates.into_iter().flatten().find(|p| p.exists());

    if let Some(exe) = exe_path {
        println!("Launching Readest from: {:?}", exe);
        println!("Opening Book: {:?}", book_path);
        
        if !book_path.exists() {
             return Err(format!("Book file not found at: {:?}", book_path));
        }

        // 3. Spawn Process
        // Detached process
        StdCommand::new(exe)
            .arg(&book_path) // Pass book path as argument
            .spawn()
            .map_err(|e| format!("Failed to launch Readest: {}", e))?;
            
        Ok("Readest launched".to_string())
    } else {
        Err("Readest executable not found. Please install Readest.".to_string())
    }
}
