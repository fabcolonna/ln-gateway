use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
};
use cln_rpc::primitives::{Amount, AmountOrAll};
use serde::{Deserialize, Serialize};

use crate::{
    context::Context,
    routes::{ApiResponse, api_error},
};

#[derive(Deserialize, Debug)]
pub struct WithdrawRequest {
    pub destination: String,
    pub amount: Option<u64>,
}

#[derive(Serialize)]
pub struct WithdrawResponse {
    pub tx: String,
    pub psbt: String,
    pub txid: String,
}

impl From<cln_rpc::model::responses::WithdrawResponse> for WithdrawResponse {
    fn from(res: cln_rpc::model::responses::WithdrawResponse) -> Self {
        Self {
            tx: res.tx,
            psbt: res.psbt,
            txid: res.txid,
        }
    }
}

type Ret = ApiResponse<WithdrawResponse>;

pub async fn handler(
    State(state): State<Arc<Context>>,
    Query(params): Query<WithdrawRequest>,
) -> Ret {
    let amount = params.amount.unwrap_or(0);

    let req = cln_rpc::model::requests::WithdrawRequest {
        destination: params.destination,
        satoshi: AmountOrAll::Amount(Amount::from_sat(amount)),
        feerate: None,
        minconf: None,
        utxos: None,
    };

    let mut rpc = state.client.lock().await;
    let res = match rpc.call_typed(&req).await {
        Ok(res) => res,
        Err(e) => {
            return api_error::build(StatusCode::BAD_GATEWAY, e.to_string());
        }
    };

    ApiResponse::make_ok(res.into())
}
