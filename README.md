# PROOFCHAIN: ENTERPRISE DECENTRALIZED TRUST SYSTEM

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200" width="100%" height="auto" style="background:#0f0f15; border-radius:12px; border:1px solid rgba(99, 102, 241, 0.2); margin-bottom: 20px;">
  <style>
    @keyframes pulse {
      0% { opacity: 0.3; }
      50% { opacity: 0.8; }
      100% { opacity: 0.3; }
    }
    @keyframes dash {
      to {
        stroke-dashoffset: -40;
      }
    }
    @keyframes glow-text {
      0% { text-shadow: 0 0 5px rgba(99,102,241,0.5), 0 0 10px rgba(99,102,241,0.3); }
      50% { text-shadow: 0 0 15px rgba(168,85,247,0.8), 0 0 30px rgba(168,85,247,0.5); }
      100% { text-shadow: 0 0 5px rgba(99,102,241,0.5), 0 0 10px rgba(99,102,241,0.3); }
    }
    .neon-text {
      fill: #ffffff;
      font-family: 'Outfit', 'Segoe UI', system-ui, sans-serif;
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 6px;
      animation: glow-text 4s ease-in-out infinite;
    }
    .grid-lines {
      stroke: rgba(99, 102, 241, 0.05);
      stroke-width: 1;
    }
    .circuit-path {
      stroke: #6366f1;
      stroke-width: 2;
      stroke-dasharray: 8, 4;
      animation: dash 2s linear infinite;
    }
    .circuit-path-purple {
      stroke: #a855f7;
      stroke-width: 2;
      stroke-dasharray: 8, 4;
      animation: dash 3s linear infinite reverse;
    }
  </style>

  <!-- Background Grid -->
  <g class="grid-lines">
    <path d="M 0 50 L 800 50 M 0 100 L 800 100 M 0 150 L 800 150" />
    <path d="M 100 0 L 100 200 M 200 0 L 200 200 M 300 0 L 300 200 M 400 0 L 400 200 M 500 0 L 500 200 M 600 0 L 600 200 M 700 0 L 700 200" />
  </g>

  <!-- Circuit Paths -->
  <path d="M 50 100 L 250 100 L 300 50 L 500 50 L 550 100 L 750 100" fill="none" class="circuit-path" />
  <path d="M 80 150 L 200 150 L 250 100 L 550 100 L 600 150 L 720 150" fill="none" class="circuit-path-purple" />

  <!-- Nodes -->
  <circle cx="300" cy="50" r="4" fill="#6366f1" />
  <circle cx="500" cy="50" r="4" fill="#6366f1" />
  <circle cx="250" cy="100" r="4" fill="#a855f7" />
  <circle cx="550" cy="100" r="4" fill="#a855f7" />

  <!-- Title Text -->
  <text x="50%" y="115" text-anchor="middle" class="neon-text">PROOFCHAIN</text>
  <text x="50%" y="145" text-anchor="middle" fill="#94a3b8" font-family="system-ui" font-size="12" font-weight="600" letter-spacing="2">DECENTRALIZED ENTERPRISE ATTESTATION LAYER</text>
</svg>

<p align="center">
  <img src="https://img.shields.io/badge/Solana-9b51e0?style=for-the-badge&logo=solana&logoColor=white" alt="Solana" />
  <img src="https://img.shields.io/badge/Rust-black?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61dafb" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white" alt="IPFS" />
</p>

---

## ⚡ IMMERSIVE INTERACTIVE README PLAYGROUND

To experience this project in a futuristic, sci-fi inspired dashboard, open the custom interactive README page in your web browser:

> [!IMPORTANT]
> ### 🖥️ Launch the Holographic Dashboard
> Double-click **[`README.html`](file:///c:/Users/chira/OneDrive/Desktop/METABLOCK/METABLOCK/README.html)** to run it immediately in your browser. 
> 
> *Alternatively, open it via terminal:*
> - **Windows PowerShell**: `Start-Process README.html`
> - **macOS**: `open README.html`
> - **Linux**: `xdg-open README.html`

### What is inside the Interactive Dashboard?
1. **Solana PDA Derivation Lab**: Dynamically compute Program Derived Addresses using seed algorithms (`["document", fileHash]`) and simulate wallet signature requests.
2. **Zero-Knowledge Proof Playground**: Construct cryptographic claims, dynamically generate salts, redact specific attributes, and verify Merkle root hash reconstructions against on-chain states.
3. **QR Attendance Terminal Scanner**: Simulate employee check-ins and check-outs with laser visual scanning, audio diagnostic feedback, and real-time shift calculations.
4. **Interactive Network Map**: Browse a dynamic network topology detailing data structures, API endpoints, and database models.
5. **Futuristic Terminal CLI**: Query mock databases, evaluate system component health, derive keys, and run diagnostic scans using command prompts.

---

## 📂 Core Repository Architecture

ProofChain is designed as a hybrid Web2/Web3 application. The architecture divides operations across three key directories:

* **[`PROOFCHAIN/blockchain/`](file:///c:/Users/chira/OneDrive/Desktop/METABLOCK/METABLOCK/PROOFCHAIN/blockchain)**: Solana programs written in Rust using the Anchor Framework. It manages PDAs, anchors document hashes, and hosts validation states.
* **[`PROOFCHAIN/backend/`](file:///c:/Users/chira/OneDrive/Desktop/METABLOCK/METABLOCK/PROOFCHAIN/backend)**: Node.js/Express API gateway that caches metadata inside Neon PostgreSQL, integrates with Prisma ORM, pushes file buffers to Pinata IPFS, and dispatches verification mailer records.
* **[`PROOFCHAIN/frontend/`](file:///c:/Users/chira/OneDrive/Desktop/METABLOCK/METABLOCK/PROOFCHAIN/frontend)**: A React client compiled using Vite & Rolldown that computes cryptographic document hashes locally using the Web Crypto API, generates QR attendance assets, and executes ZKP selective disclosures.

---

## ⚙️ Quick Start Installation

For details on local developer setup, check the developer manual in the sub-repository:
👉 **[PROOFCHAIN Development Manual](file:///c:/Users/chira/OneDrive/Desktop/METABLOCK/METABLOCK/PROOFCHAIN/README.md)**

```bash
# 1. Clone & Enter the ProofChain workspace
cd PROOFCHAIN

# 2. Configure Backend ENV variables
# Copy configuration parameters inside backend
cp backend/.env.example backend/.env

# 3. Setup and Run Local Development Environments
# Runs backend API, database migrations, and frontend Client in parallel
npm run dev
```

---

## 🛡️ Enterprise Security Operations

- **Zero Data Transmission Hashing**: All document checks calculate hashes locally within the client browser via the Web Crypto API. Raw sensitive document contents are never transmitted across networks.
- **Selective Redaction Proofs**: ZKP constructs allow users to verify single claims (e.g. proving a designation matches) without exposing names or other fields.
- **In-place Escaping Engines**: Backend middleware executes custom recursive string scrubbing, preventing cross-site scripting (XSS) under Express 5 dynamic object constraints.

---

*Designed and Developed for the METABLOCK Internship Program. Check out [SECURITY.md](file:///c:/Users/chira/OneDrive/Desktop/METABLOCK/METABLOCK/SECURITY.md) for vulnerability reports.*