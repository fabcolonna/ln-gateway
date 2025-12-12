use clap::Parser;

#[derive(Parser, Clone)]
#[command(
    name = "CoreLightning REST Server",
    version = "0.1.0",
    about = "Expose CoreLightning functionality over REST API"
)]
pub struct Args {
    #[arg(
        long,
        env = "LNS_CL_RPC_PATH",
        help = "Path to the CoreLightning RPC socket"
    )]
    pub rpc_sockpath: String,

    #[arg(
        short,
        long,
        env = "LNS_PORT",
        help = "Port for the REST server to listen on",
        default_value = "3000"
    )]
    pub listening_port: u16,

    #[arg(
        long,
        env = "LNS_MIN_WITHDRAWABLE_MSAT",
        help = "Minimum withdrawable amount in millisatoshis",
        default_value = "1000"
    )]
    pub min_withdrawable_msat: u64,

    #[arg(
        long,
        env = "LNS_MAX_WITHDRAWABLE_MSAT",
        help = "Maximum withdrawable amount in millisatoshis",
        default_value = "100000"
    )]
    pub max_withdrawable_msat: u64,
}

impl Args {
    pub fn new() -> Self {
        // Load variables from a .env file if present before parsing CLI args
        let _ = dotenvy::dotenv();
        Args::parse()
    }
}
