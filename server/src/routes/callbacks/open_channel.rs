use std::str::FromStr;
use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
};
use cln_rpc::model::requests::FundchannelRequest;
use cln_rpc::primitives::{Amount, AmountOrAll, PublicKey};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::context::Context;
use crate::routes::{ApiResponse, api_error};

#[derive(Deserialize, Debug)]
pub struct OpenChannelRequest {
    pub remote_id: String,
    pub amount: Option<u64>,
    pub announce: Option<bool>,
}

#[derive(Serialize)]
pub struct OpenChannelResponse {
    pub ok: bool,
    pub result: Option<Value>,
    pub error: Option<String>,
}

type Ret = ApiResponse<OpenChannelResponse>;

pub async fn handler(
    State(state): State<Arc<Context>>,
    Query(params): Query<OpenChannelRequest>,
) -> Ret {
    let id = match PublicKey::from_str(&params.remote_id) {
        Ok(id) => id,
        Err(e) => {
            return api_error::build(StatusCode::BAD_REQUEST, format!("invalid pubkey: {}", e));
        }
    };

    let amount = params.amount.unwrap_or(0);

    let req = FundchannelRequest {
        id,
        amount: AmountOrAll::Amount(Amount::from_sat(amount)),
        announce: params.announce,
        feerate: None,
        minconf: None,
        utxos: None,
        mindepth: None,
        push_msat: None,
        close_to: None,
        request_amt: None,
        reserve: None,
        compact_lease: None,
        channel_type: None,
    };

    let mut rpc = state.client.lock().await;
    let res = match rpc.call_typed(&req).await {
        Ok(res) => res,
        Err(e) => {
            return api_error::build(StatusCode::BAD_GATEWAY, e.to_string());
        }
    };

    let json_value =
        serde_json::to_value(&res).unwrap_or_else(|_| Value::String(format!("{:?}", res)));

    ApiResponse::make_ok(OpenChannelResponse {
        ok: true,
        result: Some(json_value),
        error: None,
    })
}
