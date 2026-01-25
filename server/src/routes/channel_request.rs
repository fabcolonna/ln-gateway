use axum::{
    extract::{Request, State},
    http::StatusCode,
};
use serde::Serialize;
use std::sync::Arc;

use crate::{
    context::Context,
    core::utils,
    routes::{ApiResponse, api_error},
};

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct ChannelRequestResponse {
    /// Type of request, must be "channelRequest"
    tag: &'static str,
    /// Remote node address of form node_key@ip_address:port_number
    uri: String,
    /// Second-level URL to trigger OpenChannel
    callback: String,
    /// Wallet identifier
    k1: String,
}

type Ret = ApiResponse<ChannelRequestResponse>;

#[utoipa::path(
    get,
    path = "/channel-request",
    tag = "ln-gateway",
    operation_id = "channelRequest",
    responses(
        (status = 200, description = "LNURL Channel Request", body = ChannelRequestResponse),
        (status = 502, description = "The CoreLightning node encountered an error")
    )
)]
pub(super) async fn handler(State(state): State<Arc<Context>>, request: Request) -> Ret {
    let mut rpc = state.cln_client.lock().await;
    let info = match rpc.getinfo().await {
        Ok(r) => r,
        Err(e) => {
            return api_error::build(StatusCode::BAD_GATEWAY, e.to_string());
        }
    };

    let pubkey = info.id.to_string();
    let hostname = utils::extract_request_host(&request, &info);
    let base_url = utils::request_base_url(&request, &hostname, state.args.listening_port);

    let k1 = utils::gen_k1_as_string();
    {
        let mut set = state.channel_keys_set.lock().await;
        set.insert(k1.clone());
    }

    let response = ChannelRequestResponse {
        uri: format!("{}@{}:{}", pubkey, hostname, state.args.listening_port),
        callback: format!("{}/callbacks/open-channel", base_url),
        k1,
        tag: "channelRequest",
    };

    ApiResponse::make_ok(response)
}
