use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
};
use serde::{Deserialize, Serialize};

use cln_rpc::model::responses::WithdrawResponse;

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

impl From<WithdrawResponse> for IssueWithdrawResponse {
    fn from(res: WithdrawResponse) -> Self {
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
    path = "/callbacks/issue-withdraw",
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

    let mut rpc = state.cln_client.lock().await;
    let res = match rpc.withdraw(params.destination, amount).await {
        Ok(res) => res,
        Err(e) => {
            return api_error::build(StatusCode::BAD_GATEWAY, e.to_string());
        }
    };

    ApiResponse::make_ok(res.into())
}
