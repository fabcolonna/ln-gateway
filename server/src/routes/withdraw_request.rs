use std::sync::Arc;

use axum::extract::{Request, State};
use serde::Serialize;

use crate::{context::Context, core::utils, routes::ApiResponse};

#[derive(Serialize, utoipa::ToSchema)]
pub(super) struct WithdrawRequestResponse {
    /// Type of request, must be "withdrawRequest"
    tag: &'static str,
    /// Second-level URL to trigger WithdrawCallback
    callback: String,
    /// Unique identifier for this withdrawal request
    k1: String,
    /// Default description for the withdrawal invoice
    #[serde(rename = "defaultDescription")]
    default_description: &'static str,
    /// Minimum withdrawable amount in millisatoshis
    #[serde(rename = "minWithdrawable")]
    min_withdrawable: u64,
    /// Maximum withdrawable amount in millisatoshis
    #[serde(rename = "maxWithdrawable")]
    max_withdrawable: u64,
}

type Ret = ApiResponse<WithdrawRequestResponse>;

#[utoipa::path(
    get,
    path = "/withdraw-request",
    tag = "ln-gateway",
    operation_id = "withdrawRequest",
    responses(
        (status = 200, description = "LNURL Withdraw Request", body = WithdrawRequestResponse)
    )
)]
pub(super) async fn handler(State(state): State<Arc<Context>>, request: Request) -> Ret {
    let k1 = utils::gen_k1_as_string();

    // Store k1 for one-time validation
    {
        let mut set = state.withdrawal_keys_set.lock().await;
        set.insert(k1.clone());
    }

    let base_url = utils::request_base_url(&request, "0.0.0.0", state.args.listening_port);
    let response = WithdrawRequestResponse {
        default_description: "Withdraw funds from CoreLightning REST server",
        tag: "withdrawRequest",
        callback: format!("{}/callbacks/withdraw-request", base_url),
        k1,
        min_withdrawable: state.args.min_withdrawable_msat,
        max_withdrawable: state.args.max_withdrawable_msat,
    };

    ApiResponse::make_ok(response)
}
