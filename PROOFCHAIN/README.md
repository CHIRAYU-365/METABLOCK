# ProofChain

ProofChain is a document registration and verification system that uses the Solana blockchain. It lets issuers register SHA-256 document hashes on-chain and revoke them when needed. Document verification is done client-side by querying Program Derived Addresses (PDAs) directly on the Solana network, which means the documents themselves are never uploaded or shared during verification.

---

## Technical Overview

The codebase is split into three main parts:
- Blockchain (Anchor/Rust): Manages document status (registered vs. revoked) on the Solana ledger. It uses deterministic PDAs derived from the document hash: `["document", doc_hash]`.
- Backend (Node.js/Express/Prisma): Handles user authorization, files uploads, IPFS pinning via the Pinata SDK, and document sharing lists in PostgreSQL.
- Frontend (React/Vite): Connects to Phantom Wallet, triggers on-chain registrations and revocations, and provides a verification interface.

---

## Directory Structure

```text
PROOFCHAIN/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── server.js
│   └── package.json
├── blockchain/
│   ├── programs/
│   │   └── blockchain/
│   │       └── src/
│   │           ├── instructions/
│   │           │   ├── register_document.rs
│   │           │   └── revoke_document.rs
│   │           ├── lib.rs
│   │           └── state.rs
│   └── Anchor.toml
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   └── Verify.jsx
│   │   ├── utils/
│   │   │   ├── blockchain.json
│   │   │   └── solana.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── package.json
```

---

## Smart Contract

### State Definition (`state.rs`)
```rust
use anchor_lang::prelude::*;

#[account]
pub struct DocumentRecord {
    pub issuer: Pubkey,
    pub ipfs_cid: String,
    pub timestamp: i64,
    pub is_revoked: bool,
    pub bump: u8,
}

impl DocumentRecord {
    pub const MAX_SIZE: usize = 8 + 32 + (4 + 64) + 8 + 1 + 1;
}
```

### Main Entrypoint (`lib.rs`)
```rust
pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("Bm4JopwFvvvH2magffE1xivMtZCC2gTZe2BBNeSC4rew");

#[program]
pub mod blockchain {
    use super::*;

    pub fn register_document(ctx: Context<RegisterDocument>, doc_hash: [u8; 32], ipfs_cid: String) -> Result<()> {
        crate::instructions::register_document::handle_register_document(ctx, doc_hash, ipfs_cid)
    }

    pub fn revoke_document(ctx: Context<RevokeDocument>, doc_hash: [u8; 32]) -> Result<()> {
        crate::instructions::revoke_document::handle_revoke_document(ctx, doc_hash)
    }
}
```

### Register Instruction (`register_document.rs`)
```rust
use anchor_lang::prelude::*;
use crate::state::DocumentRecord;

#[derive(Accounts)]
#[instruction(doc_hash: [u8; 32])]
pub struct RegisterDocument<'info> {
    #[account(
        init,
        payer = issuer,
        space = DocumentRecord::MAX_SIZE,
        seeds = [b"document", doc_hash.as_ref()],
        bump
    )]
    pub document_record: Account<'info, DocumentRecord>,

    #[account(mut)]
    pub issuer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_register_document(ctx: Context<RegisterDocument>, _doc_hash: [u8; 32], ipfs_cid: String) -> Result<()> {
    let document_record = &mut ctx.accounts.document_record;
    let clock = Clock::get()?;

    document_record.issuer = ctx.accounts.issuer.key();
    document_record.ipfs_cid = ipfs_cid;
    document_record.timestamp = clock.unix_timestamp;
    document_record.is_revoked = false;
    document_record.bump = ctx.bumps.document_record;

    Ok(())
}
```

### Revoke Instruction (`revoke_document.rs`)
```rust
use anchor_lang::prelude::*;
use crate::state::DocumentRecord;
use crate::error::ErrorCode;

#[derive(Accounts)]
#[instruction(doc_hash: [u8; 32])]
pub struct RevokeDocument<'info> {
    #[account(
        mut,
        seeds = [b"document", doc_hash.as_ref()],
        bump = document_record.bump,
        has_one = issuer @ ErrorCode::UnauthorizedRevocation
    )]
    pub document_record: Account<'info, DocumentRecord>,

    pub issuer: Signer<'info>,
}

pub fn handle_revoke_document(ctx: Context<RevokeDocument>, _doc_hash: [u8; 32]) -> Result<()> {
    let document_record = &mut ctx.accounts.document_record;
    document_record.is_revoked = true;
    Ok(())
}
```

---

## Database Schema (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String     @id @default(uuid())
  username     String     @unique
  email        String     @unique
  passwordHash String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  documents    Document[] @relation("UserDocuments")
}

model Document {
  id         String   @id @default(uuid())
  name       String
  ipfsCid    String   @unique
  docHash    String   @unique
  ownerId    String
  owner      User     @relation("UserDocuments", fields: [ownerId], references: [id])
  createdAt  DateTime @default(now())
  sharedWith Share[]
}

model Share {
  id         String   @id @default(uuid())
  documentId String
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  sharedWith String
  createdAt  DateTime @default(now())

  @@unique([documentId, sharedWith])
}
```

---

## Backend Server (`backend/server.js`)

```javascript
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PinataSDK } = require('pinata-web3');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.PINATA_GATEWAY
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] }
    });
    if (existingUser) return res.status(400).json({ error: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await prisma.user.create({
      data: { username, email, passwordHash }
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/documents/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { docHash } = req.body;
    if (!docHash) return res.status(400).json({ error: "Missing docHash from client" });

    const blob = new Blob([req.file.buffer]);
    const fileForPinata = new File([blob], req.file.originalname, { type: req.file.mimetype });
    
    const pinataRes = await pinata.upload.file(fileForPinata).addMetadata({
      name: req.file.originalname,
      keyValues: {
        ownerId: req.user.id,
        ownerEmail: req.user.email,
        docHash: docHash
      }
    });

    const ipfsCid = pinataRes.IpfsHash;

    await prisma.document.create({
      data: {
        name: req.file.originalname,
        ipfsCid,
        docHash,
        ownerId: req.user.id
      }
    });

    res.status(201).json({ 
      message: "Upload successful", 
      document: { name: req.file.originalname, ipfsCid, docHash, ownerEmail: req.user.email } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents', authenticateToken, async (req, res) => {
  try {
    const myDocs = await prisma.document.findMany({ where: { ownerId: req.user.id } });
    const sharedWithMe = await prisma.document.findMany({
      where: { sharedWith: { some: { sharedWith: req.user.email } } },
      include: { owner: { select: { username: true } } }
    });
    res.json({ myDocs, sharedWithMe });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
```

---

## Frontend State & Route Security

The frontend implements session-scoped states to prevent cached token and wallet adapter security issues.
- The JWT authorization token is saved in `sessionStorage` instead of `localStorage`.
- The wallet provider is configured with `autoConnect={false}`.
- Storage clear-downs for tokens and selected wallet instances run inside `App.jsx` on launch.

```javascript
  useEffect(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('walletName');
  }, []);
```

---

## Local Setup & Development

### 1. Install Dependencies
Run from the root workspace folder:
```bash
npm run install:all
```

### 2. Database Environment Setup
Create a `.env` file in the `backend/` folder:
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/proofchain?schema=public"
JWT_SECRET="your_jwt_secret"
PINATA_JWT="your_pinata_jwt"
PINATA_GATEWAY="https://your_gateway.mypinata.cloud"
```
Run the migrations:
```bash
cd backend
npx prisma db push
```

### 3. Launch Development Stack
To launch the backend, frontend, local validator, and deploy the program automatically:
```bash
npm run dev:all
```

This starts a clean local ledger inside your native Linux directory (`~/test-ledger`) to bypass filesystem locking bugs on mounted Windows drives, waits for the RPC port to boot up, and executes `anchor build` and `anchor deploy` automatically.

---

## Public Cluster Deployment

### 1. Program ID Updates
Update the program address in your configuration files:
- `blockchain/Anchor.toml`
- `blockchain/programs/blockchain/src/lib.rs`
- `frontend/src/utils/solana.js`

### 2. Target Settings
Set the target network in `blockchain/Anchor.toml`:
```toml
[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

### 3. Deploy
Ensure your local validator key has devnet SOL, then build and deploy the contract:
```bash
cd blockchain
anchor build
anchor deploy
```

---

## Troubleshooting

- **`net::ERR_CONNECTION_REFUSED`**: The local validator is not running. Check the terminal outputs or run `solana-test-validator --ledger ~/test-ledger --reset` manually.
- **`UnspecifiedIpAddr(0.0.0.0)`**: Gossip cannot bind to `0.0.0.0`. Run the validator without `--bind-address 0.0.0.0` (which is the default configuration).
- **`Attempt to load a program that does not exist`**: The contract is not deployed. Go to the `blockchain/` folder and run `anchor deploy`.
- **Phantom Wallet does not respond**: Check that Phantom is set to Developer Mode and the network is switched to Localhost (`http://127.0.0.1:8899`).
- **WSL Filesystem Locks**: Do not run the validator ledger on your mounted Windows drive `/mnt/c/`. Instead, use a native Linux directory such as `~/test-ledger` with the `--ledger` flag.

---

## Production Deployment

### Production Dockerfile (`backend/Dockerfile`)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma/
RUN npx prisma generate
COPY . .

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/server.js ./
EXPOSE 3001
CMD ["node", "server.js"]
```

### Production Nginx Reverse Proxy Config (`nginx.conf`)
```text
server {
    listen 80;
    server_name proofchain.domain.com;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
