import {
  buildUrlWithQuery,
  getJsonFromUrl,
  type QueryValue,
} from "../utils/http";

export { useRemoteBaseUrl } from "../hooks/useRemoteBaseUrl";

type WithdrawRequest = {
  k1: string;
  callback: string;
};

type ChannelRequest = {
  k1: string;
  callback: string;
};

type LnUrlAuthRequest = {
  k1: string;
  callback: string;
  action?: string;
};

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.trim().replace(/\/+$/, "");
}

function joinUrl(baseUrl: string, path: string) {
  const base = normalizeBaseUrl(baseUrl);
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export function createRemoteApi(baseUrl: string) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    baseUrl: normalizedBaseUrl,

    async withdrawRequest() {
      return getJsonFromUrl<WithdrawRequest>(
        joinUrl(normalizedBaseUrl, "/withdraw-request")
      );
    },

    async channelRequest() {
      return getJsonFromUrl<ChannelRequest>(
        joinUrl(normalizedBaseUrl, "/channel-request")
      );
    },

    async lnurlAuthRequest(action?: string) {
      return getJsonFromUrl<LnUrlAuthRequest>(
        buildUrlWithQuery(joinUrl(normalizedBaseUrl, "/lnurl-auth-request"), {
          action,
        })
      );
    },

    async callCallback(callbackUrl: string, query: Record<string, QueryValue>) {
      const url = buildUrlWithQuery(callbackUrl, query);
      return getJsonFromUrl<unknown>(url);
    },
  };
}

export type RemoteApi = ReturnType<typeof createRemoteApi>;
