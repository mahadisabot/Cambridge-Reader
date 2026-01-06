use anyhow::{Result, Context};
use crate::models::Book;
use crate::api::CambridgeClient;
use std::path::Path;
use std::fs::{self, File};
use std::io::Write; 
use std::sync::Arc;
use tokio::sync::Semaphore;
use quick_xml::events::Event;
use quick_xml::reader::Reader;
use zip::write::FileOptions;
use futures::future::join_all;
use futures::StreamExt;
use serde_json;


#[derive(Clone)]
pub struct DownloadManager {
    client: CambridgeClient,
    concurrency_limit: usize,
    progress_tx: Option<crate::ProgressSender>,
}

impl DownloadManager {
    pub fn new(client: CambridgeClient, progress_tx: Option<crate::ProgressSender>) -> Self {
        Self {
            client,
            concurrency_limit: 50, // Default to 50 concurrent downloads
            progress_tx,
        }
    }
    
    // Helper to send events
    async fn send_progress(&self, event: crate::ProgressEvent) {
        if let Some(tx) = &self.progress_tx {
            let _ = tx.send(event).await;
        }
    }

    pub async fn download_book(&self, book: &Book, output_dir: &str) -> Result<()> {
        let safe_title: String = book.title.chars()
            .filter(|c| c.is_alphanumeric() || *c == ' ')
            .collect();
        let safe_title = safe_title.trim().to_string();
        
        println!("Starting download for: {}", safe_title);
        // Initial Log Event
        self.send_progress(crate::ProgressEvent::Log { message: format!("Starting download for: {}", safe_title) }).await;
        
        let book_dir = Path::new(output_dir);
        if !book_dir.exists() {
            fs::create_dir_all(book_dir)?;
        }

        let epub_path = book_dir.join(format!("{}.epub", safe_title));
        let temp_dir = book_dir.join(format!("temp_{}", safe_title));
        
        if temp_dir.exists() {
            fs::remove_dir_all(&temp_dir)?;
        }
        fs::create_dir_all(&temp_dir)?;

        // 1. Fetch OPF (Sequential dependency)
        self.send_progress(crate::ProgressEvent::PhaseChanged { phase: "Fetching Metadata".to_string() }).await;
        
        println!("Fetching OPF...");
        let (opf_content, opf_rel_path) = self.fetch_opf(book).await?;
        
        // Save OPF locally
        let local_opf_path = temp_dir.join(&opf_rel_path);
        if let Some(parent) = local_opf_path.parent() {
            fs::create_dir_all(parent)?;
        }
        fs::write(&local_opf_path, &opf_content)?;

        // 2. Parse Manifest
        println!("Parsing manifest...");
        let manifest_items = self.parse_manifest(&opf_content)?;
        println!("Found {} assets to download.", manifest_items.len());
        
        // 3. Launch Concurrent Tasks
        // Start Progress for Assets (Main progress driver)
        self.send_progress(crate::ProgressEvent::Started { total_files: manifest_items.len(), phase: "Downloading Assets".to_string() }).await;

        // 3. Launch Concurrent Tasks
        // Task A: Download Enrichments (Independent)
        let dm_resources = self.clone();
        let book_resources = book.clone();
        let out_resources = output_dir.to_string();
        let title_resources = safe_title.clone();
        
        let resource_task = tokio::spawn(async move {
            println!("Checking for enrichments (Background)...");
             if let Err(e) = dm_resources.fetch_enrichments(&book_resources, &out_resources, &title_resources).await {
                eprintln!("Warning: Failed to download resources: {}", e);
            }
        });

        // Task B: Download EPUB Assets (Main)
        // Task C: Inject Cover (Concurrent with Assets)
        
        let dm_cover = self.clone();
        let book_cover = book.clone();
        let temp_dir_cover = temp_dir.clone();
        let opf_path_cover = opf_rel_path.clone();
        
        let cover_task = tokio::spawn(async move {
            println!("Injecting cover (Concurrent)...");
            dm_cover.send_progress(crate::ProgressEvent::Log { message: "Injecting Cover...".to_string() }).await;
            if let Err(e) = dm_cover.inject_cover(&book_cover, &temp_dir_cover, &opf_path_cover).await {
                 eprintln!("Warning: Failed to inject cover: {}", e);
            }
        });

        // Run Asset Download directly (or spawn)
        println!("Downloading assets...");
        self.download_assets(book, &manifest_items, &temp_dir, &opf_rel_path).await?;
        
        // Wait for Cover Injection before Zipping (as it modifies OPF)
        cover_task.await?;
        
        // 4. Create EPUB (Blocking CPU work)
        // Offload to blocking thread to avoid freezing async runtime
        self.send_progress(crate::ProgressEvent::PhaseChanged { phase: "Zipping EPUB (CPU Bound)".to_string() }).await;
        println!("Creating EPUB: {:?}", epub_path);
        
        let temp_dir_zip = temp_dir.clone();
        let epub_path_zip = epub_path.clone();
        let dm_zip = self.clone();
        
        tokio::task::spawn_blocking(move || {
            dm_zip.create_epub(&temp_dir_zip, &epub_path_zip)
        }).await??;
        
        // 5. Ensure Resources Finished
        self.send_progress(crate::ProgressEvent::PhaseChanged { phase: "Finalizing Resources".to_string() }).await;
        resource_task.await?;
        
        self.send_progress(crate::ProgressEvent::Finished { phase: "Complete".to_string() }).await;

        // Cleanup
        fs::remove_dir_all(&temp_dir)?;
        println!("Download complete: {}", safe_title);
        
        Ok(())
    }

    async fn fetch_opf(&self, book: &Book) -> Result<(Vec<u8>, String)> {
        let src_url = book.src_url.as_ref().context("No src_url")?;
        let opf_path = book.package_doc_path.as_ref().context("No package_doc_path")?;
        
        let url = format!("{}{}", src_url, opf_path);
        let content = self.client.get_bytes(&url).await?;
        
        Ok((content.to_vec(), opf_path.trim_start_matches('/').to_string()))
    }
    
    // Quick XML parsing to extract hrefs from <item href="...">
    fn parse_manifest(&self, opf_content: &[u8]) -> Result<Vec<String>> {
        let mut reader = Reader::from_reader(opf_content);
        reader.trim_text(true);
        let mut buf = Vec::new();
        let mut hrefs = Vec::new();

        loop {
            match reader.read_event_into(&mut buf) {
                Ok(Event::Empty(ref e)) | Ok(Event::Start(ref e)) => {
                    if e.name().as_ref() == b"item" {
                        for attr in e.attributes() {
                            let attr = attr?;
                            if attr.key.as_ref() == b"href" {
                                let val = attr.unescape_value()?;
                                hrefs.push(val.into_owned());
                            }
                        }
                    }
                }
                Ok(Event::Eof) => break,
                Err(e) => return Err(anyhow::anyhow!("XML Parse Error: {}", e)),
                _ => (),
            }
            buf.clear();
        }
        Ok(hrefs)
    }

    async fn download_assets(&self, book: &Book, items: &[String], temp_dir: &Path, opf_rel_path: &str) -> Result<()> {
        let src_url = book.src_url.as_ref().unwrap();
        let opf_dir_url = format!("{}/{}", src_url, Path::new(opf_rel_path).parent().unwrap_or(Path::new("")).to_string_lossy().replace("\\", "/"));
        let local_opf_dir = temp_dir.join(Path::new(opf_rel_path).parent().unwrap_or(Path::new("")));

        let semaphore = Arc::new(Semaphore::new(self.concurrency_limit));
        let client = self.client.clone(); 
        let _progress_tx_base = self.progress_tx.clone();

        let progress_tx_base = self.progress_tx.clone();

        // --- Step 2: Download Assets ---
        println!("Downloading assets...");
        self.send_progress(crate::ProgressEvent::PhaseChanged { phase: "Downloading Assets".to_string() }).await;

        let mut tasks = Vec::new();

        for href in items {
            let permit = semaphore.clone().acquire_owned().await?;
            let client = client.clone();
            let url = format!("{}/{}", opf_dir_url, href);
            let local_path = local_opf_dir.join(href);
            let href = href.clone();
            let progress_tx = progress_tx_base.clone();

            tasks.push(tokio::spawn(async move {
                let _permit = permit; // Drop permit when task done
                
                if let Some(parent) = local_path.parent() {
                    fs::create_dir_all(parent).ok(); 
                }
                
                // Simple retry logic
                for _ in 0..3 {
                    match client.get_response(&url).await {
                        Ok(resp) => {
                            // REMOVED: AssetDetected emission (Handled in Step 1)
                            
                            let mut stream = resp.bytes_stream();
                            let mut file = match File::create(&local_path) {
                                Ok(f) => f,
                                Err(e) => return Err(format!("File create error: {}", e)),
                            };

                            while let Some(chunk_res) = stream.next().await {
                                match chunk_res {
                                    Ok(chunk) => {
                                        if let Err(e) = file.write_all(&chunk) {
                                             return Err(format!("File write error: {}", e));
                                        }
                                        if let Some(tx) = &progress_tx {
                                             let _ = tx.send(crate::ProgressEvent::BytesReceived { count: chunk.len() as u64 }).await;
                                        }
                                    },
                                    Err(e) => return Err(format!("Stream error: {}", e)),
                                }
                            }
                            // Success
                            if let Some(tx) = &progress_tx {
                                let _ = tx.send(crate::ProgressEvent::FileDownloaded { filename: href.clone(), size: 0 }).await;
                            }
                            return Ok(());
                        },
                        Err(_) => tokio::time::sleep(std::time::Duration::from_millis(100)).await,
                    }
                }
                Err(format!("Failed to download: {}", url))
            }));
        }

        let results = join_all(tasks).await;
        for res in results {
            match res {
                Ok(Ok(_)) => (), // Task success
                Ok(Err(e)) => eprintln!("Asset Error: {}", e),
                Err(e) => eprintln!("Task Panic: {}", e),
            }
        }
        Ok(())
    }

    fn create_epub(&self, src_dir: &Path, out_path: &Path) -> Result<()> {
        let file = File::create(out_path)?;
        let mut zip = zip::ZipWriter::new(file);
        // optimization: Use Stored (0) compression. 
        // Assets (JPG, MP3, PDF) are already compressed. Deflate is slow and useless here.
        let options = FileOptions::default().compression_method(zip::CompressionMethod::Stored);
        
        // Mimetype must be stored (uncompressed) anyway
        zip.start_file("mimetype", options)?;
        zip.write_all(b"application/epub+zip")?;
        
        // 2. Write META-INF/container.xml
        // We need to find the OPF path relative to src_dir
        let mut opf_rel_path = "OEBPS/content.opf".to_string(); // Default fallback
        for entry in walkdir::WalkDir::new(src_dir) {
             let entry = entry?;
             if entry.path().extension().map_or(false, |ext| ext == "opf") {
                 let rel = entry.path().strip_prefix(src_dir)?;
                 opf_rel_path = rel.to_string_lossy().replace("\\", "/");
                 break;
             }
        }

        zip.start_file("META-INF/container.xml", options)?;
        let container_xml = format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="{}" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>"#, opf_rel_path);
        zip.write_all(container_xml.as_bytes())?;

        // 3. Write All Other Files
        let walk_dir = walkdir::WalkDir::new(src_dir);
        for entry in walk_dir {
            let entry = entry?;
            let path = entry.path();
            if path.is_file() {
                let name = path.strip_prefix(src_dir)?.to_string_lossy().replace("\\", "/");
                
                if name == "mimetype" || name == "META-INF/container.xml" {
                    continue;
                }

                zip.start_file(name, options)?;
                let mut f = File::open(path)?;
                std::io::copy(&mut f, &mut zip)?;
            }
        }
        zip.finish()?;
        Ok(())
    }

    async fn fetch_enrichments(&self, book: &Book, output_dir: &str, safe_title: &str) -> Result<()> {
        // Look for enrichments.json relative to OPF path
        let src_url = book.src_url.as_ref().unwrap().trim_end_matches('/');
        let opf_path = book.package_doc_path.as_ref().unwrap();
        let opf_parent = Path::new(opf_path).parent().unwrap_or(Path::new("")).to_string_lossy().replace("\\", "/");
        let opf_parent = opf_parent.trim_start_matches('/');
        let opf_dir_url = format!("{}/{}", src_url, opf_parent);
        
        let manifest_url = format!("{}/enrichments.json", opf_dir_url);
        
        let json_bytes = match self.client.get_bytes(&manifest_url).await {
            Ok(b) => b,
            Err(_) => return Ok(()), // No enrichments
        };
        
        // Fix BOM Issue
        let json_slice = if json_bytes.starts_with(b"\xEF\xBB\xBF") {
            &json_bytes[3..]
        } else {
            &json_bytes
        };

        let items: Vec<serde_json::Value> = match serde_json::from_slice(json_slice) {
            Ok(v) => v,
            Err(e) => {
                eprintln!("Warning: Failed to parse enrichments.json: {}", e);
                Vec::new() 
            }
        };
        
        let res_dir = Path::new(output_dir).join(format!("{}_resources", safe_title));
        if !items.is_empty() {
             fs::create_dir_all(&res_dir)?;
        }
        
        // --- Concurrent Download of Explicit Enrichments ---
        let client = self.client.clone();
        let src_url_owned = src_url.to_string();
        let opcr_url_owned = book.opcr_url.clone();
        let res_dir_owned = res_dir.clone();
        
        let stream = futures::stream::iter(items).map(|item| {
            let client = client.clone();
            let src_url = src_url_owned.clone();
            let opcr_url = opcr_url_owned.clone();
            let res_dir = res_dir_owned.clone();
            
            async move {
                if let (Some(name), Some(url_part)) = (item["title"].as_str(), item["downloadUrl"].as_str()) {
                     let target_path = res_dir.join(name);
                     let primary_url = format!("{}{}", src_url, url_part);
                     
                     // Try Primary
                     let mut download_success = false;
                     if let Ok(bytes) = client.get_bytes(&primary_url).await {
                         let content_slice = if bytes.starts_with(b"\xEF\xBB\xBF") { &bytes[3..] } else { &bytes };
                         if !content_slice.starts_with(b"<!DOCTYPE html") && !content_slice.starts_with(b"<html") {
                             if fs::write(&target_path, &bytes).is_ok() {
                                 download_success = true;
                             }
                         }
                     }
                     
                     // Try Fallback
                     if !download_success {
                         if let Some(opcr_base) = opcr_url {
                             let clean_part = url_part.trim_start_matches('/');
                             let alt_url = format!("{}{}", opcr_base, clean_part);
                             
                             if let Ok(bytes) = client.get_bytes(&alt_url).await {
                                 let content_slice = if bytes.starts_with(b"\xEF\xBB\xBF") { &bytes[3..] } else { &bytes };
                                 if !content_slice.starts_with(b"<!DOCTYPE html") {
                                      let _ = fs::write(&target_path, &bytes);
                                 }
                             }
                         }
                     }
                }
            }
        });
        
        // Limited concurrency for enrichments too
        use futures::StreamExt;
        stream.buffer_unordered(self.concurrency_limit).collect::<Vec<()>>().await;

        Ok(())
    }

    async fn inject_cover(&self, book: &Book, temp_dir: &Path, opf_rel_path: &str) -> Result<()> {
        let cover_url = match &book.cover {
             Some(url) => url,
             None => return Ok(()),
        };
        
        // Download Cover
        let cover_bytes = self.client.get_bytes(cover_url).await?;
        
        let opf_path = temp_dir.join(opf_rel_path);
        let opf_dir = opf_path.parent().unwrap_or(temp_dir);
        let cover_filename = "cover.jpg";
        let local_cover_path = opf_dir.join(cover_filename);
        
        fs::write(&local_cover_path, &cover_bytes)?;
        
        // Modify OPF Content (Simple String Injection)
        let mut opf_content = fs::read_to_string(&opf_path)?;
        
        // 1. Inject Manifest Item
        if !opf_content.contains("cover.jpg") {
            let item_tag = format!(r#"<item id="cover-image-injected" href="{}" media-type="image/jpeg"/>"#, cover_filename);
            // Insert before closing manifest
            opf_content = opf_content.replace("</manifest>", &format!("{}\n    </manifest>", item_tag));
            
            // 2. Inject Metadata
            let meta_tag = r#"<meta name="cover" content="cover-image-injected"/>"#;
            opf_content = opf_content.replace("</metadata>", &format!("{}\n    </metadata>", meta_tag));
            
            fs::write(&opf_path, opf_content)?;
        }
        
        Ok(())
    }
}


