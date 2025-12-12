use axum::{
    Json,
    http::StatusCode,
    response::{IntoResponse, Response},
};
use serde::Serialize;

pub mod callbacks;
pub mod channel_request;
pub mod withdraw_request;

// TYPES

#[derive(Debug)]
pub enum ApiResponse<T> {
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
// tuples from handlers, this implementation will not be used. Therefore, we changed the
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

pub mod api_error {
    use crate::routes::ApiResponse;
    use axum::http::StatusCode;

    pub fn build<T>(status: StatusCode, message: impl Into<String>) -> ApiResponse<T> {
        ApiResponse::Err {
            status,
            message: message.into(),
        }
    }
}
