use std::sync::Arc;

use axum::{extract::State, http::StatusCode};
use cln_rpc::model::requests::GetinfoRequest;
use serde::{Deserialize, Serialize};

use crate::{
    context::Context,
    routes::{ApiResponse, api_error},
};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "lowercase")]
pub(super) enum HealthStatus {
    Ok,
    Syncing,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct HealthResponse {
    /// Human-readable overall status; clients treat ok/healthy/ready as operational.
    pub status: HealthStatus,
    /// Network name as reported by CoreLightning (e.g. bitcoin, testnet, regtest).
    pub network: String,
    /// Current block height as reported by CoreLightning.
    pub blockheight: u32,
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
    let mut rpc = state.client.lock().await;
    let info = match rpc.call_typed(&GetinfoRequest {}).await {
        Ok(r) => r,
        Err(e) => return api_error::build(StatusCode::BAD_GATEWAY, e.to_string()),
    };

    let is_syncing = info.warning_bitcoind_sync.is_some() || info.warning_lightningd_sync.is_some();
    let status = if is_syncing {
        HealthStatus::Syncing
    } else {
        HealthStatus::Ok
    };

    ApiResponse::make_ok(HealthResponse {
        status,
        network: info.network,
        blockheight: info.blockheight,
        alias: info.alias,
        pubkey: info.id.to_string(),
        cln_version: info.version,
        num_peers: info.num_peers,
        num_active_channels: info.num_active_channels,
        num_pending_channels: info.num_pending_channels,
        min_withdrawable_msat: state.args.min_withdrawable_msat,
        max_withdrawable_msat: state.args.max_withdrawable_msat,
        warning_bitcoind_sync: info.warning_bitcoind_sync,
        warning_lightningd_sync: info.warning_lightningd_sync,
    })
}
