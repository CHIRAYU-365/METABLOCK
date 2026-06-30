# ProofChain ⛓️📄

A decentralized, Zero-Knowledge document verification platform built on Solana. ProofChain allows issuers to cryptographically register documents on the blockchain while verifying their authenticity without the actual file ever leaving the user's browser.

## Tech Stack 🛠️
- **Blockchain:** Solana, Anchor Framework (Rust)
- **Frontend:** React, Vite, Tailwind/CSS, `@solana/wallet-adapter-react`
- **Backend:** Node.js, Express, Prisma (PostgreSQL), Pinata IPFS SDK

## System Architecture 🏗️
1. **Client-Side Hashing:** Documents are hashed via the WebCrypto API (`SHA-256`) directly in the browser.
2. **Zero-Knowledge Verification:** The React client directly queries the Solana RPC using a Program Derived Address (PDA) to verify a document's authenticity and revocation status.
3. **Hybrid Storage:** Large files are pinned to IPFS (via Pinata) for decentralized storage, while a local PostgreSQL database handles fast querying and Web2-style access control (sharing documents).

## Quick Start 🚀

### 1. Install Dependencies
From the root directory, install everything concurrently:
```bash
npm run install:all
```

### 2. Configure Environment
In the `backend/` folder, copy `.env.example` to `.env` and fill in your keys:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/proofchain"
JWT_SECRET="your_jwt_secret"
PINATA_JWT="your_pinata_jwt"
PINATA_GATEWAY="your_gateway"
```

### 3. Database Setup
Push the Prisma schema to your Postgres instance:
```bash
cd backend
npx prisma db push
```

### 4. Build Smart Contract
```bash
cd blockchain
anchor build
```

### 5. Run Concurrently
Launch the Backend API and Frontend UI simultaneously from the root:
```bash
npm run dev
```
*(If you need the local Solana test validator to spin up as well, use `npm run dev:all`)*
