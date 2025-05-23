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
} from "firebase/auth";

import { IProvider } from "@web3auth/base";
import Link from "next/link";

const verifier = "w3a-firebase-demo";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0nd9YsPLu-tpdCrsXn8wgsWVAiYEpQ_E",
  authDomain: "web3auth-oauth-logins.firebaseapp.com",
  projectId: "web3auth-oauth-logins",
  storageBucket: "web3auth-oauth-logins.appspot.com",
  messagingSenderId: "461819774167",
  appId: "1:461819774167:web:e74addfb6cc88f3b5b9c92",
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
  const [mnemonicShare, setMnemonicShare] = useState<string>("");
  const [serviceProviderInitialized, setServiceProviderInitialized] =
    useState(false);
  const [logs, setLogs] = useState<string[]>([
    "Service Provider Initialized successfully.",
  ]);

  const addLog = (...args: unknown[]): void => {
    const message: string = args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e: unknown) {
          console.error("Failed to stringify argument:", e);
          return String(arg);
        }
      })
      .join(" ");
    setLogs((prevLogs) => [message, ...prevLogs]);
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

  const generateMnemonic = async () => {
    try {
      const generateShareResult = await tKey.generateNewShare();
      const share = await tKey.outputShareStore(
        generateShareResult.newShareIndex
      ).share.share;
      const mnemonic = await (
        tKey.modules.shareSerialization as ShareSerializationModule
      ).serialize(share, "mnemonic");
      addLog("Mnemonic backup generated.", mnemonic);
      // 画面に表示するためにステートを更新
      setMnemonicShare(mnemonic as string);
      return mnemonic;
    } catch (error) {
      addLog(
        "Generate Mnemonic Error:",
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const recoverFromMnemonic = async () => {
    if (!mnemonicShare) {
      addLog("Mnemonic share is empty.");
      return;
    }
    if (!tKey) {
      addLog("tKey not initialized yet");
      return;
    }
    try {
      const share = await (
        tKey.modules.shareSerialization as ShareSerializationModule
      ).deserialize(mnemonicShare, "mnemonic");

      // ニーモニックから変換したシェアを直接inputShareに渡す
      await tKey.inputShare(share.toString("hex"));

      // シェアが揃ったか確認し、揃っていればreconstructKey
      const { requiredShares } = tKey.getKeyDetails();
      if (requiredShares === 0) {
        await reconstructKey();
        addLog("Recovery from Mnemonic Successful");
      } else {
        addLog("More shares are required.", requiredShares);
      }

      return share;
    } catch (error) {
      addLog(
        "Mnemonic Recovery Error:",
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
    setMnemonicShare(""); // ニーモニックシェアもクリア
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
      "test password!" // configure your own password here.
    );
    addLog("Message signed.", signedMessage);
  };

  const criticalResetAccount = async (): Promise<void> => {
    // This is a critical function that should only be used for testing purposes
    // Resetting your account means clearing all the metadata associated with it from the metadata server
    // The key details will be deleted from our server and you will not be able to recover your account
    if (!tKeyInitialised && !tKey.serviceProvider.postboxKey) {
      addLog(
        "tKey is not initialized or postboxKey is not available. Cannot reset account."
      );
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

  const LogViewer = () => (
    <pre className="mt-6 h-40 overflow-y-auto rounded-lg bg-slate-900 text-slate-200 p-4 text-sm shadow-inner">
      {JSON.stringify(logs, null, 2)}
    </pre>
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
      <Button variant="outline" onClick={generateMnemonic}>
        <FileKey2 size={18} className="mr-2" /> Generate Backup
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
      <Button variant="destructive" onClick={criticalResetAccount}>
        <Shield size={18} className="mr-2" /> [CRITICAL] Reset Account
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
        <KeyRound className="mr-2" size={18} /> Input Recovery Share
      </Button>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-1">
          <FileKey2 size={14} /> Recover Using Mnemonic Share
        </label>
        <Input
          placeholder="Paste your mnemonic share…"
          value={mnemonicShare}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setMnemonicShare(e.target.value)
          }
          disabled={!tKeyInitialised}
        />
      </div>

      <Button
        variant="secondary"
        className="w-full"
        onClick={recoverFromMnemonic}
        disabled={!tKeyInitialised || !mnemonicShare}
      >
        <RefreshCcw className="mr-2" size={18} /> Get Recovery Share using
        Mnemonic
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
              disabled={!serviceProviderInitialized}
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
