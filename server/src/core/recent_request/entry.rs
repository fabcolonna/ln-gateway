use serde::Serialize;
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct RecentRequestEntry {
    /// Unix timestamp in milliseconds.
    pub ts_ms: u64,
    /// Best-effort client address (usually from X-Forwarded-For when behind nginx).
    pub client_addr: String,
    /// HTTP method (e.g. GET).
    pub method: String,
    /// Request path (no query string).
    pub path: String,
    /// HTTP status code returned by the gateway.
    pub status: u16,
    /// Convenience boolean: true when status < 400.
    pub ok: bool,
}
