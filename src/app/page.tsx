"use client";

import { useEffect, useState } from "react";
import { tKey, ethereumPrivateKeyProvider } from "./tkey";
import { ShareSerializationModule } from "@tkey/share-serialization";
import { SfaServiceProvider } from "@tkey/service-provider-sfa";
import { WebStorageModule } from "@tkey/web-storage";
import { Web3 } from "web3";
import { motion } from "framer-motion";
import {
  KeyRound,
  LogIn,
  LogOut,
  RefreshCcw,
  Copy,
  Shield,
  UserCircle,
  FileKey2,
  Wallet,
  HardDrive,
  Save,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

// Firebase libraries for custom authentication
import { initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  UserCredential,
  OAuthProvider,
} from "firebase/auth";

import { IProvider } from "@web3auth/base";
import Link from "next/link";

const verifier =
  process.env.NEXT_PUBLIC_WEB3AUTH_VERIFIER || "w3a-firebase-demo";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

function App() {
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
  const [serviceProviderInitialized, setServiceProviderInitialized] =
    useState(false);
  const [logs, setLogs] = useState<
    Array<{ timestamp: string; message: string; id: number }>
  >([]);
  const [googleDriveAuthenticated, setGoogleDriveAuthenticated] =
    useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(
    null
  );
  const [googleDriveFileId, setGoogleDriveFileId] = useState<string | null>(
    null
  );

  const addLog = (...args: unknown[]): void => {
    const timestamp = new Date().toLocaleTimeString("ja-JP");
    const message: string = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (typeof arg === "number" || typeof arg === "boolean")
          return String(arg);
        if (arg === null || arg === undefined) return String(arg);
        try {
          // オブジェクトの場合、重要な情報のみを表示
          if (typeof arg === "object") {
            if (Array.isArray(arg)) {
              return `[${arg.length} items]`;
            }
            // 特定のプロパティのみを表示
            const simplified = Object.keys(arg).reduce(
              (acc: Record<string, unknown>, key) => {
                if (
                  key.length < 20 &&
                  typeof (arg as Record<string, unknown>)[key] !== "function"
                ) {
                  acc[key] = (arg as Record<string, unknown>)[key];
                }
                return acc;
              },
              {}
            );
            return JSON.stringify(simplified, null, 2);
          }
          return JSON.stringify(arg, null, 2);
        } catch (e: unknown) {
          console.error("Failed to stringify argument:", e);
          return String(arg);
        }
      })
      .join(" ");

    const logEntry = {
      timestamp,
      message,
      id: Date.now() + Math.random(),
    };

    setLogs((prevLogs) => [logEntry, ...prevLogs]);
    console.log(...args);
  };

  // Firebase Initialisation
  const app = initializeApp(firebaseConfig);

  useEffect(() => {
    const init = async () => {
      // Initialization of Service Provider
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (tKey.serviceProvider as any).init(ethereumPrivateKeyProvider);
        setServiceProviderInitialized(true);
        addLog("Service Provider Initialized successfully.");
      } catch (error) {
        console.error("Service Provider Initialization Failed:", error);
        addLog(
          "Service Provider Initialization Failed:",
          error instanceof Error ? error.message : String(error)
        );
        setServiceProviderInitialized(false); // Ensure it's false on error
      }
    };

    init();
  }, []);

  const signInWithGoogle = async (): Promise<UserCredential> => {
    try {
      const auth = getAuth(app);
      const googleProvider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, googleProvider);
      console.log(res);
      return res;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const authenticateWithGoogleDrive = async (): Promise<string | null> => {
    try {
      const auth = getAuth(app);
      const provider = new OAuthProvider("google.com");
      provider.addScope("https://www.googleapis.com/auth/drive.file");
      const result = await signInWithPopup(auth, provider);
      const credential = OAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        setGoogleDriveAuthenticated(true);
        addLog("Google Drive authentication successful.");
        return credential.accessToken;
      } else {
        addLog("Failed to get Google Drive access token.");
        setGoogleDriveAuthenticated(false);
        setGoogleAccessToken(null);
        return null;
      }
    } catch (error) {
      addLog(
        "Google Drive authentication failed:",
        error instanceof Error ? error.message : String(error)
      );
      setGoogleDriveAuthenticated(false);
      setGoogleAccessToken(null);
      return null;
    }
  };

  const login = async () => {
    if (!serviceProviderInitialized) {
      addLog("Service Provider not initialized yet. Please wait.");
      return;
    }
    try {
      // login with firebase
      const loginRes = await signInWithGoogle();
      // get the id token from firebase
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
        verifierId: userId, // loginRes.user.uid を使用
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

  const reconstructKey = async () => {
    try {
      const reconstructedKey = await tKey.reconstructKey();
      const privateKey = reconstructedKey?.privKey.toString("hex");

      await ethereumPrivateKeyProvider.setupProvider(privateKey);
      setProvider(ethereumPrivateKeyProvider);
      setLoggedIn(true);
      // setDeviceShareの呼び出しを削除
    } catch (e) {
      addLog(
        "Reconstruct key failed",
        e instanceof Error ? e.message : String(e)
      );
    }
  };

  const inputRecoveryShareFromDevice = async () => {
    if (!recoveryShare) {
      addLog("Device share is empty.");
      return;
    }
    try {
      await tKey.inputShare(recoveryShare);
      // 必要なshareが揃ったか確認し、揃っていればreconstructKey
      const { requiredShares } = tKey.getKeyDetails();
      if (requiredShares === 0) {
        await reconstructKey();
        addLog("Recovery Share Input Successfully");
      } else {
        addLog("More shares are required.", requiredShares);
      }
    } catch (error) {
      addLog(
        "Input Recovery Share Error:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const keyDetails = async () => {
    if (!tKey) {
      addLog("tKey not initialized yet");
      return;
    }
    const keyDetails = await tKey.getKeyDetails();
    addLog("Fetched key details.", keyDetails);
  };

  const getDeviceShare = async () => {
    try {
      const share = await (
        tKey.modules.webStorage as WebStorageModule
      ).getDeviceShare();

      if (share) {
        addLog(
          "Device Share Captured Successfully across",
          JSON.stringify(share)
        );
        setRecoveryShare(share.share.share.toString("hex")); // HEX文字列として設定
        return share;
      }
      addLog("Device Share Not found");
      return null;
    } catch (error) {
      addLog(
        "Error getting device share:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const generateMnemonicAndSaveToDrive = async () => {
    let currentAccessToken = googleAccessToken;

    if (!googleDriveAuthenticated || !currentAccessToken) {
      addLog("Google Drive authentication required. Initiating...");
      currentAccessToken = await authenticateWithGoogleDrive();
      if (!currentAccessToken) {
        addLog(
          "Google Drive authentication failed or was cancelled. Backup aborted."
        );
        return;
      }
    }

    if (!tKeyInitialised) {
      addLog("tKey is not initialized yet.");
      return;
    }

    try {
      const generateShareResult = await tKey.generateNewShare();
      const share = await tKey.outputShareStore(
        generateShareResult.newShareIndex
      ).share.share;
      const mnemonic = await (
        tKey.modules.shareSerialization as ShareSerializationModule
      ).serialize(share, "mnemonic");

      addLog("Mnemonic generated, attempting to save to Google Drive...");

      const response = await fetch("/api/googledrive/saveMnemonic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: currentAccessToken,
          mnemonic: mnemonic,
          existingFileId: googleDriveFileId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        addLog(result.message, "File ID:", result.fileId);
        if (result.fileId) {
          setGoogleDriveFileId(result.fileId);
        }
      } else {
        addLog(
          "Failed to save mnemonic to Google Drive:",
          result.error,
          result.details
        );
      }
    } catch (error) {
      addLog(
        "Error in generateMnemonicAndSaveToDrive:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const recoverFromDriveAndMnemonic = async () => {
    if (!tKeyInitialised) {
      addLog("tKey not initialized yet. Please login first.");
      return;
    }

    let currentAccessToken = googleAccessToken;

    // Google Drive認証が必要な場合は自動的に実行
    if (!googleDriveAuthenticated || !currentAccessToken) {
      addLog(
        "Google Drive authentication required for recovery. Initiating..."
      );
      currentAccessToken = await authenticateWithGoogleDrive();
      if (!currentAccessToken) {
        addLog(
          "Google Drive authentication failed or was cancelled. Recovery aborted."
        );
        return;
      }
    }

    try {
      addLog("Attempting to recover mnemonic from Google Drive...");
      const response = await fetch("/api/googledrive/getMnemonic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: currentAccessToken,
          fileId: googleDriveFileId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.mnemonic) {
        addLog(
          "Mnemonic successfully retrieved from Google Drive.",
          "File ID:",
          result.fileId
        );
        if (result.fileId) {
          setGoogleDriveFileId(result.fileId);
        }

        const decryptedMnemonic = result.mnemonic;

        const share = await (
          tKey.modules.shareSerialization as ShareSerializationModule
        ).deserialize(decryptedMnemonic, "mnemonic");

        await tKey.inputShare(share.toString("hex"));

        const { requiredShares } = tKey.getKeyDetails();
        if (requiredShares === 0) {
          await reconstructKey();
          addLog("Key successfully reconstructed from Google Drive Mnemonic.");
        } else {
          addLog(
            "Mnemonic share inputted. More shares are required:",
            requiredShares
          );
        }
      } else {
        // より詳細なエラーハンドリング
        if (response.status === 404) {
          addLog(
            "No backup file found on Google Drive. Please create a backup first using 'Backup New Share to Google Drive'."
          );
        } else {
          addLog(
            "Failed to recover mnemonic from Google Drive:",
            result.error,
            result.details
          );
        }
      }
    } catch (error) {
      addLog(
        "Error in recoverFromDriveAndMnemonic:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const getUserInfo = async () => {
    addLog("User info retrieved.", userInfo);
  };

  const logout = async () => {
    setProvider(null);
    setLoggedIn(false);
    setUserInfo({ uid: "", displayName: null });
    setTKeyInitialised(false); // tKeyの初期化状態もリセット
    setRecoveryShare(""); // リカバリーシェアもクリア
    addLog("User logged out.");
  };

  const getAccounts = async () => {
    if (!provider) {
      addLog("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider as unknown as IProvider);

    // Get user's Ethereum public address
    const address = await web3.eth.getAccounts();
    addLog("Accounts retrieved.", address);
  };

  const getBalance = async () => {
    if (!provider) {
      addLog("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider as unknown as IProvider);

    // Get user's Ethereum public address
    const address = (await web3.eth.getAccounts())[0];

    // Get user's balance in ether
    const balance = web3.utils.fromWei(
      await web3.eth.getBalance(address), // Balance is in wei
      "ether"
    );
    addLog("Balance fetched.", balance);
  };

  const signMessage = async () => {
    if (!provider) {
      addLog("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider as unknown as IProvider);

    // Get user's Ethereum public address
    const fromAddress = (await web3.eth.getAccounts())[0];

    const originalMessage = "YOUR_MESSAGE";

    // Sign the message
    const signedMessage = await web3.eth.personal.sign(
      originalMessage,
      fromAddress,
      process.env.NEXT_PUBLIC_TEST_PASSWORD || "test password!" // configure your own password here.
    );
    addLog("Message signed.", signedMessage);
  };

  const criticalResetAccount = async (): Promise<void> => {
    // This is a critical function that should only be used for testing purposes
    // Resetting your account means clearing all the metadata associated with it from the metadata server
    // The key details will be deleted from our server and you will not be able to recover your account
    if (!tKeyInitialised) {
      addLog("tKey is not initialized. Cannot reset account.");
      return;
    }
    try {
      await tKey.storageLayer.setMetadata({
        privKey: tKey.serviceProvider.postboxKey,
        input: { message: "KEY_NOT_FOUND" },
      });
      addLog("[CRITICAL] Account reset invoked.");
      logout(); // ログアウト処理も実行
    } catch (error) {
      addLog(
        "Critical Reset Account Error:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const GradientHeadline = () => (
    <h1 className="text-center text-4xl font-extrabold mb-4 leading-tight">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
        Web3Auth tKey
      </span>
      <div className="flex justify-center mt-4">
        <Link
          href="https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/tkey-web/quick-starts/tkey-nextjs-quick-start"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <FileKey2 size={14} />
          View Source Code
        </Link>
      </div>
    </h1>
  );

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // 簡単なフィードバック（必要に応じて toast などに変更可能）
      console.log("コピーしました:", text);
    } catch (err) {
      console.error("コピーに失敗しました:", err);
      // フォールバック: 古いブラウザ対応
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
  };

  const LogViewer = () => (
    <div className="mt-6 h-40 rounded-lg bg-slate-900 shadow-inner overflow-hidden">
      <div className="h-full overflow-y-auto overflow-x-hidden p-4 text-sm text-slate-200 space-y-2 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-slate-400 italic">ログはありません</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="border-b border-slate-700 pb-2 last:border-b-0 group"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <div className="text-slate-400 text-xs mb-1">
                    {log.timestamp}
                  </div>
                  <div className="text-slate-200 whitespace-pre-wrap break-words break-all overflow-wrap-anywhere">
                    {log.message}
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(log.message)}
                  className="ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-slate-200"
                  title="メッセージをコピー"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

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
      <Button variant="outline" onClick={keyDetails}>
        <KeyRound size={18} className="mr-2" /> Key Details
      </Button>

      <Button
        variant="outline"
        onClick={generateMnemonicAndSaveToDrive}
        className="sm:col-span-2"
      >
        <Save size={18} className="mr-2" /> Backup New Share to Google Drive
      </Button>
      <Button variant="outline" onClick={getAccounts}>
        <Wallet size={18} className="mr-2" /> Get Accounts
      </Button>
      <Button variant="outline" onClick={getBalance}>
        <Wallet size={18} className="mr-2" /> Get Balance
      </Button>
      <Button variant="outline" onClick={signMessage}>
        <Copy size={18} className="mr-2" /> Sign Message
      </Button>
      <Button onClick={logout}>
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
      {/* Primary Login */}
      <Button
        onClick={login}
        size="lg"
        className="w-full"
        disabled={!serviceProviderInitialized}
      >
        <LogIn className="mr-2" size={18} />
        {serviceProviderInitialized ? "Login" : "Initializing..."}
      </Button>

      {/* Get Device Share */}
      <Button
        variant="outline"
        className="w-full"
        onClick={getDeviceShare}
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
        onClick={inputRecoveryShareFromDevice}
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
          <LogViewer />
          <div className="flex justify-center">
            <Button
              variant="destructive"
              onClick={criticalResetAccount}
              disabled={!serviceProviderInitialized || !tKeyInitialised}
            >
              <Shield className="mr-2" size={18} /> [CRITICAL] Reset Account
            </Button>

            <Button
              variant="outline"
              onClick={() => setLogs([])}
              className="ml-2"
            >
              <RefreshCcw className="mr-2" size={18} /> ログをリセット
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
