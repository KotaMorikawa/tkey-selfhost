import ThresholdKey from "@tkey/core";
import SFAServiceProvider from "@tkey/service-provider-sfa";
import TorusStorageLayer from "@tkey/storage-layer-torus";
import { ShareSerializationModule } from "@tkey/share-serialization";
import { WebStorageModule } from "@tkey/web-storage";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

if (!clientId) {
  throw new Error(
    "NEXT_PUBLIC_WEB3AUTH_CLIENT_ID is not set in environment variables"
  );
}

const rpcTarget = process.env.NEXT_PUBLIC_RPC_TARGET;

if (!rpcTarget) {
  throw new Error("NEXT_PUBLIC_RPC_TARGET is not set in environment variables");
}

const chainConfig = {
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID || "0xaa36a7",
  rpcTarget: rpcTarget,
  displayName: process.env.NEXT_PUBLIC_CHAIN_DISPLAY_NAME || "sepolia",
  blockExplorer:
    process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.etherscan.io/",
  ticker: process.env.NEXT_PUBLIC_CHAIN_TICKER || "ETH",
  tickerName: process.env.NEXT_PUBLIC_CHAIN_TICKER_NAME || "Ethereum",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const web3AuthOptions: any = {
  clientId,
  chainConfig,
  web3AuthNetwork:
    process.env.NEXT_PUBLIC_WEB3AUTH_NETWORK || "sapphire_mainnet",
};

// Configuration of Service Provider
const serviceProvider = new SFAServiceProvider({ web3AuthOptions });

export const ethereumPrivateKeyProvider = new EthereumPrivateKeyProvider({
  config: {
    chainConfig,
  },
});

const torusHostUrl = process.env.NEXT_PUBLIC_TORUS_HOST_URL;

if (!torusHostUrl) {
  throw new Error(
    "NEXT_PUBLIC_TORUS_HOST_URL is not set in environment variables"
  );
}

// Instantiation of Storage Layer
const storageLayer = new TorusStorageLayer({
  hostUrl: torusHostUrl,
});

// Configuration of Modules
const webStorageModule = new WebStorageModule();
const shareSerializationModule = new ShareSerializationModule();

// Instantiation of tKey
export const tKey = new ThresholdKey({
  serviceProvider,
  storageLayer,
  modules: {
    shareSerialization: shareSerializationModule,
    webStorage: webStorageModule,
  },
});
