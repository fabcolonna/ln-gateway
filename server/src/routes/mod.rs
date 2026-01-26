use std::sync::Arc;

use axum::http::Uri;
use axum::routing::delete;
use axum::{
    Json, Router,
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
};
use serde::Serialize;
use utoipa::OpenApi;

use crate::context::Context;

pub mod callbacks;
mod channel_request;
mod health;
mod lnurl_auth_request;
mod recent_requests;
mod withdraw_request;

// TYPES

#[derive(Debug)]
enum ApiResponse<T> {
    Ok { status: StatusCode, data: T },
    Err { status: StatusCode, message: String },
}

impl<T> ApiResponse<T> {
    pub fn make_ok(data: T) -> Self {
        ApiResponse::Ok {
            status: StatusCode::OK,
            data,
        }
    }
}

// The IntoResponse is needed to convert ApiResponse<T> into an HTTP response.
// This function is called automatically by axum when returning ApiResponse<T> from
// a handler. In this implementation, we convert the ApiResponse<T> into a JSON response.

// Axum calls into_response for tuples like (StatusCode, ApiResponse<T>). If we return such
// tuples from handlers (endpoints), this implementation will not be used. Therefore, we changed the
// handlers to return ApiResponse<T> directly, and this implementation will be used.
// Axum will then convert ApiResponse<T> into an HTTP response using this implementation.

// The Serialize bound is required to serialize the data into JSON, hence we need it only here.
impl<T> IntoResponse for ApiResponse<T>
where
    T: Serialize,
{
    fn into_response(self) -> Response {
        // We don't want to return Success/Err in the JSON, so we match and return only the inner value.
        match self {
            ApiResponse::Ok { status, data } => (status, Json(data)).into_response(),
            ApiResponse::Err { status, message } => {
                let json = serde_json::json!({
                    "status": status.as_u16(),
                    "error": message
                });

                (status, Json(json)).into_response()
            }
        }
    }
}

mod api_error {
    use crate::routes::ApiResponse;
    use axum::http::StatusCode;

    pub fn build<T>(status: StatusCode, message: impl Into<String>) -> ApiResponse<T> {
        ApiResponse::Err {
            status,
            message: message.into(),
        }
    }
}

// PUBLIC METHODS

pub fn get_router() -> Router<Arc<Context>> {
    Router::new()
        .route("/health", get(health::handler))
        .route("/recent-requests", get(recent_requests::get::handler))
        .route("/recent-requests", delete(recent_requests::delete::handler))
        .route("/channel-request", get(channel_request::handler))
        .route("/withdraw-request", get(withdraw_request::handler))
        .route("/lnurl-auth-request", get(lnurl_auth_request::handler))
        .nest("/callbacks", callbacks::get_router())
}

pub async fn not_found(uri: Uri) -> Response {
    let json = serde_json::json!({
        "status": StatusCode::NOT_FOUND.as_u16(),
        "error": format!("Route not found: {}", uri.path()),
    });
    (StatusCode::NOT_FOUND, Json(json)).into_response()
}

#[derive(OpenApi)]
#[openapi(
    paths(
        health::handler,
        recent_requests::get::handler,
        recent_requests::delete::handler,
        channel_request::handler,
        withdraw_request::handler,
        lnurl_auth_request::handler,
    ),
    components(
        schemas(
            health::BitcoinStatus,
            health::BitcoinInfo,
            health::LightningStatus,
            health::LightningInfo,
            health::HealthResponse,
            crate::core::recent_request::entry::RecentRequestEntry,
            channel_request::ChannelRequestResponse,
            withdraw_request::WithdrawRequestResponse,
            lnurl_auth_request::LnUrlAuthRequestResponse,
            lnurl_auth_request::LnUrlAuthRequestAction,
            lnurl_auth_request::LnUrlAuthRequestQuery,
        )
    ),
    tags(
        (name = "ln-gateway", description = "CoreLightning REST gateway")
    )
)]
pub struct CoreApiDoc;
