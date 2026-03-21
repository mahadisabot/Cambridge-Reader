use cambridge_downloader_rs::api::CambridgeClient;
use cambridge_downloader_rs::downloader::DownloadManager;
use cambridge_downloader_rs::mail_tm::MailTmClient;
use std::sync::Arc;
use tokio::sync::Semaphore;
use futures::stream::StreamExt;
use rand::Rng;
use std::io::{self, Write};

fn prompt(msg: &str) -> String {
    print!("{}", msg);
    io::stdout().flush().ok();
    let mut buf = String::new();
    io::stdin().read_line(&mut buf).ok();
    buf.trim().to_string()
}

fn random_string(len: usize) -> String {
    rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(len)
        .map(char::from)
        .collect()
}

async fn do_register() -> anyhow::Result<(String, String)> {
    println!("\n🔑 Auto-Generating Account...");
    let mail_client = MailTmClient::new();
    let domains = mail_client.get_domains().await?;
    if domains.is_empty() { anyhow::bail!("No mail domains available"); }
    
    let domain = &domains[0].domain;
    let full_domain = if domain.starts_with('@') { domain.to_string() } else { format!("@{}", domain) };
    let address = format!("{}{}", random_string(8).to_lowercase(), full_domain);
    let shared_password = format!("{}!A1", random_string(10));
    
    println!("  1. Created temp email: {}", address);
    let account = mail_client.create_account(&address, &shared_password).await?;
    
    let api_key = "3_YZ2Ps8zW-VCK3H5YrTUOsnjUBbwPk6U20kdzNbdyujkuhavooF4bJ9lMF_WNAi0C";
    let gigya_domain = "https://accounts.eu1.gigya.com";
    let client = reqwest::Client::builder().cookie_store(true).build()?;
    
    println!("  2. Registering on Cambridge...");
    let init_res = client.get(format!("{}/accounts.initRegistration", gigya_domain))
        .query(&[("apiKey", api_key)]).send().await?;
    let init_json: serde_json::Value = init_res.json().await?;
    let reg_token = init_json["regToken"].as_str().unwrap().to_string();
    
    let profile_json = serde_json::json!({ "firstName": "Bot", "lastName": random_string(4), "country": "GB" }).to_string();
    let preferences_json = serde_json::json!({ "terms": { "go": { "isConsentGranted": true } } }).to_string();
    let data_json = serde_json::json!({ "eduelt": { "instituteRole": [{"role": "teacher"}] } }).to_string();
    
    client.post(format!("{}/accounts.register", gigya_domain))
        .form(&[
            ("apiKey", api_key), ("regToken", &reg_token), ("email", &account.address), ("password", &shared_password),
            ("profile", &profile_json), ("preferences", &preferences_json), ("data", &data_json),
            ("regSource", "CambridgeGO"), ("finalizeRegistration", "true"), ("include", "profile,preferences,data")
        ]).send().await?;
    
    println!("  3. Verifying email...");
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
    
    print!("  4. Waiting for OTP");
    io::stdout().flush().ok();
    let mut code = String::new();
    for _ in 0..30 {
        print!("."); io::stdout().flush().ok();
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
    println!();
    if code.is_empty() { anyhow::bail!("OTP timeout"); }
    println!("  5. OTP received: {}", code);
    
    let v_tok = if !v_token.is_empty() { &v_token } else { &current_reg_token };
    client.post(format!("{}/accounts.otp.update", gigya_domain))
        .form(&[("apiKey", api_key), ("vToken", v_tok), ("regToken", &current_reg_token), ("code", &code), ("source", "showScreenSet")])
        .send().await?;
    client.post(format!("{}/accounts.finalizeRegistration", gigya_domain))
        .form(&[("apiKey", api_key), ("regToken", &current_reg_token), ("includeUserInfo", "true"), ("data", &data_json)])
        .send().await?;
    
    println!("  ✅ Account ready!");
    Ok((account.address, shared_password))
}

async fn get_client(email: &str, pass: &str) -> anyhow::Result<CambridgeClient> {
    let mut client = CambridgeClient::new()?;
    println!("  Logging in to Elevate...");
    client.login(email, pass).await?;
    println!("  Logging in to GO API...");
    let _ = client.login_go(email, pass).await;
    Ok(client)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    println!("╔══════════════════════════════════════╗");
    println!("║   Cambridge Reader Downloader CLI    ║");
    println!("╚══════════════════════════════════════╝");
    
    // --- Step 1: Download Location ---
    let output_dir = prompt("\n📂 Download location [default: ./CambridgeBooks]: ");
    let output_dir = if output_dir.is_empty() { "./CambridgeBooks".to_string() } else { output_dir };
    std::fs::create_dir_all(&output_dir).ok();
    println!("  → Saving to: {}", output_dir);
    
    // --- Step 2: Account ---
    println!("\n👤 Account Setup:");
    println!("  [1] Generate new account automatically");
    println!("  [2] Use existing credentials");
    let choice = prompt("  Choice [1/2]: ");
    
    let (email, password) = if choice == "2" {
        let e = prompt("  Email: ");
        let p = prompt("  Password: ");
        (e, p)
    } else {
        do_register().await?
    };
    
    println!("\n  EMAIL:    {}", email);
    println!("  PASSWORD: {}", password);
    
    // --- Step 3: Login ---
    println!("\n🔐 Authenticating...");
    let client = get_client(&email, &password).await?;
    let client = Arc::new(client);
    
    // --- Main Menu Loop ---
    loop {
        println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        println!("  [1] Claim ALL available trials (bulk)");
        println!("  [2] Download ALL books from library (bulk)");
        println!("  [3] Search & claim specific books");
        println!("  [4] Download a specific book");
        println!("  [5] Exit");
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        let action = prompt("  Action: ");
        
        match action.as_str() {
            "1" => {
                // --- Claim All ---
                println!("\n🔍 Scraping all available trials...");
                let keywords = vec![
                    "Accountancy","Agriculture","Afrikaans","Arabic","Art & Design","Arts","Australian Curriculum",
                    "Basic Science & Technology","Biology","Business Management","Business Studies","Business, Economics, and Legal",
                    "Career Technology","Chemistry","Child Development","Chinese as a Second Language","Chinese language and literature",
                    "Civic Education","Classics","Climate Education","Coding & Robotics","Combined Science","Commerce",
                    "Computer Science","Computing","Creative and Technology Studies","Creative Arts","Creative iMedia",
                    "Development Studies","Early US History","Early years","Earth and Environmental Sciences",
                    "Economic and Management Sciences","Economics","Ekonomiese en Bestuurwetenskappe","EMS/EBW",
                    "Engineering","English","English (Shakespeare)","English as a Second Language","English as an Additional Language",
                    "English First Additional Language","English Language","English Language and Literature","English Literature",
                    "Enterprise and Marketing","Entrepreneurship","Environmental Management","Environmental Studies",
                    "Essential Computing","Essential Creative Arts","Essential French","Essential Mathematics",
                    "Essential Science","Essential History","Essential Learning and Literacy","Essential Our World and Our People",
                    "Fisiese Wetenskappe","French","Geography","German","Global Perspectives","Health & PE",
                    "Health and Social Care","History","Homework","Hospitality","Humanities","ICT",
                    "IGCSE Afrikaans","Information Technology","International Education","IsiNdebele","IsiXhosa Home Language",
                    "IsiZulu Home Language","IWB Software","Kindergarten","Latin","Latin and other Languages","Let's explore",
                    "Lewensvaardighede","Lewenswetenskappe","Life Sciences","Life Skills","Literacy","Mandarin",
                    "Marine Science","Mathematical Literacy","Mathematics","Media","Media Studies","Modern Foreign Languages",
                    "Modern US History","Natural Sciences and Technology","Natuurwetenskappe","Nigeria ECD","Numeracy",
                    "Outdoor and Environmental Studies","Philosophy and Critical Thinking","Physical Education","Physical Sciences",
                    "Physics","Primary Phonics","Professional Development","Psychology","Reading Masterclass","Rekeningkunde",
                    "Religion","Science","Sciences","Sepedi Home Language","Sesotho","Setswana","Siswati",
                    "Smart Start Kindergarten","Smart Start Nursery","Social sciences","Social Studies","Sociology","Soft Skills",
                    "Sosiale Wetenskappe","Spanish","Special Needs","Sport","Statistics","Study & Master Covid-19 Worksheets",
                    "Study Guides","Teacher Guides","Teaching Practice and Professional Development","Technology",
                    "Travel and Tourism","Tshivenda","US History","Visual Communication","Vocational","Well being",
                    "Wiskunde","Wiskunde Geletterdheid","Xitsonga Home Language"
                ];
                let mut all_tids = std::collections::HashSet::new();
                
                for k in &keywords {
                    let k_trimmed = k.trim();
                    if k_trimmed.is_empty() { continue; }
                    
                    if let Ok(items) = client.search_trials(k_trimmed, 1).await {
                        for item in &items {
                            if let Some(t) = item["trial_id"].as_i64() { all_tids.insert(t); }
                            else if let Some(t) = item["trial_id"].as_str() { if let Ok(n) = t.parse::<i64>() { all_tids.insert(n); } }
                        }
                        print!("  {} ({}) ", k, items.len()); io::stdout().flush().ok();
                    }
                }
                println!("\n  Found {} unique trials. Claiming concurrently...", all_tids.len());
                
                let sem = Arc::new(Semaphore::new(10));
                let client_c = client.clone();
                let stream = futures::stream::iter(all_tids).map(move |tid| {
                    let client = client_c.clone();
                    let sem = sem.clone();
                    async move {
                        let _p = sem.acquire().await;
                        match client.claim_trial(tid).await {
                            Ok(_) => print!("✓"),
                            Err(_) => print!("✗"),
                        }
                        io::stdout().flush().ok();
                    }
                });
                stream.buffer_unordered(10).collect::<Vec<()>>().await;
                println!("\n  ✅ Claiming complete!");
            }
            "2" => {
                // --- Download All ---
                println!("\n📚 Fetching your bookshelf...");
                let books = client.get_books().await?;
                println!("  Found {} books. Downloading with 4-way concurrency...\n", books.len());
                
                let dm = DownloadManager::new((*client).clone(), None);
                let sem = Arc::new(Semaphore::new(4));
                let out = output_dir.clone();
                
                let stream = futures::stream::iter(books).map(|book| {
                    let dm = dm.clone();
                    let sem = sem.clone();
                    let out = out.clone();
                    async move {
                        let _p = sem.acquire().await;
                        println!("  ⬇ {}", book.title);
                        match dm.download_book(&book, &out).await {
                            Ok(_) => println!("  ✅ {}", book.title),
                            Err(e) => eprintln!("  ❌ {}: {}", book.title, e),
                        }
                    }
                });
                stream.buffer_unordered(4).collect::<Vec<()>>().await;
                println!("\n  📦 All downloads complete!");
            }
            "3" => {
                // --- Search & Claim Specific ---
                let query = prompt("\n🔎 Search query: ");
                if query.is_empty() { continue; }
                
                let items = client.search_trials(&query, 1).await?;
                if items.is_empty() {
                    println!("  No results found.");
                    continue;
                }
                
                println!("\n  Results:");
                let mut trial_ids: Vec<(i64, String)> = Vec::new();
                for (i, item) in items.iter().enumerate() {
                    let name = item["name"].as_str().unwrap_or("?");
                    let tid = item["trial_id"].as_i64().unwrap_or(0);
                    println!("  [{}] {} (TID: {})", i+1, name, tid);
                    trial_ids.push((tid, name.to_string()));
                }
                
                let sel = prompt("\n  Claim which? (number, 'all', or 'skip'): ");
                if sel.to_lowercase() == "all" {
                    for (tid, name) in &trial_ids {
                        match client.claim_trial(*tid).await {
                            Ok(_) => println!("  ✅ Claimed: {}", name),
                            Err(e) => eprintln!("  ❌ {}: {}", name, e),
                        }
                    }
                } else if sel != "skip" {
                    if let Ok(idx) = sel.parse::<usize>() {
                        if idx >= 1 && idx <= trial_ids.len() {
                            let (tid, name) = &trial_ids[idx - 1];
                            match client.claim_trial(*tid).await {
                                Ok(_) => println!("  ✅ Claimed: {}", name),
                                Err(e) => eprintln!("  ❌ {}: {}", name, e),
                            }
                        }
                    }
                }
            }
            "4" => {
                // --- Download Specific ---
                println!("\n📚 Fetching your bookshelf...");
                let books = client.get_books().await?;
                if books.is_empty() {
                    println!("  No books in your library. Claim some first!");
                    continue;
                }
                
                for (i, b) in books.iter().enumerate() {
                    println!("  [{}] {}", i+1, b.title);
                }
                
                let sel = prompt("\n  Download which? (number): ");
                if let Ok(idx) = sel.parse::<usize>() {
                    if idx >= 1 && idx <= books.len() {
                        let book = &books[idx - 1];
                        println!("  ⬇ Downloading: {}...", book.title);
                        let dm = DownloadManager::new((*client).clone(), None);
                        match dm.download_book(book, &output_dir).await {
                            Ok(_) => println!("  ✅ Done: {}", book.title),
                            Err(e) => eprintln!("  ❌ Error: {}", e),
                        }
                    }
                }
            }
            "5" | "exit" | "quit" | "q" => {
                println!("\n👋 Goodbye!");
                break;
            }
            _ => println!("  Invalid choice."),
        }
    }
    
    Ok(())
}
