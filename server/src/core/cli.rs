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

    #[arg(
        long,
        env = "LNS_BTC_RPC_URL",
        help = "Bitcoin Core JSON-RPC URL",
        default_value = "http://127.0.0.1:48332"
    )]
    pub btc_rpc_url: String,

    #[arg(
        long,
        env = "LNS_BTC_RPC_USER",
        help = "Bitcoin Core JSON-RPC username"
    )]
    pub btc_rpc_user: Option<String>,

    #[arg(
        long,
        env = "LNS_BTC_RPC_PASSWORD",
        help = "Bitcoin Core JSON-RPC password"
    )]
    pub btc_rpc_password: Option<String>,
}

impl Args {
    pub fn new() -> Self {
        // Load variables from a .env file if present before parsing CLI args
        let _ = dotenvy::dotenv();
        let mut args = Args::parse();

        // dotenv + clap treat `VAR=` as "present but empty", which becomes `Some("")` for
        // `Option<String>`. For RPC auth we want empty strings to behave like "not set".
        let user = args.btc_rpc_user.take().filter(|v| !v.trim().is_empty());
        let pass = args
            .btc_rpc_password
            .take()
            .filter(|v| !v.trim().is_empty());

        // Only accept credentials when both are set.
        (args.btc_rpc_user, args.btc_rpc_password) = match (user, pass) {
            (Some(user), Some(pass)) => (Some(user), Some(pass)),
            _ => (None, None),
        };

        args
    }
}
