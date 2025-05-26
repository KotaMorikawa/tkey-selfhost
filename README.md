# tKey Self-Host Application

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables Setup

Before running the application, you need to set up the required environment variables. Create a `.env` file in the root directory with the following variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here

# Web3Auth Configuration
NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=your_web3auth_client_id_here
NEXT_PUBLIC_WEB3AUTH_VERIFIER=your_verifier_name_here

# Blockchain Configuration
NEXT_PUBLIC_CHAIN_ID=0xaa36a7
NEXT_PUBLIC_RPC_TARGET=your_rpc_url_here
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

### Required Environment Variables

1. **Firebase Configuration**: Get these from your Firebase project settings
2. **Web3Auth Client ID**: Get from [Web3Auth Dashboard](https://dashboard.web3auth.io)
3. **RPC Target**: Your blockchain RPC endpoint (e.g., Alchemy, Infura)
4. **Mnemonic Encryption Password**: A secure password for encrypting mnemonics stored in Google Drive

## Getting Started

First, set up your environment variables as described above, then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
