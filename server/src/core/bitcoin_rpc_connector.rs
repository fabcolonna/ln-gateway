use anyhow::Context as AnyhowContext;
use jsonrpc::client::Client as JsonRpcClient;
use serde::Deserialize;
use serde::de::DeserializeOwned;
use serde_json::Value as JsonValue;

pub struct BitcoinRPCSnapshot {
    pub chain: String,
    pub blocks: u64,
    pub headers: u64,
    pub verification_progress: f64,
    pub initial_block_download: bool,
    pub connections: u64,
    pub version: i64,
    pub subversion: String,
    pub warnings: Option<String>,
}

pub struct BitcoinRPCConnector {
    client: JsonRpcClient,
    configured: bool,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
enum WarningsField {
    String(String),
    Array(Vec<String>),
    ArrayAny(Vec<JsonValue>),
    Other(JsonValue),
}

impl WarningsField {
    fn into_optional_string(self) -> Option<String> {
        match self {
            WarningsField::String(s) => {
                let trimmed = s.trim();
                if trimmed.is_empty() {
                    None
                } else {
                    Some(trimmed.to_string())
                }
            }
            WarningsField::Array(items) => {
                let cleaned: Vec<String> = items
                    .into_iter()
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .collect();
                if cleaned.is_empty() {
                    None
                } else {
                    Some(cleaned.join(" · "))
                }
            }
            WarningsField::ArrayAny(items) => {
                let cleaned: Vec<String> = items
                    .into_iter()
                    .filter(|v| !v.is_null())
                    .map(|v| match v {
                        JsonValue::String(s) => s.trim().to_string(),
                        other => other.to_string(),
                    })
                    .filter(|s| !s.is_empty())
                    .collect();
                if cleaned.is_empty() {
                    None
                } else {
                    Some(cleaned.join(" · "))
                }
            }
            WarningsField::Other(v) => {
                if v.is_null() {
                    None
                } else {
                    Some(v.to_string())
                }
            }
        }
    }
}

#[derive(Debug, Deserialize)]
struct BlockchainInfoLite {
    chain: String,
    blocks: u64,
    headers: u64,
    #[serde(rename = "verificationprogress")]
    verification_progress: f64,
    #[serde(rename = "initialblockdownload")]
    initial_block_download: bool,
    #[serde(default)]
    warnings: Option<WarningsField>,
}

#[derive(Debug, Deserialize)]
struct NetworkInfoLite {
    version: i64,
    subversion: String,
    #[serde(default)]
    warnings: Option<WarningsField>,
}

impl BitcoinRPCConnector {
    pub fn new(url: String, user: Option<String>, pass: Option<String>) -> Self {
        let configured = user.is_some() && pass.is_some();
        Self {
            client: JsonRpcClient::new(url, user, pass),
            configured,
        }
    }

    /// Returns true if the Bitcoin RPC connector is properly configured with credentials.
    pub fn is_configured(&self) -> bool {
        self.configured
    }

    /// Sends a ping request to the Bitcoin RPC server to check connectivity.
    pub fn ping(&self) -> Result<(), jsonrpc::Error> {
        let request = self.client.build_request("ping".to_string(), vec![]);
        self.client
            .send_request(&request)
            .and_then(|r| r.check_error())
    }

    /// Retrieves a snapshot of the current Bitcoin RPC status.
    pub fn get_snapshot(&self) -> anyhow::Result<BitcoinRPCSnapshot> {
        let connections: u64 = self.call_rpc("getconnectioncount")?;
        let chaininfo: BlockchainInfoLite = self.call_rpc("getblockchaininfo")?;
        let netinfo: NetworkInfoLite = self.call_rpc("getnetworkinfo")?;

        let warnings = merge_warnings([
            chaininfo.warnings.map(WarningsField::into_optional_string),
            netinfo.warnings.map(WarningsField::into_optional_string),
        ]);

        Ok(BitcoinRPCSnapshot {
            chain: chaininfo.chain,
            blocks: chaininfo.blocks,
            headers: chaininfo.headers,
            verification_progress: chaininfo.verification_progress,
            initial_block_download: chaininfo.initial_block_download,
            connections,
            version: netinfo.version,
            subversion: netinfo.subversion,
            warnings,
        })
    }

    /// Calls a Bitcoin RPC method and deserializes the result.
    fn call_rpc<T: DeserializeOwned>(&self, method: &str) -> anyhow::Result<T> {
        let request = self.client.build_request(method.to_string(), vec![]);
        let response = self
            .client
            .send_request(&request)
            .with_context(|| format!("bitcoin rpc call failed: {method}"))?;
        response
            .into_result::<T>()
            .with_context(|| format!("bitcoin rpc response decode failed: {method}"))
    }
}

fn merge_warnings(values: impl IntoIterator<Item = Option<Option<String>>>) -> Option<String> {
    let parts: Vec<String> = values
        .into_iter()
        .flatten()
        .flatten()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if parts.is_empty() {
        None
    } else {
        Some(parts.join(" · "))
    }
}
