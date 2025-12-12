mod context;
mod core;
mod routes;
mod utils;

use std::{net::Ipv4Addr, net::SocketAddr};

use axum::{Router, routing::get};
use tokio::net::TcpListener;

use crate::routes::{callbacks, channel_request, withdraw_request};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    let args = core::cli::Args::new();

    let addr = SocketAddr::from((Ipv4Addr::UNSPECIFIED, args.listening_port));
    let ctx = context::Context::new(args.clone()).await;

    let router = Router::new()
        .route("/channel-request", get(channel_request::handler))
        .route("/withdraw-request", get(withdraw_request::handler))
        .route(
            "/callbacks/open-channel",
            get(callbacks::open_channel::handler),
        )
        .route(
            "/callbacks/withdraw-request",
            get(callbacks::withdraw_request::handler),
        )
        .with_state(ctx)
        .into_make_service(); // Convert the router into a service that can be used by axum

    let listener = TcpListener::bind(&addr).await.unwrap();

    tracing::info!("REST server listening on port {}", args.listening_port);
    axum::serve(listener, router).await.unwrap();
}
