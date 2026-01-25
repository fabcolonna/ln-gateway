use crate::core::cli::Args;

use std::collections::{HashMap, HashSet};
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::core::bitcoin_rpc_connector::BitcoinRPCConnector;
use crate::core::lightning_rpc_connector::LightningRPCConnector;

pub struct Context {
    pub args: Args,

    pub btc_client: BitcoinRPCConnector,
    pub cln_client: Mutex<LightningRPCConnector>,

    // Set of active withdrawal keys for LUD-03 withdraw requests
    pub withdrawal_keys_set: Mutex<HashSet<String>>,

    // Set of active channel request keys (k1) for LNURL-channel callbacks
    pub channel_keys_set: Mutex<HashSet<String>>,

    // LNURL-auth: pending k1 challenges and completed auth (k1 -> pubkey hex)
    pub auth_pending_keys_set: Mutex<HashSet<String>>,
    pub auth_completed: Mutex<HashMap<String, String>>,
}

impl Context {
    pub async fn new(args: Args) -> Arc<Self> {
        let bitcoin = BitcoinRPCConnector::new(
            args.btc_rpc_url.clone(),
            args.btc_rpc_user.clone(),
            args.btc_rpc_password.clone(),
        );

        if !bitcoin.is_configured() {
            tracing::warn!("Bitcoin RPC credentials not configured");
        } else if let Err(e) = bitcoin.ping() {
            tracing::warn!(
                "Could not connect to Bitcoin RPC at {}: {:?}",
                args.btc_rpc_url,
                e
            );
        }

        let sock = args.rpc_sockpath.as_ref().expect("rpc_sockpath required");
        let cln_client = LightningRPCConnector::connect_unix(sock).await;

        match cln_client {
            Ok(cln_client) => {
                let ctx = Arc::new(Context {
                    args,
                    btc_client: bitcoin,
                    cln_client: Mutex::new(cln_client),
                    withdrawal_keys_set: Mutex::new(HashSet::new()),
                    channel_keys_set: Mutex::new(HashSet::new()),
                    auth_pending_keys_set: Mutex::new(HashSet::new()),
                    auth_completed: Mutex::new(HashMap::new()),
                });

                tracing::info!(
                    "Connected to CoreLightning RPC at {}",
                    ctx.cln_client.lock().await.endpoint()
                );

                ctx
            }
            Err(e) => {
                tracing::error!("Could not connect to CLN RPC: {}", e);
                std::process::exit(1);
            }
        }
    }
}
