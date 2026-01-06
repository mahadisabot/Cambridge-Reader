use serde::Deserialize;
use reqwest::Client;

#[derive(Debug, Deserialize)]
pub struct MailTmAccount {
    pub address: String,
    pub password: String,
    pub token: String,
}

#[derive(Debug, Deserialize)]
pub struct MailTmMessage {
    pub id: String,
    pub subject: String,
    pub intro: String,
    #[serde(default)]
    pub text: String,
    #[serde(default)]
    pub html: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Domain {
    pub domain: String,
}

pub struct MailTmClient {
    client: Client,
    base_url: String,
}

impl MailTmClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: "https://api.mail.gw".to_string(),
        }
    }

    pub async fn get_domains(&self) -> anyhow::Result<Vec<Domain>> {
        let resp = self.client.get(format!("{}/domains", self.base_url))
            .send().await?;
            
        if !resp.status().is_success() {
             let status = resp.status();
             let text = resp.text().await.unwrap_or_default();
             anyhow::bail!("MailTm Domains Failed: {} - {}", status, text);
        }

        let text = resp.text().await?;
        let res: serde_json::Value = serde_json::from_str(&text)
            .map_err(|e| anyhow::anyhow!("Failed to parse domains JSON: {}. Body: {}", e, text))?;
            
        // Manual extraction to avoid struct mapping issues
        let mut domains = Vec::new();
        if let Some(arr) = res["hydra:member"].as_array() {
            for item in arr {
                if let Some(d) = item["domain"].as_str() {
                    domains.push(Domain { domain: d.to_string() });
                }
            }
        }
        Ok(domains)
    }

    pub async fn create_account(&self, address: &str, password: &str) -> anyhow::Result<MailTmAccount> {        
        // 1. Create Account
        let resp = self.client.post(format!("{}/accounts", self.base_url))
            .json(&serde_json::json!({
                "address": address,
                "password": password
            }))
            .send().await?;
            
        // 201 Created is expected
        if !resp.status().is_success() {
             let status = resp.status();
             let text = resp.text().await.unwrap_or_default();
              // 422 Unprocessable Entity often means "Account exists" or invalid format
             anyhow::bail!("MailTm Create Account Failed: {} - {}", status, text);
        }
            
        // 2. Get Token
        let token_resp = self.client.post(format!("{}/token", self.base_url))
            .json(&serde_json::json!({
                "address": address,
                "password": password
            }))
            .send().await?;

        if !token_resp.status().is_success() {
             let status = token_resp.status();
             let text = token_resp.text().await.unwrap_or_default();
             anyhow::bail!("MailTm Token Failed: {} - {}", status, text);
        }

        let text = token_resp.text().await?;
        let token_res: serde_json::Value = serde_json::from_str(&text)
             .map_err(|e| anyhow::anyhow!("Failed to parse token JSON: {}. Body: {}", e, text))?;
            
        let token = token_res["token"].as_str()
            .ok_or_else(|| anyhow::anyhow!("Failed to get token in: {}", text))?
            .to_string();
            
        Ok(MailTmAccount { address: address.to_string(), password: password.to_string(), token })
    }

    pub async fn get_messages(&self, token: &str) -> anyhow::Result<Vec<MailTmMessage>> {
        let res: serde_json::Value = self.client.get(format!("{}/messages", self.base_url))
            .header("Authorization", format!("Bearer {}", token))
            .send().await?.json().await?;
            
        let mut messages = Vec::new();
        if let Some(list) = res["hydra:member"].as_array() {
            for item in list {
                let id = item["id"].as_str().unwrap_or_default().to_string();
                
                // Fetch FULL message details
                let detail_res: serde_json::Value = self.client.get(format!("{}/messages/{}", self.base_url, id))
                    .header("Authorization", format!("Bearer {}", token))
                    .send().await?.json().await?;

                messages.push(MailTmMessage {
                    id: id,
                    subject: detail_res["subject"].as_str().unwrap_or_default().to_string(),
                    intro: detail_res["intro"].as_str().unwrap_or_default().to_string(),
                    text: detail_res["text"].as_str().unwrap_or_default().to_string(),
                    // Extract HTML content (handle both string and array of strings)
                    html: match detail_res["html"].as_array() {
                        Some(arr) => arr.iter().map(|v| v.as_str().unwrap_or_default().to_string()).collect(),
                        None => vec![detail_res["html"].as_str().unwrap_or_default().to_string()]
                    }, 
                });
            }
        }
        Ok(messages)
    }
}
