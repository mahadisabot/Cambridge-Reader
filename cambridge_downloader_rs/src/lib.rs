pub mod api;
pub mod models;
pub mod downloader;

pub mod mail_tm;

#[derive(Debug, Clone)]
pub enum ProgressEvent {
    Started { total_files: usize, phase: String }, // e.g., "Downloading Assets"
    FileDownloaded { filename: String, size: u64 },
    AssetDetected { size: u64 },
    BytesReceived { count: u64 },
    PhaseChanged { phase: String }, // e.g., "Zipping EPUB", "Injecting Cover"
    Finished { phase: String },
    Log { message: String }, // Generic log message
}

pub type ProgressSender = tokio::sync::mpsc::Sender<ProgressEvent>;
