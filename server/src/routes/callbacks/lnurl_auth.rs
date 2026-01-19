use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
};
use hex::FromHex;
use secp256k1::{Message, PublicKey, Secp256k1};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::{
    context::Context,
    routes::{ApiResponse, api_error},
};

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub(super) struct LnUrlAuthQuery {
    /// One-time challenge (32 bytes hex)
    pub k1: String,
    /// DER-hex-encoded ECDSA signature for `k1` (some wallets may use compact 64-byte)
    pub sig: String,
    /// Compressed (33-byte) secp256k1 public key hex
    pub key: String,
}

#[derive(Serialize, utoipa::ToSchema)]
pub(super) struct LnUrlAuthResponse {
    pub ok: bool,
    pub result: Option<Value>,
    pub error: Option<String>,
}

type Ret = ApiResponse<LnUrlAuthResponse>;

#[utoipa::path(
    get,
    path = "/callbacks/lnurl-auth",
    tag = "ln-gateway",
    operation_id = "lnurlAuthCallback",
    params(
        ("k1" = String, Query, description = "Challenge token from /lnurl-auth"),
        ("sig" = String, Query, description = "Signature of k1 (hex, compact or DER)"),
        ("key" = String, Query, description = "Signing public key (hex, compressed)"),
        ("action" = Option<String>, Query, description = "Optional LNURL-auth action"),
        ("tag" = Option<String>, Query, description = "Optional LNURL-auth tag")
    ),
    responses(
        (status = 200, description = "LNURL-auth callback response", body = LnUrlAuthResponse)
    )
)]
pub(super) async fn handler(
    State(state): State<Arc<Context>>,
    Query(params): Query<LnUrlAuthQuery>,
) -> Ret {
    // Verify k1 is expected (pending), and hasn't already been used.
    {
        let pending = state.auth_pending_keys_set.lock().await;
        if !pending.contains(&params.k1) {
            // Not pending, so either invalid or already used.
            drop(pending);

            let completed = state.auth_completed.lock().await;
            if completed.contains_key(&params.k1) {
                return api_error::build(StatusCode::CONFLICT, "k1 already used");
            }

            return api_error::build(StatusCode::BAD_REQUEST, "invalid k1");
        }
    }

    // Parse k1 bytes.
    let k1_bytes = match <Vec<u8>>::from_hex(&params.k1) {
        Ok(b) if b.len() == 32 => b,
        Ok(_) => return api_error::build(StatusCode::BAD_REQUEST, "invalid k1 length"),
        Err(_) => return api_error::build(StatusCode::BAD_REQUEST, "invalid k1 hex"),
    };

    // Parse public key.
    let pubkey_bytes = match <Vec<u8>>::from_hex(&params.key) {
        Ok(b) if b.len() == 33 => b,
        Ok(_) => return api_error::build(StatusCode::BAD_REQUEST, "invalid key length"),
        Err(_) => return api_error::build(StatusCode::BAD_REQUEST, "invalid key hex"),
    };

    let pubkey = match PublicKey::from_slice(&pubkey_bytes) {
        Ok(pk) => pk,
        Err(_) => return api_error::build(StatusCode::BAD_REQUEST, "invalid secp256k1 public key"),
    };

    // Parse signature: DER (variable length) or compact (64 bytes).
    let sig_bytes = match <Vec<u8>>::from_hex(&params.sig) {
        Ok(b) => b,
        Err(_) => return api_error::build(StatusCode::BAD_REQUEST, "invalid sig hex"),
    };

    let sig = if sig_bytes.len() == 64 {
        match secp256k1::ecdsa::Signature::from_compact(&sig_bytes) {
            Ok(s) => s,
            Err(_) => {
                return api_error::build(StatusCode::BAD_REQUEST, "invalid compact signature");
            }
        }
    } else {
        match secp256k1::ecdsa::Signature::from_der(&sig_bytes) {
            Ok(s) => s,
            Err(_) => return api_error::build(StatusCode::BAD_REQUEST, "invalid DER signature"),
        }
    };

    let msg = match Message::from_digest_slice(&k1_bytes) {
        Ok(m) => m,
        Err(_) => return api_error::build(StatusCode::BAD_REQUEST, "invalid k1 message"),
    };

    let secp = Secp256k1::verification_only();
    if secp.verify_ecdsa(&msg, &sig, &pubkey).is_err() {
        return api_error::build(StatusCode::BAD_REQUEST, "signature verification failed");
    }

    // Consume k1 on successful verification.
    {
        let mut pending = state.auth_pending_keys_set.lock().await;
        if !pending.remove(&params.k1) {
            // Another request won the race.
            return api_error::build(StatusCode::CONFLICT, "k1 already used");
        }

        let mut completed = state.auth_completed.lock().await;
        completed.insert(params.k1.clone(), params.key.clone());
    }

    ApiResponse::make_ok(LnUrlAuthResponse {
        ok: true,
        result: Some(serde_json::json!({"message": "Authentication successful"})),
        error: None,
    })
}
