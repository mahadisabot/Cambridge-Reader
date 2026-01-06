use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SessionData {
    pub email: String,
    pub user_id: String,
    pub access_token: String,
    pub go_access_token: Option<String>,
    pub password: Option<String>,
}

pub fn get_session_path(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_data_dir().ok().map(|p| p.join("session.json"))
}

pub fn save_session(app: &AppHandle, session: &SessionData) -> Result<(), String> {
    let path = get_session_path(app).ok_or("Failed to resolve app data dir")?;
    
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let json = serde_json::to_string_pretty(session).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn load_session(app: &AppHandle) -> Result<SessionData, String> {
    let path = get_session_path(app).ok_or("Failed to resolve app data dir")?;
    
    if !path.exists() {
        return Err("No session found".to_string());
    }

    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let session: SessionData = serde_json::from_str(&json).map_err(|e| e.to_string())?;
    Ok(session)
}

pub fn clear_session(app: &AppHandle) -> Result<(), String> {
    let path = get_session_path(app).ok_or("Failed to resolve app data dir")?;
    if path.exists() {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
