use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT};
use anyhow::{Result, Context};
use serde_json::json;
use crate::models::{LoginRequest, LoginResponse, Book};

const BASE_URL: &str = "https://elevate.cambridge.org/Openpageservices/BookService.svc";



#[derive(Clone)]
pub struct CambridgeClient {
    client: Client,
    pub user_id: Option<String>,
    pub access_token: Option<String>,
    pub go_access_token: Option<String>,
}

impl CambridgeClient {
    pub fn new() -> Result<Self> {
        // Enable Cookie Store for session management
        // Force HTTP/1.1 as WCF/IIS often dislikes HTTP/2
        let client = Client::builder()
            .cookie_store(true)
            .http1_only()
            .no_proxy() // Prevent WPAD / System Proxy lookup delays (often 10s+ on Windows)
            .timeout(std::time::Duration::from_secs(30))
            // NO DEFAULT HEADERS - applied per request type
            .build()
            .context("Failed to build HTTP client")?;
            
        Ok(Self {
            client,
            user_id: None,
            access_token: None,
            go_access_token: None,
        })
    }

    fn add_elevate_headers(builder: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        builder
            .header(USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.115 Safari/537.36")
            .header("Accept", "application/json, text/plain, */*")
            .header("Origin", "https://elevate.cambridge.org")
            .header("Referer", "https://elevate.cambridge.org/")
    }

    pub async fn login(&mut self, username: &str, password: &str) -> Result<()> {
        let url = format!("{}/user/login/", BASE_URL);
        
        // Use Struct again (Trailing slash was likely the fix)
        let payload = LoginRequest {
            user_name: username.to_string(),
            password: password.to_string(),
            device_id: "web".to_string(),
            authentication_mode: "1".to_string(),
        };

        let body = serde_json::to_string(&payload)
            .context("Failed to serialize login payload")?;
        
        let req = self.client.post(&url)
            .header("Content-Type", "application/json")
            .body(body);
            
        let resp = Self::add_elevate_headers(req)
            .timeout(std::time::Duration::from_secs(5)) // Fail fast on login to prevent 12s hangs
            .send()
            .await
            .context("Failed to send login request")?;

        let status = resp.status();
        if !status.is_success() {
             let text = resp.text().await.unwrap_or_default();
             anyhow::bail!("Login failed with status {} {}: {}", status, status.canonical_reason().unwrap_or(""), text);
        }

        let text = resp.text().await.context("Failed to read response text")?;
        println!("DEBUG: Login Response: {}", text); 

        // Handle BOM if present (common in Cambridge APIs)
        let text = text.trim_start_matches('\u{feff}');

        let response: LoginResponse = serde_json::from_str(text)
            .context("Failed to parse login response")?;
            
        self.user_id = Some(response.user_id.to_string());
        self.access_token = Some(response.access_token);
        
        println!("Login successful! UserID: {:?}", self.user_id);
        Ok(())
    }

    pub async fn login_go(&mut self, email: &str, password: &str) -> Result<()> {
        let api_key = "3_YZ2Ps8zW-VCK3H5YrTUOsnjUBbwPk6U20kdzNbdyujkuhavooF4bJ9lMF_WNAi0C";
        
        // 1. Gigya Login
        let login_params = [
            ("apiKey", api_key),
            ("loginID", email),
            ("password", password),
            ("targetEnv", "mobile"), 
            ("include", "sessionInfo,id_token"),
            ("format", "json")
        ];

        // Create a new client for Gigya to avoid Elevate cookies/headers interference
        let g_client = reqwest::Client::new();

        let login_res = g_client.post("https://accounts.eu1.gigya.com/accounts.login")
            .form(&login_params)
            .timeout(std::time::Duration::from_secs(5)) // Fail fast
            .send()
            .await?;

        let json: serde_json::Value = login_res.json().await?;
        
        if json["errorCode"].as_i64().unwrap_or(-1) != 0 {
            anyhow::bail!("Gigya Login Failed: {}", json);
        }
        
        let uid = json["UID"].as_str().unwrap_or("Unknown");
        
        // Get ID Token
        let id_token = if let Some(t) = json["id_token"].as_str() {
            t.to_string()
        } else {
             // Fallback logic
             let session_token = json["sessionInfo"]["sessionToken"].as_str()
                .ok_or(anyhow::anyhow!("No sessionToken found"))?;
                
             let jwt_params = [
                ("apiKey", api_key),
                ("fields", "base_domains,data,email,firstName,lastName,languages,phones,photoURL,profile,username"),
                ("expiration", "300"), 
                ("format", "json"),
                ("oauth_token", session_token)
            ];
            
            let jwt_res = g_client.post("https://accounts.eu1.gigya.com/accounts.getJWT")
                .form(&jwt_params)
                .send()
                .await?;
                
            let jwt_json: serde_json::Value = jwt_res.json().await?;
            jwt_json["id_token"].as_str()
                .ok_or_else(|| anyhow::anyhow!("Failed to get id_token: {:?}", jwt_json))?
                .to_string()
        };

        // 2. Exchange for Cambridge Bearer Token
        let exchange_payload = serde_json::json!({
            "user_id": uid,
            "token": id_token
        });
        
        let exchange_res = g_client.post("https://go-api.cambridge.org/v1/token/")
            .json(&exchange_payload)
            .send()
            .await?;
            
        let json: serde_json::Value = exchange_res.json().await?;
        let bearer_token = json["token"].as_str().ok_or(anyhow::anyhow!("Failed to get bearer token"))?;
        
        self.go_access_token = Some(bearer_token.to_string());
        println!("Go-API Bearer Token acquired.");
        Ok(())
    }

    pub async fn get_books(&self) -> Result<Vec<Book>> {
        let user_id = self.user_id.as_ref().ok_or_else(|| anyhow::anyhow!("Not logged in"))?;
        let access_token = self.access_token.as_ref().ok_or_else(|| anyhow::anyhow!("Not logged in"))?;
        
        let url = format!("{}/user/{}/bookshelf/", BASE_URL, user_id);
        println!("DEBUG: Entering get_books. URL: {}", url);
        
        let payload = json!({ "books": [] });
        
        let req = self.client.post(&url)
            .header("accessToken", access_token)
            .header("userId", user_id)
            .json(&payload);

        let resp = Self::add_elevate_headers(req)
            .timeout(std::time::Duration::from_secs(5)) // Fast timeout for bookshelf too
            .send()
            .await
            .context("Failed to send bookshelf request")?;
        
        println!("DEBUG: Get Books Response Status: {}", resp.status());
            
        if !resp.status().is_success() {
             let status = resp.status();
             let text = resp.text().await.unwrap_or_default();
             anyhow::bail!("Bookshelf fetch failed: {} - {}", status, text);
        }

        let text = resp.text().await.context("Failed to get bookshelf text")?;
        
        let text = text.trim_start_matches('\u{feff}');
        
        let wrapper: serde_json::Value = serde_json::from_str(text)
            .context("Failed to parse bookshelf JSON structure")?;
            
        let books: Vec<Book> = serde_json::from_value(wrapper["books"].clone())
            .context("Failed to deserialize books list")?;
            
        Ok(books)
    }

    pub async fn get_bytes(&self, url: &str) -> Result<bytes::Bytes> {
        let req = self.client.get(url);
        let resp = Self::add_elevate_headers(req)
            .send()
            .await
            .context(format!("Failed to fetch: {}", url))?;

        if !resp.status().is_success() {
            anyhow::bail!("Request failed: {} for {}", resp.status(), url);
        }

        let bytes = resp.bytes().await
             .context("Failed to read bytes")?;
        Ok(bytes)
    }

    pub async fn get_response(&self, url: &str) -> Result<reqwest::Response> {
        let req = self.client.get(url);
        let resp = Self::add_elevate_headers(req)
            .send()
            .await
            .context(format!("Failed to fetch: {}", url))?;
            
        if !resp.status().is_success() {
            anyhow::bail!("Request failed: {} for {}", resp.status(), url);
        }
        Ok(resp)
    }
    pub async fn get_head_size(&self, url: &str) -> Result<Option<u64>> {
        let req = self.client.head(url);
        let resp = Self::add_elevate_headers(req)
            .send()
            .await
            .context(format!("Failed to head: {}", url))?;
            
        if !resp.status().is_success() {
             return Ok(None);
        }
        
        Ok(resp.content_length())
    }

    pub async fn search_trials(&self, query: &str, page: u32) -> Result<Vec<serde_json::Value>> {
        let access_token = self.go_access_token.as_ref().ok_or_else(|| anyhow::anyhow!("Not logged in to Go API"))?;
        
        let encoded_q: String = url::form_urlencoded::byte_serialize(query.as_bytes()).collect();
        let url = format!("https://go-api.cambridge.org/v1/trials/search?query={}&is_trial=1&page={}", encoded_q, page);
        
        // No Elevate Headers! Just Authorization.
        let resp = self.client.get(&url)
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Accept", "application/json")
            .send()
            .await
            .context("Failed to search trials")?;
            
        let json: serde_json::Value = resp.json().await?;
        
        let empty_vec = Vec::new();
        let items = json["results"].as_array()
            .or(json["data"].as_array())
            .or(json.as_array())
            .unwrap_or(&empty_vec)
            .clone();
            
        // DEBUG LOGGING
        let log_path = "C:/Users/Breeze/.gemini/antigravity/brain/2884cc03-467c-4776-84fa-5822ea174fb9/pagination_debug.log";
        if let Ok(mut file) = std::fs::OpenOptions::new().create(true).append(true).open(log_path) {
            use std::io::Write;
            let _ = writeln!(file, "Timestamp: {:?} | Query: '{}' | Page: {} | URL: {} | Results: {}", std::time::SystemTime::now(), query, page, url, items.len());
        }

        Ok(items)
    }

    pub async fn claim_trial(&self, trial_id: i64) -> Result<()> {
        let access_token = self.go_access_token.as_ref().ok_or_else(|| anyhow::anyhow!("Not logged in to Go API"))?;
        let url = "https://go-api.cambridge.org/v1/resources"; // Correct endpoint

        let payload = serde_json::json!({
            "trial_id": trial_id, 
            "on_behalf_of_school": false,
            "using_other_resources": false
        });

        println!("DEBUG: Claiming Trial ID: {}", trial_id);

        let resp = self.client.post(url)
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Accept", "application/json")
            .json(&payload)
            .send()
            .await
            .context("Failed to send claim request")?;
        
        println!("DEBUG: Claim Status: {}", resp.status());

        if resp.status().is_success() {
            Ok(())
        } else {
            let text = resp.text().await.unwrap_or_default();
            println!("DEBUG: Claim Error Body: {}", text);
            // 73270041 = Already claimed/active
            if text.contains("73270041") {
                Ok(()) 
            } else {
                anyhow::bail!("Claim failed: {}", text)
            }
        }
    }
}
