# tKey Self-Host Application

Web3Auth tKey を使用したセルフホスト型のウォレット管理アプリケーションです。このアプリケーションは、分散型キー管理システムを使用して、ユーザーが自分の暗号化キーを安全に管理できるようにします。

## 🚀 主な機能

- **分散型キー管理**: Web3Auth tKey を使用した Threshold Signature Scheme (TSS)
- **Firebase 認証**: Google アカウントでのログイン
- **Google Drive バックアップ**: ニーモニックフレーズの暗号化バックアップ
- **Web3 ウォレット機能**: アカウント管理、残高確認、メッセージ署名
- **デバイス間での復旧**: 複数のデバイスでのキー復旧
- **モダン UI**: TailwindCSS と Framer Motion を使用したレスポンシブデザイン

## 🛠️ 技術スタック

- **フレームワーク**: Next.js 15.1.8 (App Router)
- **言語**: TypeScript
- **スタイリング**: TailwindCSS + shadcn/ui
- **アニメーション**: Framer Motion
- **認証**: Firebase Auth + Web3Auth
- **キー管理**: Web3Auth tKey
- **ストレージ**: Google Drive API
- **ブロックチェーン**: Ethereum (Sepolia testnet)

## 📋 前提条件

以下のアカウントと API キーが必要です：

1. **Firebase プロジェクト**

   - [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
   - Authentication > Sign-in method で Google を有効化
   - Google Cloud Conosle > GoogleDriveAPI を有効化

2. **Web3Auth ダッシュボード**

   - [Web3Auth Dashboard](https://dashboard.web3auth.io)でプロジェクトを作成
   - 上記の Firebase の設定を custom connection として紐付ける。[docs](https://web3auth.io/docs/authentication/custom-connections/firebase)
   - Client ID を取得

3. **ブロックチェーン RPC エンドポイント**
   - [Alchemy](https://www.alchemy.com/)または[Infura](https://infura.io/)でプロジェクトを作成

## ⚙️ 環境変数の設定

プロジェクトルートに`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here

# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
NEXT_PUBLIC_WEB3AUTH_VERIFIER=your_web3auth_verifier_name
NEXT_PUBLIC_WEB3AUTH_NETWORK=sapphire_mainnet

# Blockchain Configuration (Sepolia Testnet)
NEXT_PUBLIC_CHAIN_ID=0xaa36a7
NEXT_PUBLIC_RPC_TARGET=your_rpc_endpoint
NEXT_PUBLIC_BLOCK_EXPLORER=https://sepolia.etherscan.io/
NEXT_PUBLIC_CHAIN_TICKER=ETH
NEXT_PUBLIC_CHAIN_TICKER_NAME=Ethereum
NEXT_PUBLIC_CHAIN_DISPLAY_NAME=sepolia

# Torus Storage Layer
NEXT_PUBLIC_TORUS_HOST_URL=https://metadata.tor.us

# Google Drive Mnemonic Encryption (Server-side only)
MNEMONIC_ENCRYPTION_PASSWORD=your_secure_encryption_password_here

# Test Configuration
NEXT_PUBLIC_TEST_PASSWORD=your_test_password_here
```

### 🔑 環境変数の詳細説明

| 変数名                           | 説明                                | 取得方法                            |
| -------------------------------- | ----------------------------------- | ----------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`   | Firebase API キー                   | Firebase Console > プロジェクト設定 |
| `NEXT_PUBLIC_WEB3AUTH_CLIENT_ID` | Web3Auth クライアント ID            | Web3Auth Dashboard                  |
| `NEXT_PUBLIC_RPC_TARGET`         | ブロックチェーン RPC エンドポイント | Alchemy/Infura                      |
| `MNEMONIC_ENCRYPTION_PASSWORD`   | ニーモニック暗号化パスワード        | 任意の強力なパスワード              |

## 🚀 セットアップと起動

1. **リポジトリのクローン**

```bash
git clone <repository-url>
cd tkey-selfhost
```

2. **依存関係のインストール**

```bash
npm install
```

3. **環境変数の設定**

```bash
cp .env.example .env.local
# .env.localファイルを編集して必要な値を設定
```

4. **開発サーバーの起動**

```bash
npm run dev
```

5. **ブラウザでアクセス**

```
http://localhost:3000
```

## 📱 使用方法

### 1. 初回ログイン

1. 「Login with Google」ボタンをクリック
2. Google アカウントでログイン
3. 自動的に tKey が初期化されます

### 2. バックアップの作成

1. ログイン後、「Backup New Share to Google Drive」をクリック
2. Google Drive へのアクセス許可を与える
3. ニーモニックフレーズが暗号化されて Google Drive に保存されます

### 3. キーの復旧

1. 新しいデバイスでログイン
2. 「Recover from Google Drive」をクリック
3. 保存されたニーモニックフレーズを使用してキーを復旧

### 4. ウォレット機能

- **Get Accounts**: ウォレットアドレスを取得
- **Get Balance**: ETH 残高を確認
- **Sign Message**: メッセージに署名

## 🏗️ プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   └── googledrive/          # Google Drive API エンドポイント
│   ├── page.tsx                  # メインページ
│   ├── layout.tsx                # レイアウト
│   ├── tkey.ts                   # tKey設定
│   └── globals.css               # グローバルスタイル
├── components/
│   ├── ui/                       # shadcn/ui コンポーネント
│   ├── LogViewer.tsx             # ログ表示コンポーネント
│   └── GradientHeadline.tsx      # ヘッドラインコンポーネント
├── hooks/
│   ├── useTKey.ts                # tKey管理フック
│   ├── useFirebaseAuth.ts        # Firebase認証フック
│   ├── useWeb3.ts                # Web3機能フック
│   ├── useGoogleDrive.ts         # Google Drive操作フック
│   └── useLogger.ts              # ログ管理フック
├── lib/
│   └── utils.ts                  # ユーティリティ関数
└── types/                        # TypeScript型定義
```

## 🔧 利用可能なスクリプト

```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm run start

# ESLintチェック
npm run lint
```

## 🔒 セキュリティ機能

- **分散型キー管理**: キーは複数のシェアに分割され、単一障害点を排除
- **暗号化バックアップ**: Google Drive に保存されるニーモニックは強力な暗号化で保護
- **クライアントサイド処理**: 秘密鍵はクライアント側でのみ処理
- **環境変数保護**: 機密情報は環境変数で管理

## 🌐 対応ネットワーク

- **Ethereum Sepolia Testnet** (デフォルト)
- 他の EVM 互換ネットワークも設定可能

## 🐛 トラブルシューティング

### よくある問題

1. **Service Provider not initialized**

   - ページを再読み込みして初期化を待つ

2. **Google Drive authentication failed**

   - ブラウザのポップアップブロッカーを無効化
   - Firebase 設定を確認

3. **RPC connection failed**
   - RPC_TARGET の URL が正しいか確認
   - API キーの有効性を確認

### ログの確認

アプリケーション内のログビューアーで詳細なエラー情報を確認できます。

## 📚 参考資料

- [Web3Auth Documentation](https://web3auth.io/docs/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## ⚠️ 免責事項

このアプリケーションはデモンストレーション目的で作成されています。本番環境での使用前に、セキュリティ監査を実施することを強く推奨します。
