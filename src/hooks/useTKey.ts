"use client";

import { useState } from "react";
import { tKey, ethereumPrivateKeyProvider } from "@/app/tkey";
import { ShareSerializationModule } from "@tkey/share-serialization";
import { WebStorageModule } from "@tkey/web-storage";
import { IProvider } from "@web3auth/base";

export const useTKey = () => {
  const [tKeyInitialised, setTKeyInitialised] = useState(false);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState<{
    uid: string;
    displayName: string | null;
  }>({
    uid: "",
    displayName: null,
  });
  const [recoveryShare, setRecoveryShare] = useState<string>("");

  const reconstructKey = async () => {
    try {
      const reconstructedKey = await tKey.reconstructKey();
      const privateKey = reconstructedKey?.privKey.toString("hex");

      await ethereumPrivateKeyProvider.setupProvider(privateKey);
      setProvider(ethereumPrivateKeyProvider);
      setLoggedIn(true);
    } catch (e) {
      throw new Error(
        `Reconstruct key failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  };

  const inputRecoveryShareFromDevice = async () => {
    if (!recoveryShare) {
      throw new Error("Device share is empty.");
    }
    try {
      await tKey.inputShare(recoveryShare);
      const { requiredShares } = tKey.getKeyDetails();
      if (requiredShares === 0) {
        await reconstructKey();
        return "Recovery Share Input Successfully";
      } else {
        return `More shares are required: ${requiredShares}`;
      }
    } catch (error) {
      throw new Error(
        `Input Recovery Share Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const keyDetails = async () => {
    if (!tKey) {
      throw new Error("tKey not initialized yet");
    }
    const keyDetails = await tKey.getKeyDetails();
    return keyDetails;
  };

  const getDeviceShare = async () => {
    try {
      const share = await (
        tKey.modules.webStorage as WebStorageModule
      ).getDeviceShare();

      if (share) {
        setRecoveryShare(share.share.share.toString("hex"));
        return share;
      }
      return null;
    } catch (error) {
      throw new Error(
        `Error getting device share: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const generateMnemonicShare = async (): Promise<string> => {
    if (!tKeyInitialised) {
      throw new Error("tKey is not initialized yet.");
    }

    try {
      const generateShareResult = await tKey.generateNewShare();
      const share = await tKey.outputShareStore(
        generateShareResult.newShareIndex
      ).share.share;
      const mnemonic = await (
        tKey.modules.shareSerialization as ShareSerializationModule
      ).serialize(share, "mnemonic");
      return mnemonic as string;
    } catch (error) {
      throw new Error(
        `Error generating mnemonic: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const inputMnemonicShare = async (mnemonic: string) => {
    if (!tKeyInitialised) {
      throw new Error("tKey not initialized yet. Please login first.");
    }

    try {
      const share = await (
        tKey.modules.shareSerialization as ShareSerializationModule
      ).deserialize(mnemonic, "mnemonic");
      await tKey.inputShare(share.toString("hex"));

      const { requiredShares } = tKey.getKeyDetails();
      if (requiredShares === 0) {
        await reconstructKey();
        return "Key successfully reconstructed from mnemonic.";
      } else {
        return `Mnemonic share inputted. More shares are required: ${requiredShares}`;
      }
    } catch (error) {
      throw new Error(
        `Error inputting mnemonic share: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const deleteGoogleDriveMnemonic = async (
    accessToken: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("/api/googledrive/deleteMnemonic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete mnemonic from Google Drive"
        );
      }

      return {
        success: data.success,
        message: data.message,
      };
    } catch (error) {
      throw new Error(
        `Error deleting Google Drive mnemonic: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const criticalResetAccount = async (accessToken?: string): Promise<void> => {
    if (!tKeyInitialised) {
      throw new Error("tKey is not initialized. Cannot reset account.");
    }
    try {
      // tKeyのメタデータをリセット
      await tKey.storageLayer.setMetadata({
        privKey: tKey.serviceProvider.postboxKey,
        input: { message: "KEY_NOT_FOUND" },
      });

      // GoogleDriveからmnemonicファイルを削除（accessTokenが提供されている場合）
      if (accessToken) {
        try {
          const deleteResult = await deleteGoogleDriveMnemonic(accessToken);
          console.log("Google Drive cleanup:", deleteResult.message);
        } catch (error) {
          console.warn("Failed to delete Google Drive backup:", error);
          // Google Drive削除の失敗はアカウントリセットを阻止しない
        }
      }

      logout();
    } catch (error) {
      throw new Error(
        `Critical Reset Account Error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const logout = async () => {
    setProvider(null);
    setLoggedIn(false);
    setUserInfo({ uid: "", displayName: null });
    setTKeyInitialised(false);
    setRecoveryShare("");
  };

  return {
    // State
    tKeyInitialised,
    setTKeyInitialised,
    provider,
    loggedIn,
    userInfo,
    setUserInfo,
    recoveryShare,
    setRecoveryShare,

    // Functions
    reconstructKey,
    inputRecoveryShareFromDevice,
    keyDetails,
    getDeviceShare,
    generateMnemonicShare,
    inputMnemonicShare,
    deleteGoogleDriveMnemonic,
    criticalResetAccount,
    logout,
  };
};
