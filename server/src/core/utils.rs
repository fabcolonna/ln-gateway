pub fn gen_k1_as_string() -> String {
    let mut bytes: Vec<u8> = Vec::with_capacity(32);
    bytes.extend_from_slice(uuid::Uuid::new_v4().as_bytes());
    bytes.extend_from_slice(uuid::Uuid::new_v4().as_bytes());

    bytes
        .iter()
        .map(|b| format!("{:02x}", b))
        .collect::<String>()
}

use std::str::FromStr;

use axum::extract::Request;
use axum::http::{HeaderMap, header, uri::Authority};
use cln_rpc::model::responses::GetinfoResponse;

pub fn extract_request_host(request: &Request, info: &GetinfoResponse) -> String {
    request
        .headers()
        .get(header::HOST)
        .and_then(|value| value.to_str().ok())
        .map(|s| {
            Authority::from_str(s)
                .map(|authority| authority.host().to_owned())
                .unwrap_or_else(|_| s.to_owned())
        })
        // If no Host header, try to get from cln getinfo response in the binding or address fields
        .or_else(|| {
            info.binding
                .as_ref()
                .and_then(|bindings| bindings.iter().find_map(|b| b.address.clone()))
        })
        .or_else(|| {
            info.address
                .as_ref()
                .and_then(|addresses| addresses.iter().find_map(|a| a.address.clone()))
        })
        // Fallback to unspecified address
        .unwrap_or_else(|| "0.0.0.0".to_string())
}

fn header_string(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(name)
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned)
}

/// Best-effort base URL builder for endpoints that must return a callback URL.
///
/// Prefers `X-Forwarded-Proto` and `X-Forwarded-Host` (when behind a reverse proxy),
/// falls back to `Host`, and finally to the provided `fallback_host`.
pub fn request_base_url(request: &Request, fallback_host: &str, listening_port: u16) -> String {
    let headers = request.headers();
    let proto = header_string(headers, "x-forwarded-proto").unwrap_or_else(|| "http".to_string());

    let forwarded =
        header_string(headers, "x-forwarded-host").or_else(|| header_string(headers, "host"));
    let authority = forwarded
        .as_deref()
        .and_then(|raw| Authority::from_str(raw).ok())
        .unwrap_or_else(|| {
            Authority::from_str(&format!("{}:{}", fallback_host, listening_port))
                .expect("valid fallback authority")
        });

    let authority =
        if authority.port_u16().is_some() || listening_port == 80 || listening_port == 443 {
            authority.to_string()
        } else {
            format!("{}:{}", authority.host(), listening_port)
        };

    format!("{}://{}", proto, authority)
}
