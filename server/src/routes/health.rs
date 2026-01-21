use std::sync::Arc;

use axum::{extract::State, http::StatusCode};
use cln_rpc::model::requests::GetinfoRequest;
use cln_rpc::model::responses::GetinfoResponse;
use serde::{Deserialize, Serialize};

use crate::{
    context::Context,
    core::bitcoin_rpc_connector::BitcoinRPCSnapshot,
    routes::{ApiResponse, api_error},
};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "lowercase")]
pub(super) enum LightningStatus {
    Ok,
    Syncing,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct LightningInfo {
    /// Human-readable overall status; clients treat ok/healthy/ready as operational.
    pub status: LightningStatus,
    /// Node alias (may be absent).
    pub alias: Option<String>,
    /// Node public key (hex).
    pub pubkey: String,
    /// CoreLightning version string.
    pub cln_version: String,
    /// Number of connected peers.
    pub num_peers: u32,
    /// Number of active channels.
    pub num_active_channels: u32,
    /// Number of pending channels.
    pub num_pending_channels: u32,
}

impl From<GetinfoResponse> for LightningInfo {
    fn from(value: GetinfoResponse) -> Self {
        let is_syncing =
            value.warning_bitcoind_sync.is_some() || value.warning_lightningd_sync.is_some();
        let status = if is_syncing {
            LightningStatus::Syncing
        } else {
            LightningStatus::Ok
        };

        Self {
            status,
            alias: value.alias,
            pubkey: value.id.to_string(),
            cln_version: value.version,
            num_peers: value.num_peers,
            num_active_channels: value.num_active_channels,
            num_pending_channels: value.num_pending_channels,
        }
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "lowercase")]
pub(super) enum BitcoinStatus {
    Ok,
    Unreachable,
    NotConfigured,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct BitcoinInfo {
    /// Overall status of the bitcoind JSON-RPC connection.
    pub status: BitcoinStatus,
    /// Blockchain name (e.g. bitcoin, testnet, regtest).
    pub chain: String,
    /// Current number of blocks.
    pub blocks: u64,
    /// Current number of headers.
    pub headers: u64,
    /// Verification progress (0.0 to 1.0).
    pub verification_progress: f64,
    /// Whether bitcoind is in initial block download.
    pub initial_block_download: bool,
    /// Number of connections to peers.
    pub connections: u64,
    /// Bitcoind version number.
    pub version: i64,
    /// Bitcoind subversion string.
    pub subversion: String,
    /// Any warnings reported by bitcoind.
    pub warnings: Option<String>,
}

impl BitcoinInfo {
    pub fn make_empty(status: BitcoinStatus, warnings: Option<String>) -> Self {
        Self {
            status: status,
            chain: String::new(),
            blocks: 0,
            headers: 0,
            verification_progress: 0.0,
            initial_block_download: false,
            connections: 0,
            version: 0,
            subversion: String::new(),
            warnings,
        }
    }
}

impl From<BitcoinRPCSnapshot> for BitcoinInfo {
    fn from(value: BitcoinRPCSnapshot) -> Self {
        Self {
            status: BitcoinStatus::Ok,
            chain: value.chain,
            blocks: value.blocks,
            headers: value.headers,
            verification_progress: value.verification_progress,
            initial_block_download: value.initial_block_download,
            connections: value.connections,
            version: value.version,
            subversion: value.subversion,
            warnings: value.warnings,
        }
    }
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct HealthResponse {
    /// Overall status of the CoreLightning node.
    pub lightning: LightningInfo,
    /// Overall status of the bitcoind JSON-RPC connection.
    pub bitcoin: BitcoinInfo,
    /// Minimum withdrawable amount in millisatoshis.
    pub min_withdrawable_msat: u64,
    /// Maximum withdrawable amount in millisatoshis.
    pub max_withdrawable_msat: u64,
    /// Warning message when bitcoind is not in sync (may be absent).
    pub warning_bitcoind_sync: Option<String>,
    /// Warning message when lightningd is not in sync (may be absent).
    pub warning_lightningd_sync: Option<String>,
}

type Ret = ApiResponse<HealthResponse>;

#[utoipa::path(
    get,
    path = "/health",
    tag = "ln-gateway",
    operation_id = "health",
    responses(
        (status = 200, description = "Gateway and CoreLightning status", body = HealthResponse),
        (status = 502, description = "The CoreLightning node encountered an error")
    )
)]
pub(super) async fn handler(State(state): State<Arc<Context>>) -> Ret {
    let mut rpc = state.cln_client.lock().await;

    let cln_info = match rpc.call_typed(&GetinfoRequest {}).await {
        Ok(r) => r,
        Err(e) => return api_error::build(StatusCode::BAD_GATEWAY, e.to_string()),
    };

    let btc_info = if !state.btc_client.is_configured() {
        BitcoinInfo::make_empty(
            BitcoinStatus::NotConfigured,
            Some("Bitcoin RPC credentials not configured".to_string()),
        )
    } else {
        match state.btc_client.get_snapshot() {
            Ok(snapshot) => BitcoinInfo::from(snapshot),
            Err(e) => {
                tracing::warn!("Bitcoin RPC error: {:#}", e);
                BitcoinInfo::make_empty(BitcoinStatus::Unreachable, Some(e.to_string()))
            }
        }
    };

    let status = HealthResponse {
        lightning: LightningInfo::from(cln_info.clone()),
        bitcoin: btc_info,
        min_withdrawable_msat: state.args.min_withdrawable_msat,
        max_withdrawable_msat: state.args.max_withdrawable_msat,
        warning_bitcoind_sync: cln_info.warning_bitcoind_sync,
        warning_lightningd_sync: cln_info.warning_lightningd_sync,
    };

    ApiResponse::make_ok(status)
}
