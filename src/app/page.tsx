"use client";

import { motion } from "framer-motion";
import {
  KeyRound,
  LogIn,
  LogOut,
  RefreshCcw,
  Shield,
  UserCircle,
  Wallet,
  HardDrive,
  Save,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SfaServiceProvider } from "@tkey/service-provider-sfa";
import { ethereumPrivateKeyProvider, tKey } from "./tkey";

// Custom hooks
import { useTKey } from "@/hooks/useTKey";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useWeb3 } from "@/hooks/useWeb3";
import { useGoogleDrive } from "@/hooks/useGoogleDrive";
import { useLogger } from "@/hooks/useLogger";

// Components
import { LogViewer } from "@/components/LogViewer";
import { GradientHeadline } from "@/components/GradientHeadline";
import { useEffect, useState } from "react";

const verifier =
  process.env.NEXT_PUBLIC_WEB3AUTH_VERIFIER || "w3a-firebase-demo";

function App() {
  const {
    tKeyInitialised,
    setTKeyInitialised,
    provider,
    loggedIn,
    userInfo,
    setUserInfo,
    recoveryShare,
    setRecoveryShare,
    reconstructKey,
    inputRecoveryShareFromDevice: inputRecoveryShare,
    keyDetails: getKeyDetails,
    getDeviceShare: getDeviceShareFromHook,
    generateMnemonicShare,
    inputMnemonicShare,
    criticalResetAccount: resetAccount,
    logout: logoutFromHook,
  } = useTKey();

  const {
    googleDriveAuthenticated,
    googleAccessToken,
    googleDriveFileId,
    setGoogleDriveFileId,
    signInWithGoogle,
    authenticateWithGoogleDrive,
  } = useFirebaseAuth();

  const {
    getAccounts: getWeb3Accounts,
    getBalance: getWeb3Balance,
    signMessage: signWeb3Message,
  } = useWeb3();

  const { saveMnemonicToDrive, getMnemonicFromDrive } = useGoogleDrive();

  const { logs, addLog, clearLogs, copyToClipboard } = useLogger();

  const [serviceProviderInitialized, setServiceProviderInitialized] =
    useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tKey.serviceProvider as any).init(ethereumPrivateKeyProvider);
        setServiceProviderInitialized(true);
        addLog("Service Provider Initialized successfully.");
      } catch (error) {
        addLog("Service Provider Initialization Failed:", error);
        setServiceProviderInitialized(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!serviceProviderInitialized) {
      addLog("Service Provider not initialized yet. Please wait.");
      return;
    }
    try {
      const loginRes = await signInWithGoogle();
      const idToken = await loginRes.user.getIdToken(true);
      const userId = loginRes.user.uid;

      if (!userId) {
        addLog("Failed to get UID from Firebase User object.");
        console.error("Firebase User object:", loginRes.user);
        return;
      }

      setUserInfo({
        uid: userId,
        displayName: loginRes.user.displayName,
      });

      const connectParams = {
        verifier,
        verifierId: userId,
        idToken,
      };

      await (tKey.serviceProvider as SfaServiceProvider).connect(connectParams);
      await tKey.initialize();
      setTKeyInitialised(true);

      const { requiredShares } = tKey.getKeyDetails();

      if (requiredShares > 0) {
        addLog(
          "Please enter your backup shares, requiredShares:",
          requiredShares
        );
      } else {
        await reconstructKey();
        addLog("User logged in.");
      }
    } catch (err) {
      addLog(
        "Login failed:",
        err instanceof Error ? err.message : String(err),
        (err as Error)?.stack
      );
    }
  };

  const handleInputRecoveryShare = async () => {
    try {
      const result = await inputRecoveryShare();
      addLog(result);
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const handleKeyDetails = async () => {
    try {
      const details = await getKeyDetails();
      addLog("Fetched key details.", details);
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const handleGetDeviceShare = async () => {
    try {
      const share = await getDeviceShareFromHook();
      if (share) {
        addLog(
          "Device Share Captured Successfully across",
          JSON.stringify(share)
        );
      } else {
        addLog("Device Share Not found");
      }
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const generateMnemonicAndSaveToDrive = async () => {
    let currentAccessToken = googleAccessToken;

    if (!googleDriveAuthenticated || !currentAccessToken) {
      addLog("Google Drive authentication required. Initiating...");
      try {
        currentAccessToken = await authenticateWithGoogleDrive();
        if (!currentAccessToken) {
          addLog(
            "Google Drive authentication failed or was cancelled. Backup aborted."
          );
          return;
        }
        addLog("Google Drive authentication successful.");
      } catch (error) {
        addLog(
          "Google Drive authentication failed:",
          error instanceof Error ? error.message : String(error)
        );
        return;
      }
    }

    try {
      const mnemonic = await generateMnemonicShare();
      addLog("Mnemonic generated, attempting to save to Google Drive...");

      const result = await saveMnemonicToDrive(
        currentAccessToken,
        mnemonic,
        googleDriveFileId
      );
      addLog(result.message, "File ID:", result.fileId);
      if (result.fileId) {
        setGoogleDriveFileId(result.fileId);
      }
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const recoverFromDriveAndMnemonic = async () => {
    if (!tKeyInitialised) {
      addLog("tKey not initialized yet. Please login first.");
      return;
    }

    let currentAccessToken = googleAccessToken;

    if (!googleDriveAuthenticated || !currentAccessToken) {
      addLog(
        "Google Drive authentication required for recovery. Initiating..."
      );
      try {
        currentAccessToken = await authenticateWithGoogleDrive();
        if (!currentAccessToken) {
          addLog(
            "Google Drive authentication failed or was cancelled. Recovery aborted."
          );
          return;
        }
        addLog("Google Drive authentication successful.");
      } catch (error) {
        addLog(
          "Google Drive authentication failed:",
          error instanceof Error ? error.message : String(error)
        );
        return;
      }
    }

    try {
      addLog("Attempting to recover mnemonic from Google Drive...");
      const result = await getMnemonicFromDrive(
        currentAccessToken,
        googleDriveFileId
      );

      addLog(
        "Mnemonic successfully retrieved from Google Drive.",
        "File ID:",
        result.fileId
      );
      if (result.fileId) {
        setGoogleDriveFileId(result.fileId);
      }

      const recoveryResult = await inputMnemonicShare(result.mnemonic);
      addLog(recoveryResult);
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const getUserInfo = async () => {
    addLog("User info retrieved.", userInfo);
  };

  const handleLogout = async () => {
    await logoutFromHook();
    addLog("User logged out.");
  };

  const handleGetAccounts = async () => {
    try {
      if (!provider) {
        addLog("provider not initialized yet");
        return;
      }
      const address = await getWeb3Accounts(provider);
      addLog("Accounts retrieved.", address[0]);
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const handleGetBalance = async () => {
    try {
      if (!provider) {
        addLog("provider not initialized yet");
        return;
      }
      const balance = await getWeb3Balance(provider);
      addLog("Balance fetched.", balance);
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const handleSignMessage = async () => {
    try {
      if (!provider) {
        addLog("provider not initialized yet");
        return;
      }
      const signedMessage = await signWeb3Message(provider);
      addLog("Message signed.", signedMessage);
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const handleCriticalResetAccount = async (): Promise<void> => {
    try {
      let currentAccessToken = googleAccessToken;

      // Google Drive認証が必要な場合は認証を実行
      if (!googleDriveAuthenticated || !currentAccessToken) {
        addLog(
          "Google Drive authentication required for complete reset. Initiating..."
        );
        try {
          currentAccessToken = await authenticateWithGoogleDrive();
          if (currentAccessToken) {
            addLog("Google Drive authentication successful for reset.");
          } else {
            addLog(
              "Google Drive authentication failed. Proceeding with tKey-only reset."
            );
          }
        } catch (error) {
          addLog(
            "Google Drive authentication failed:",
            error instanceof Error ? error.message : String(error)
          );
          addLog("Proceeding with tKey-only reset.");
        }
      }

      // アカウントリセット実行（
      await resetAccount(currentAccessToken || undefined);
      addLog("[CRITICAL] Account reset invoked with Google Drive cleanup.");
    } catch (error) {
      addLog(error instanceof Error ? error.message : String(error));
    }
  };

  const loggedInView = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid sm:grid-cols-2 gap-3"
    >
      <Button variant="outline" onClick={getUserInfo}>
        <UserCircle size={18} className="mr-2" /> Get User Info
      </Button>
      <Button variant="outline" onClick={handleKeyDetails}>
        <KeyRound size={18} className="mr-2" /> Key Details
      </Button>

      <Button
        variant="outline"
        onClick={generateMnemonicAndSaveToDrive}
        className="sm:col-span-2"
      >
        <Save size={18} className="mr-2" /> Backup New Share to Google Drive
      </Button>
      <Button variant="outline" onClick={handleGetAccounts}>
        <Wallet size={18} className="mr-2" /> Get Accounts
      </Button>
      <Button variant="outline" onClick={handleGetBalance}>
        <Wallet size={18} className="mr-2" /> Get Balance
      </Button>
      <Button variant="outline" onClick={handleSignMessage}>
        <KeyRound size={18} className="mr-2" /> Sign Message
      </Button>
      <Button onClick={handleLogout}>
        <LogOut size={18} className="mr-2" /> Log Out
      </Button>
    </motion.div>
  );

  const unloggedInView = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      <Button
        onClick={login}
        size="lg"
        className="w-full"
        disabled={!serviceProviderInitialized}
      >
        <LogIn className="mr-2" size={18} />
        {serviceProviderInitialized ? "Login" : "Initializing..."}
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleGetDeviceShare}
        disabled={!serviceProviderInitialized || !tKeyInitialised}
      >
        <HardDrive className="mr-2" size={18} /> Get Device Share
      </Button>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
          <HardDrive size={14} /> Device Share
        </label>
        <Input
          placeholder="Paste your device share…"
          value={recoveryShare}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setRecoveryShare(e.target.value)
          }
          disabled={!tKeyInitialised}
        />
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={handleInputRecoveryShare}
        disabled={!tKeyInitialised || !recoveryShare}
      >
        <KeyRound className="mr-2" size={18} /> Login with Device Share
      </Button>

      <Button
        variant="secondary"
        className="w-full"
        onClick={recoverFromDriveAndMnemonic}
        disabled={!tKeyInitialised}
      >
        <UploadCloud className="mr-2" size={18} /> Restore from Google Drive
      </Button>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-xl shadow-2xl rounded-2xl">
        <CardHeader>
          <CardTitle>
            <GradientHeadline />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loggedIn ? loggedInView : unloggedInView}
          <LogViewer logs={logs} onCopyToClipboard={copyToClipboard} />
          <div className="flex justify-center">
            <Button
              variant="destructive"
              onClick={handleCriticalResetAccount}
              disabled={!serviceProviderInitialized || !tKeyInitialised}
            >
              <Shield className="mr-2" size={18} /> [CRITICAL] Reset Account
            </Button>

            <Button variant="outline" onClick={clearLogs} className="ml-2">
              <RefreshCcw className="mr-2" size={18} /> Reset Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
