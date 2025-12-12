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
use axum::http::{header, uri::Authority};
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
                .and_then(|addrs| addrs.iter().find_map(|a| a.address.clone()))
        })
        // Fallback to unspecified address
        .unwrap_or_else(|| "0.0.0.0".to_string())
}
