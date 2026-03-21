use clap::{Parser, Subcommand};
use cambridge_downloader_rs::api::CambridgeClient;
use cambridge_downloader_rs::downloader::DownloadManager;
use cambridge_downloader_rs::mail_tm::MailTmClient;
use std::sync::Arc;
use tokio::sync::Semaphore;
use futures::stream::StreamExt;
use rand::Rng;

#[derive(Parser)]
#[command(name = "Cambridge Reader Downloader")]
#[command(about = "CLI for downloading and fixing Cambridge EPUBs", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Auto-generates an account using MailTm
    Register,
    /// Search for trials (requires email/password)
    Search {
        #[arg(short, long)]
        email: String,
        #[arg(short, long)]
        password: String,
        #[arg(short, long, default_value = "*")]
        query: String,
    },
    /// Claims all possible books parallelized
    ClaimAll {
        #[arg(short, long)]
        email: String,
        #[arg(short, long)]
        password: String,
    },
    /// Downloads all claimed books parallelized
    DownloadAll {
        #[arg(short, long)]
        email: String,
        #[arg(short, long)]
        password: String,
        #[arg(short, long)]
        output_dir: String,
    },
}

fn random_string(len: usize) -> String {
    rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(len)
        .map(char::from)
        .collect()
}

async fn do_register() -> anyhow::Result<()> {
    println!("Initializing Auto-Registration...");
    let mail_client = MailTmClient::new();
    let domains = mail_client.get_domains().await?;
    if domains.is_empty() { anyhow::bail!("No mail domains available"); }
    
    let domain = &domains[0].domain;
    let full_domain = if domain.starts_with('@') { domain.to_string() } else { format!("@{}", domain) };
    let address = format!("{}{}", random_string(8).to_lowercase(), full_domain);
    let shared_password = format!("{}!A1", random_string(10));
    
    println!("1. Created Mail account: {}", address);
    let account = mail_client.create_account(&address, &shared_password).await?;
    
    let api_key = "3_YZ2Ps8zW-VCK3H5YrTUOsnjUBbwPk6U20kdzNbdyujkuhavooF4bJ9lMF_WNAi0C";
    let gigya_domain = "https://accounts.eu1.gigya.com";
    let client = reqwest::Client::builder().cookie_store(true).build()?;
    
    println!("2. Initializing Gigya...");
    let init_res = client.get(format!("{}/accounts.initRegistration", gigya_domain))
        .query(&[("apiKey", api_key)])
        .send().await?;
    let init_json: serde_json::Value = init_res.json().await?;
    let reg_token = init_json["regToken"].as_str().unwrap().to_string();
    
    println!("3. Registering...");
    let profile_json = serde_json::json!({ "firstName": "Bot", "lastName": random_string(4), "country": "GB" }).to_string();
    let preferences_json = serde_json::json!({ "terms": { "go": { "isConsentGranted": true } } }).to_string();
    let data_json = serde_json::json!({ "eduelt": { "instituteRole": [{"role": "teacher"}] } }).to_string();
    
    client.post(format!("{}/accounts.register", gigya_domain))
        .form(&[
            ("apiKey", api_key), ("regToken", &reg_token), ("email", &account.address), ("password", &shared_password),
            ("profile", &profile_json), ("preferences", &preferences_json), ("data", &data_json),
            ("regSource", "CambridgeGO"), ("finalizeRegistration", "true"), ("include", "profile,preferences,data")
        ]).send().await?;
    
    println!("4. Triggering Login Verification...");
    let login_res = client.post(format!("{}/accounts.login", gigya_domain))
        .form(&[
            ("apiKey", api_key), ("loginID", &account.address), ("password", &shared_password),
            ("include", "profile,data,preferences,sessionInfo,id_token"), ("loginMode", "standard")
        ]).send().await?;
        
    let login_text = login_res.text().await?;
    let current_reg_token = serde_json::from_str::<serde_json::Value>(&login_text).unwrap()["regToken"].as_str().unwrap_or(&reg_token).to_string();
    
    let mut v_token = String::new();
    if login_text.contains("206006") || login_text.contains("\"errorCode\": 0") {
        let send_res = client.post(format!("{}/accounts.otp.sendCode", gigya_domain))
            .form(&[("apiKey", api_key), ("email", &account.address), ("regToken", &current_reg_token), ("lang", "en")])
            .send().await?;
        if let Some(vt) = send_res.json::<serde_json::Value>().await?["vToken"].as_str() {
            v_token = vt.to_string();
        }
    }
    
    println!("5. Polling for OTP...");
    let mut code = String::new();
    for _ in 0..30 {
        if let Ok(msgs) = mail_client.get_messages(&account.token).await {
            if let Some(m) = msgs.first() {
                let re = regex::Regex::new(r"(\d{6})").unwrap();
                if let Some(c) = re.captures(&m.subject).or(re.captures(&m.text)) {
                    code = c[1].to_string();
                    break;
                }
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(2000)).await;
    }
    if code.is_empty() { anyhow::bail!("OTP timeout"); }
    println!("   OTP received: {}", code);
    
    let v_tok = if !v_token.is_empty() { &v_token } else { &current_reg_token };
    client.post(format!("{}/accounts.otp.update", gigya_domain))
        .form(&[("apiKey", api_key), ("vToken", v_tok), ("regToken", &current_reg_token), ("code", &code), ("source", "showScreenSet")])
        .send().await?;
        
    client.post(format!("{}/accounts.finalizeRegistration", gigya_domain))
        .form(&[("apiKey", api_key), ("regToken", &current_reg_token), ("includeUserInfo", "true"), ("data", &data_json)])
        .send().await?;
        
    println!("--------------------------------------");
    println!("✅ Account Created Successfully!");
    println!("EMAIL:    {}", account.address);
    println!("PASSWORD: {}", shared_password);
    println!("--------------------------------------");
    
    Ok(())
}

async fn get_client(email: &str, pass: &str) -> anyhow::Result<CambridgeClient> {
    let mut client = CambridgeClient::new()?;
    println!("Logging in to Elevate/Bookshelf...");
    client.login(email, pass).await?;
    println!("Logging in to GO APIs...");
    // Failure allowed for Go APIs if we only want download
    let _ = client.login_go(email, pass).await;
    Ok(client)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    
    match cli.command {
        Commands::Register => { do_register().await?; }
        Commands::Search { email, password, query } => {
            let client = get_client(&email, &password).await?;
            let items = client.search_trials(&query, 1).await?;
            for item in items {
                println!("- \"{}\" [TID: {}]", item["name"].as_str().unwrap_or("?"), item["trial_id"]);
            }
        }
        Commands::ClaimAll { email, password } => {
            let client = Arc::new(get_client(&email, &password).await?);
            println!("Finding all trials...");
            let keywords = vec!["English", "Math", "Science", "History", "Physics", "Chemistry", "Biology"];
            let mut all_tids = std::collections::HashSet::new();
            
            for k in keywords {
                if let Ok(items) = client.search_trials(k, 1).await {
                    for item in items {
                        if let Some(t) = item["trial_id"].as_i64() { all_tids.insert(t); }
                        else if let Some(t) = item["trial_id"].as_str() { if let Ok(n) = t.parse::<i64>() { all_tids.insert(n); } }
                    }
                }
            }
            
            println!("Claiming {} trials concurrently...", all_tids.len());
            let semaphore = Arc::new(Semaphore::new(10));
            let stream = futures::stream::iter(all_tids).map(|tid| {
                let client = client.clone();
                let sem = semaphore.clone();
                async move {
                    let _p = sem.acquire().await;
                    if let Err(e) = client.claim_trial(tid).await {
                        eprintln!("Failed to claim {}: {}", tid, e);
                    } else {
                        println!("Claimed TID {}", tid);
                    }
                }
            });
            stream.buffer_unordered(10).collect::<Vec<()>>().await;
            println!("Finished claiming.");
        }
        Commands::DownloadAll { email, password, output_dir } => {
            let client = get_client(&email, &password).await?;
            println!("Fetching bookshelf...");
            let books = client.get_books().await?;
            println!("Found {} books. Downloading concurrently...", books.len());
            
            let dm = DownloadManager::new(client, None);
            let semaphore = Arc::new(Semaphore::new(4)); // Limit parallel book zipping
            
            let stream = futures::stream::iter(books).map(|book| {
                let dm = dm.clone();
                let sem = semaphore.clone();
                let out = output_dir.clone();
                async move {
                    let _p = sem.acquire().await;
                    println!("Started: {}", book.title);
                    if let Err(e) = dm.download_book(&book, &out).await {
                        eprintln!("Error on {}: {}", book.title, e);
                    } else {
                        println!("Finished: {}", book.title);
                    }
                }
            });
            stream.buffer_unordered(4).collect::<Vec<()>>().await;
            println!("All downloads complete.");
        }
    }
    Ok(())
}
