use axum::{
    extract::{Request, State},
    http::StatusCode,
};
use cln_rpc::model::requests::GetinfoRequest;
use serde::Serialize;
use std::sync::Arc;

use crate::{
    context::Context,
    routes::{ApiResponse, api_error},
    utils,
};

#[derive(Debug, Serialize)]
pub struct ChannelRequestResponse {
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

pub async fn handler(State(state): State<Arc<Context>>, request: Request) -> Ret {
    let mut rpc = state.client.lock().await;
    let info = match rpc.call_typed(&GetinfoRequest {}).await {
        Ok(r) => r,
        Err(e) => {
            return api_error::build(StatusCode::BAD_GATEWAY, e.to_string());
        }
    };

    let pubkey = info.id.to_string();
    let hostname = utils::extract_request_host(&request, &info);
    let response = ChannelRequestResponse {
        uri: format!("{}@{}:{}", pubkey, hostname, state.args.listening_port),
        callback: "/open_channel".to_string(),
        k1: utils::gen_k1_as_string(),
        tag: "channelRequest",
    };

    ApiResponse::make_ok(response)
}
