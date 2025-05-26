"use client";

import { Web3 } from "web3";
import { IProvider } from "@web3auth/base";

export const useWeb3 = () => {
  const getAccounts = async (provider: IProvider) => {
    if (!provider) {
      throw new Error("provider not initialized yet");
    }
    const web3 = new Web3(provider as unknown as IProvider);
    const address = await web3.eth.getAccounts();
    return address;
  };

  const getBalance = async (provider: IProvider) => {
    if (!provider) {
      throw new Error("provider not initialized yet");
    }
    const web3 = new Web3(provider as unknown as IProvider);
    const address = (await web3.eth.getAccounts())[0];
    const balance = web3.utils.fromWei(
      await web3.eth.getBalance(address),
      "ether"
    );
    return balance;
  };

  const signMessage = async (provider: IProvider) => {
    if (!provider) {
      throw new Error("provider not initialized yet");
    }
    const web3 = new Web3(provider as unknown as IProvider);
    const fromAddress = (await web3.eth.getAccounts())[0];
    const originalMessage = "YOUR_MESSAGE";

    const signedMessage = await web3.eth.personal.sign(
      originalMessage,
      fromAddress,
      process.env.NEXT_PUBLIC_TEST_PASSWORD || "test password!"
    );
    return signedMessage;
  };

  return {
    getAccounts,
    getBalance,
    signMessage,
  };
};
