use crate::core::cli::Args;

use cln_rpc::ClnRpc;
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct Context {
    pub args: Args,
    pub client: Mutex<ClnRpc>,

    // Set of active withdrawal keys for LUD-03 withdraw requests
    pub withdrawal_keys_set: Mutex<HashSet<String>>,
}

impl Context {
    pub async fn new(args: Args) -> Arc<Self> {
        match cln_rpc::ClnRpc::new(&args.rpc_sockpath).await {
            Ok(client) => {
                let ctx = Arc::new(Context {
                    args,
                    client: Mutex::new(client),
                    withdrawal_keys_set: Mutex::new(HashSet::new()),
                });

                tracing::info!(
                    "Connected to CoreLightning RPC at {}",
                    &ctx.args.rpc_sockpath
                );

                ctx
            }
            Err(e) => {
                tracing::error!("Could not connect to {}: {}", args.rpc_sockpath, e);
                std::process::exit(1);
            }
        }
    }
}
