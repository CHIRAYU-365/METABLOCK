# METABLOCK: ENTERPRISE TRUST & DECENTRALIZED DATA PLATFORM

Welcome to the **METABLOCK** workspace. METABLOCK is a repository containing enterprise-grade Web3 integrations, with its flagship application being **ProofChain**—an advanced, hybrid document verification, multi-signature attestation, and automated workforce attendance system.

By combining the speed of Web2 database caches (Neon PostgreSQL) with the absolute trust of Solana Devnet ledger, METABLOCK builds systems that are performant, secure, and resilient against data tampering.

---

## 📁 Repository Structure

The METABLOCK workspace is structured as follows:

```
METABLOCK/
├── PROOFCHAIN.md         # Full systems & architecture specification for ProofChain
├── SECURITY.md           # Comprehensive Threat Model, Security Controls, and Defense Guide
├── README.md             # Workspace overview (This file)
└── PROOFCHAIN/           # ProofChain Application Workspace
    ├── frontend/         # Vite + React client app (Client-side hashing, QR scanning, PWA)
    ├── backend/          # Express 5 API Gateway + Prisma ORM (Metadata cache, JWT, Rate Limiting)
    ├── blockchain/       # Solana Smart Contract Program (Rust + Anchor Framework)
    ├── deploy-anchor.js  # Node.js anchor deploy coordinator (Cross-platform)
    └── package.json      # Workspace scripts to run validator, frontend, and backend concurrently
```

---

## 🔗 Flagship Project: ProofChain

The core technology currently housed under METABLOCK is **ProofChain**, an enterprise-grade document registration and workforce attendance tracker. 

### Key Features:
1. **Cryptographic Identity Management:** Link standard credentials to Solana wallet adapters (e.g. Phantom Wallet).
2. **Client-Side Hashing:** Cryptographically verify document integrity locally via the Web Crypto API without uploading the raw file to any server.
3. **Decentralized Storage (IPFS):** Immutable metadata storage pinned via Pinata.
4. **On-Chain Document Registry:** Derived PDA-based document validation records on the Solana Devnet ledger.
5. **Zero-Knowledge Proof (ZKP) Simulator:** Share selective fields of a document (e.g. verify email without revealing GPA) through salted field hashing and browser-constructed root hashes.
6. **Automatic QR Attendance Tracker:** QR-based check-in/check-out with automatic shift duration computations stored in secure logs.
7. **Role-Based Access Control (RBAC):** Tiered dashboards from Public Visitors to Admins and Super Admins.

For the full detailed specifications, refer to [PROOFCHAIN.md](file:///c:/Users/chira/OneDrive/ドキュメント/METABLOCK/METABLOCK/PROOFCHAIN.md).

---

## 🛡️ Security & Defense Architecture

The METABLOCK workspace is designed with security as a core pillar. A comprehensive breakdown of how the platform defends against threats—ranging from Sybil attacks on-chain to Cross-Site Scripting (XSS), Parameter Pollution, and Denial of Service (DoS) attacks on the backend—is available in [SECURITY.md](file:///c:/Users/chira/OneDrive/ドキュメント/METABLOCK/METABLOCK/SECURITY.md).

---

## 🚀 Quick Start Guide

To run the full suite locally, follow the steps below:

### Prerequisites
Make sure you have the following installed:
* [Node.js](https://nodejs.org/) (v18.0.0 or higher)
* [Rust](https://www.rust-lang.org/) and [Solana CLI Tools](https://docs.solanalabs.com/cli/install) (if running local validators)
* [Anchor Framework](https://www.anchor-lang.com/docs/installation)

### 1. Installation
Navigate to the `PROOFCHAIN` directory and install dependencies for all components:
```bash
cd PROOFCHAIN
npm run install:all
```
This runs workspace-wide installations, including `frontend` dependencies (with peer dependency compatibility) and `backend` Prisma generator scripts.

### 2. Configuration
Configure the `.env` file inside the `PROOFCHAIN/backend` directory (using `.env.example` as a template) with your Neon PostgreSQL URL, Pinata keys, and JWT secrets.

### 3. Running the Workspace
The project provides several convenience scripts inside [PROOFCHAIN/package.json](file:///c:/Users/chira/OneDrive/ドキュメント/METABLOCK/METABLOCK/PROOFCHAIN/package.json):

* **Concurrent Frontend & Backend (Default Web2/Web3 Dev):**
  Useful when connecting to Solana Devnet.
  ```bash
  npm run dev
  ```

* **Full Sandbox Environment (Local Solana Validator + Deploy + Servers):**
  Spins up a local Solana test validator, deploys the Anchor program via the cross-platform Node script, and starts both backend & frontend.
  ```bash
  npm run dev:all
  ```

* **Individual Subsystems:**
  * Backend: `npm run dev:backend`
  * Frontend: `npm run dev:frontend`
