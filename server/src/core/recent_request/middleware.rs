use std::{
    net::SocketAddr,
    time::{SystemTime, UNIX_EPOCH},
};

use axum::{
    extract::{ConnectInfo, State},
    http::{HeaderMap, Request},
    middleware::Next,
    response::Response,
};

use crate::{context::Context, core::recent_request::entry::RecentRequestEntry};

fn should_log_path(path: &str) -> bool {
    // Avoid spamming the log with UI polling endpoints and docs.
    !(path == "/health"
        || path == "/recent-requests"
        || path.starts_with("/swagger-ui")
        || path.starts_with("/api-doc/"))
}

fn extract_client_addr(headers: &HeaderMap, connect: Option<SocketAddr>) -> String {
    // Prefer X-Forwarded-For (nginx sets it as a comma-separated list).
    if let Some(v) = headers.get("x-forwarded-for").and_then(|h| h.to_str().ok()) {
        if let Some(first) = v.split(',').next().map(str::trim) {
            if !first.is_empty() {
                return first.to_string();
            }
        }
    }

    // Next, try X-Real-IP.
    if let Some(v) = headers.get("x-real-ip").and_then(|h| h.to_str().ok()) {
        let v = v.trim();
        if !v.is_empty() {
            return v.to_string();
        }
    }

    // Fallback to the socket address.
    connect
        .map(|a| a.to_string())
        .unwrap_or_else(|| "unknown".to_string())
}

// Middleware to log recent requests into Context.recent_requests.

pub async fn middleware(
    State(state): State<std::sync::Arc<Context>>,
    req: Request<axum::body::Body>,
    next: Next,
) -> Response {
    let headers: HeaderMap = req.headers().clone();
    let connect: Option<SocketAddr> = req
        .extensions()
        .get::<ConnectInfo<SocketAddr>>()
        .map(|c| c.0);

    let method = req.method().to_string();
    let path = req.uri().path().to_string();

    let should_log = should_log_path(&path);
    let client_addr = if should_log {
        extract_client_addr(&headers, connect)
    } else {
        String::new()
    };

    let res = next.run(req).await;
    let status = res.status().as_u16();
    let ok = status < 400;
    let ts_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64;

    let entry = RecentRequestEntry {
        ts_ms,
        client_addr: client_addr.clone(),
        method: method.clone(),
        path: path.clone(),
        status,
        ok,
    };

    // Debug log for all requests in debug mode.
    if cfg!(debug_assertions) {
        tracing::debug!(
            client_addr = %client_addr.clone(),
            method = %method,
            path = %path,
            status = status,
            "request"
        );
    }

    if should_log {
        let mut q = state.recent_requests.lock().await;
        q.push_back(entry);
        while q.len() > 100 {
            // Keep only the latest 100 entries
            q.pop_front();
        }
    }

    res
}
