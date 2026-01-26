use std::sync::Arc;

use axum::extract::{Query, State};
use serde::Deserialize;

use crate::{
    context::Context, core::recent_request::entry::RecentRequestEntry, routes::ApiResponse,
};

pub(super) mod get {
    use super::*;

    #[derive(Debug, Deserialize, utoipa::IntoParams)]
    pub struct RecentRequestsQuery {
        /// Maximum number of entries returned (default: 15, max: 50).
        pub limit: Option<usize>,
    }

    type Ret = ApiResponse<Vec<RecentRequestEntry>>;

    #[utoipa::path(
    get,
    path = "/recent-requests",
    tag = "ln-gateway",
    operation_id = "recent_requests",
    params(RecentRequestsQuery),
    responses(
        (status = 200, description = "Most recent requests processed by the gateway", body = [RecentRequestEntry])
    )
)]
    pub async fn handler(
        State(state): State<Arc<Context>>,
        Query(q): Query<RecentRequestsQuery>,
    ) -> Ret {
        let limit = q.limit.unwrap_or(15).clamp(1, 50);

        let q = state.recent_requests.lock().await;
        let items: Vec<RecentRequestEntry> = q.iter().rev().take(limit).cloned().collect();
        ApiResponse::make_ok(items)
    }
}

pub(super) mod delete {
    use super::*;

    type Ret = ApiResponse<()>;

    #[utoipa::path(
    delete,
    path = "/recent-requests",
    tag = "ln-gateway",
    operation_id = "clear_recent_requests",
    responses(
        (status = 200, description = "Clears the recent requests log")
    )
    )]
    pub async fn handler(State(state): State<Arc<Context>>) -> Ret {
        let mut q = state.recent_requests.lock().await;
        q.clear();

        tracing::info!("Cleared recent requests log");
        ApiResponse::make_ok(())
    }
}
