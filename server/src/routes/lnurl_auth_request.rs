use std::sync::Arc;

use axum::extract::{Query, Request, State};
use serde::{Deserialize, Serialize};

use crate::{context::Context, core::utils, routes::ApiResponse};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, utoipa::ToSchema)]
#[serde(rename_all = "lowercase")]
pub(super) enum LnUrlAuthRequestAction {
    Register,
    Login,
    Link,
    Auth,
}

#[derive(Debug, Deserialize, utoipa::ToSchema)]
pub(super) struct LnUrlAuthRequestQuery {
    /// Optional action enum: register | login | link | auth
    pub action: Option<LnUrlAuthRequestAction>,
}

#[derive(Debug, Serialize, utoipa::ToSchema)]
pub(super) struct LnUrlAuthRequestResponse {
    /// Type of request, must be "login" per LUD-04
    tag: &'static str,
    /// (32 bytes hex) One-time challenge
    k1: String,
    /// Callback URL to be called by the wallet with `sig` and `key`
    callback: String,
    /// Optional action hint for the wallet
    action: Option<LnUrlAuthRequestAction>,
}

type Ret = ApiResponse<LnUrlAuthRequestResponse>;

#[utoipa::path(
    get,
    path = "/lnurl-auth-request",
    tag = "ln-gateway",
    operation_id = "lnurlAuthRequest",
    params(
        ("action" = Option<LnUrlAuthRequestAction>, Query, description = "Optional action enum: register | login | link | auth")
    ),
    responses(
        (status = 200, description = "LNURL-auth challenge", body = LnUrlAuthRequestResponse)
    )
)]
pub(super) async fn handler(
    State(state): State<Arc<Context>>,
    Query(query): Query<LnUrlAuthRequestQuery>,
    request: Request,
) -> Ret {
    let k1 = utils::gen_k1_as_string();
    {
        let mut set = state.auth_pending_keys_set.lock().await;
        set.insert(k1.clone());
    }

    let base_url = utils::request_base_url(&request, "0.0.0.0", state.args.listening_port);
    ApiResponse::make_ok(LnUrlAuthRequestResponse {
        tag: "login",
        k1,
        callback: format!("{}/callbacks/lnurl-auth", base_url),
        action: query.action,
    })
}
