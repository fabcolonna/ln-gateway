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

#[derive(Deserialize, Debug, utoipa::ToSchema)]
pub(super) struct IssueWithdrawRequest {
    pub k1: String,
    pub destination: String,
    pub amount: Option<u64>,
}

#[derive(Serialize, utoipa::ToSchema)]
pub(super) struct IssueWithdrawResponse {
    pub tx: String,
    pub psbt: String,
    pub txid: String,
}

impl From<cln_rpc::model::responses::WithdrawResponse> for IssueWithdrawResponse {
    fn from(res: cln_rpc::model::responses::WithdrawResponse) -> Self {
        Self {
            tx: res.tx,
            psbt: res.psbt,
            txid: res.txid,
        }
    }
}

type Ret = ApiResponse<IssueWithdrawResponse>;

#[utoipa::path(
    get,
    path = "/callbacks/withdraw-request",
    tag = "ln-gateway",
    operation_id = "withdraw",
    params(
        ("k1" = String, Query, description = "One-time token from /withdraw-request"),
        ("destination" = String, Query, description = "Bitcoin address (or other supported withdraw destination)"),
        ("amount" = Option<u64>, Query, description = "Withdraw amount in satoshis")
    ),
    responses(
        (status = 200, description = "Withdraw result", body = IssueWithdrawResponse)
    )
)]
pub(super) async fn handler(
    State(state): State<Arc<Context>>,
    Query(params): Query<IssueWithdrawRequest>,
) -> Ret {
    {
        let mut set = state.withdrawal_keys_set.lock().await;
        if !set.remove(&params.k1) {
            return api_error::build(StatusCode::BAD_REQUEST, "invalid or already used k1");
        }
    }

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
