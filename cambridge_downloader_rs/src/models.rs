use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct LoginRequest {
    #[serde(rename = "userName")]
    pub user_name: String,
    pub password: String,
    #[serde(rename = "deviceId")]
    pub device_id: String,
    #[serde(rename = "authenticationMode")]
    pub authentication_mode: String,
}


#[derive(Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct LoginResponse {
    pub user_id: u64,
    pub access_token: String,
}

#[derive(Deserialize, Serialize, Debug, Clone)]
pub struct Book {
    pub id: String,
    pub title: String,
    #[serde(alias = "image", alias = "imageUrl", alias = "coverUrl")]
    pub cover: Option<String>,
    pub isbn: Option<String>,
    pub src_url: Option<String>,
    #[serde(rename = "package_doc_path")] // Ensure camelCase mapping manually if needed or stick to rename_all
    pub package_doc_path: Option<String>,
    pub opcr_url: Option<String>,
    #[serde(skip_deserializing, default)]
    pub is_downloaded: bool,
}


// For Enrichments (Manifest)
#[derive(Deserialize, Serialize, Debug, Clone)]

pub struct EnrichmentManifest {
    pub downloadable: Option<bool>,
    pub download_url: Option<String>,
    pub title: Option<String>,
    // flattened or list?
}
