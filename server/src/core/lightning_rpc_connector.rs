use std::path::Path;

use cln_rpc::ClnRpc;
use cln_rpc::model::{requests as clnreq, responses as clnresp};
use cln_rpc::primitives::{Amount, AmountOrAll, PublicKey};

pub struct LightningRPCConnector {
    rpc: ClnRpc,
    endpoint: String,
}

impl LightningRPCConnector {
    pub async fn connect_unix(rpc_sockpath: &Path) -> anyhow::Result<Self> {
        Ok(Self {
            rpc: ClnRpc::new(rpc_sockpath).await?,
            endpoint: format!("unix://{}", rpc_sockpath.display()),
        })
    }

    pub fn endpoint(&self) -> &str {
        &self.endpoint
    }

    pub async fn getinfo(&mut self) -> anyhow::Result<clnresp::GetinfoResponse> {
        let info = self.rpc.call_typed(&clnreq::GetinfoRequest {}).await?;
        Ok(info)
    }

    pub async fn fundchannel(
        &mut self,
        remote_id: PublicKey,
        amount_sat: u64,
        announce: Option<bool>,
    ) -> anyhow::Result<clnresp::FundchannelResponse> {
        let req = clnreq::FundchannelRequest {
            id: remote_id,
            amount: AmountOrAll::Amount(Amount::from_sat(amount_sat)),
            announce,
            feerate: None,
            minconf: None,
            utxos: None,
            mindepth: None,
            push_msat: None,
            close_to: None,
            request_amt: None,
            reserve: None,
            compact_lease: None,
            channel_type: None,
        };

        let res = self.rpc.call_typed(&req).await?;
        Ok(res)
    }

    pub async fn withdraw(
        &mut self,
        destination: String,
        amount_sat: u64,
    ) -> anyhow::Result<clnresp::WithdrawResponse> {
        let req = clnreq::WithdrawRequest {
            destination,
            satoshi: AmountOrAll::Amount(Amount::from_sat(amount_sat)),
            feerate: None,
            minconf: None,
            utxos: None,
        };

        let res: clnresp::WithdrawResponse = self.rpc.call_typed(&req).await?;
        Ok(res)
    }
}
