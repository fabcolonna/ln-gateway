use std::sync::Arc;

use axum::{Router, routing::get};
use utoipa::OpenApi;

use crate::context::Context;

mod issue_withdraw;
mod lnurl_auth;
mod open_channel;

pub(super) fn get_router() -> Router<Arc<Context>> {
    Router::new()
        .route("/open-channel", get(open_channel::handler))
        .route("/issue-withdraw", get(issue_withdraw::handler))
        .route("/lnurl-auth", get(lnurl_auth::handler))
}

#[derive(OpenApi)]
#[openapi(
    paths(
        open_channel::handler,
        issue_withdraw::handler,
        lnurl_auth::handler,
    ),
    components(
        schemas(
            open_channel::OpenChannelRequest,
            open_channel::OpenChannelResponse,
            issue_withdraw::IssueWithdrawRequest,
            issue_withdraw::IssueWithdrawResponse,
            lnurl_auth::LnUrlAuthQuery,
            lnurl_auth::LnUrlAuthResponse,
        )
    ),
    tags(
        (name = "ln-gateway", description = "CoreLightning REST gateway")
    )
)]
pub struct CallbackApiDoc;
