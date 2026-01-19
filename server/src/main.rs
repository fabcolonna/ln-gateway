use std::{net::Ipv4Addr, net::SocketAddr};

use axum::Router;
use tokio::net::TcpListener;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;

use ln_server::routes;
use ln_server::{context, core, openapi};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let args = core::cli::Args::new();

    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, args.listening_port));
    let ctx = context::Context::new(args.clone()).await;

    let swagger =
        SwaggerUi::new("/swagger-ui").url("/api-doc/openapi.json", openapi::ApiDoc::openapi());

    let router = Router::new()
        .merge(swagger)
        .merge(routes::get_router())
        .with_state(ctx)
        .into_make_service(); // Convert the router into a service that can be used by axum

    let listener = TcpListener::bind(&addr).await.unwrap();

    tracing::info!("REST server listening on port {}", args.listening_port);
    axum::serve(listener, router).await.unwrap();
}
