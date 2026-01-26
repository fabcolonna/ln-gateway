use std::{net::Ipv4Addr, net::SocketAddr};

use axum::Router;
use axum::http::Method;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::EnvFilter;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use ln_server::routes;
use ln_server::{context, core, openapi};

#[tokio::main]
async fn main() {
    let default_level = if cfg!(debug_assertions) {
        "debug"
    } else {
        "info"
    };
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        EnvFilter::new(format!(
            "ln_server={default_level},tower_http={default_level},axum={default_level}"
        ))
    });

    tracing_subscriber::fmt().with_env_filter(env_filter).init();

    let args = core::cli::Args::new();

    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, args.listening_port));
    let ctx = context::Context::new(args.clone()).await;

    let swagger =
        SwaggerUi::new("/swagger-ui").url("/api-doc/openapi.json", openapi::ApiDoc::openapi());

    // Only allow CORS in debug mode for easier testing with local frontends. In deployment,
    // CORS should be handled by a reverse proxy or not needed at all.
    let cors = if cfg!(debug_assertions) {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods([Method::GET, Method::DELETE, Method::OPTIONS])
            .allow_headers(Any)
    } else {
        CorsLayer::new()
    };

    let request_log_middleware = axum::middleware::from_fn_with_state(
        ctx.clone(),
        ln_server::core::recent_request::middleware::middleware,
    );

    let router = Router::new()
        .merge(swagger)
        .merge(routes::get_router())
        .fallback(routes::not_found)
        .with_state(ctx.clone())
        .layer(request_log_middleware)
        .layer(cors)
        .into_make_service_with_connect_info::<SocketAddr>(); // Enables ConnectInfo<SocketAddr>

    let listener = TcpListener::bind(&addr).await.unwrap();

    tracing::info!("REST server listening on port {}", args.listening_port);
    axum::serve(listener, router).await.unwrap();
}
