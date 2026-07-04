# PROOFCHAIN: ENTERPRISE DOCUMENT REGISTRATION AND ATTENDANCE SYSTEMS
## COMPREHENSIVE ARCHITECTURAL DESIGN AND SYSTEM REQUIREMENTS SPECIFICATION
### VERSION TWO POINT ZERO - PRODUCTION READY MANUAL

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/solana/solana-original.svg" alt="Solana" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-plain.svg" alt="Rust" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" alt="React" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg" alt="Node.js" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg" alt="Express" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" alt="PostgreSQL" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/prisma.svg" alt="Prisma" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/ipfs.svg" alt="IPFS" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/netlify/netlify-original.svg" alt="Netlify" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/railway.svg" alt="Railway" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
  <img src="https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/pwa.svg" alt="PWA" width="36" height="36" style="background: #ffffff; padding: 8px; border-radius: 50%; margin: 4px; vertical-align: middle; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />
</p>

---

## SECTION 1: INTRODUCTION AND EXECUTIVE SUMMARY

ProofChain is a highly scalable, enterprise-grade hybrid document verification, signature attestation, and automated workforce attendance system. By combining the cryptographic trust of the Solana Devnet blockchain with the cost-effective and immutable storage capabilities of the InterPlanetary File System, the platform delivers verifiable credential proofing without compromises in speed, cost, or security. 

Beyond core cryptographic document issuing and verification, the platform features a complete multi-signature approval pipeline, zero-knowledge selective disclosure, and a fully automated check-in and check-out attendance system. The attendance system tracks employee logins and camera-based QR scans, automatically computing shift durations, active sessions, and working hours, which are securely compiled into tabular displays reserved exclusively for the platform's Super Admins.

The primary objective of the ProofChain platform is to bridge the gap between centralized databases and decentralized ledgers. Centralized systems suffer from vulnerabilities such as single-point-of-failure database tampering, while fully decentralized architectures suffer from high latency, expensive transaction fees, and lack of searchability. ProofChain addresses this by implementing a Web2 cache metadata layer using PostgreSQL, synced automatically with the Solana ledger. Any document verified on the platform is hashed locally inside the user's browser, meaning raw files are never transmitted or uploaded during the verification process, preserving complete data confidentiality.

---

## SECTION 2: SYSTEM REQUIREMENTS SPECIFICATION (SRS)

<details>
<summary><b>System Requirements & Privileges Detailed Manual</b></summary>

### 2.1 PRODUCT SCOPE
The software product operates in a Web3 browser environment, utilizing cryptographic keypairs generated by the Solana wallet adapter alongside standard session tokens generated by a JSON Web Token microservice. The system consists of three distinct client dashboards optimized for different privilege tiers, a public-facing verification gateway, a secure backend API, a relational database cache, and a smart contract deployed on the Solana Devnet.

### 2.2 USER CLASSES AND PRIVILEGE LEVELS
The system recognizes three categories of authenticated accounts, plus one unauthenticated visitor class:

| Privilege Level | Role Title | Key Functional Capabilities |
| :--- | :--- | :--- |
| Tier One | Super Admin | Accesses global audits, reviews multi-sig drafts, updates user roles, revokes admin privileges, views shift logs popup. |
| Tier Two | Admin | Issues documents directly/multi-sig, classifies files locally, revokes certificates, performs bulk uploads via CSV. |
| Tier Three | User / Employee | Views personal certificates, signs key ownership, displays QR card for check-in/out, generates ZK URLs. |
| Tier Four | Public Visitor | Verifies documents via hash calculation, verifies partial claims via reconstructed zero-knowledge root hashes. |

---

### 2.3 FUNCTIONAL REQUIREMENTS
1. **Cryptographic Identity Management:**
   - The system must link standard user logins to Solana wallet addresses.
   - Users must be able to bind their Phantom Wallets to prove document ownership.

2. **Decentralized Storage (IPFS) Pipeline:**
   - Raw certificates uploaded by admins must be stored on IPFS.
   - The system must generate unique IPFS Content Identifiers (CIDs) representing the metadata schema.

3. **On-Chain Document Registry:**
   - The Solana smart contract must register document records as Program Derived Addresses (PDAs) using the SHA-256 file hash as a seed.
   - Each registered document must store the issuer's public key, the IPFS CID, registration timestamp, and the revocation status.

4. **Multi-Signature Approval Workflow:**
   - Multi-sig document registrations must store intermediate transaction states in the database.
   - The Super Admin must be able to review, sign, and broadcast these transactions to the Solana ledger.

5. **Real-Time Revocation Synchronization:**
   - When an Admin revokes a certificate, the system must broadcast a transaction updating the ledger status to revoked.
   - Both the Admin and User dashboards must query the ledger in real-time and immediately filter out revoked certificates.

6. **Automatic QR Attendance Tracker:**
   - The login page must feature a toggle to activate a web-camera QR code scanner.
   - The scanner must read the employee's ID from their dashboard QR card.
   - The system must determine if the employee is checking in or checking out by checking their last audit state.
   - The system must compute shift durations on checkout and notify the user instantly.

7. **Audit Logging & Report Display:**
   - The database must record logins, checks, registration actions, and IP addresses.
   - The Super Admin must be able to view calculated shift working records in a popup table.

### 2.4 NON-FUNCTIONAL REQUIREMENTS
1. **Performance & Latency:**
   - Web2 cached queries (such as listing available documents) must resolve in under one hundred milliseconds.
   - Web3 queries must poll the Solana RPC validator cluster and resolve transaction confirmations within five seconds.
   - Local document hashing via Web Crypto API must execute in under fifty milliseconds for files under fifty megabytes.

2. **Security & Confidentiality:**
   - The database must never store plain-text passwords; all passwords must be hashed using bcrypt with a work factor of ten.
   - JWT tokens must expire after twenty-four hours to mitigate token theft attacks.
   - API endpoints must be protected with role-based check middleware.
   - Sensitive endpoints (like document uploads) must enforce rate limiting to prevent denial-of-service attempts.

3. **Scalability:**
   - Database tables must use composite indexes to ensure rapid queries under millions of log records.
   - The frontend must register a service worker to leverage PWA caching, offloading asset delivery from the server.

4. **Compatibility & Responsiveness:**
   - The system must be fully responsive, rendering correctly on mobile screens (for scanner usage) and desktop screens.
   - The frontend must run on all modern browsers supporting the Web Crypto API and WebRTC camera stream protocols.

</details>

---

## SECTION 3: SYSTEM ARCHITECTURE AND TECH STACK

<details>
<summary><b>System Architecture Diagrams & Technology Directory</b></summary>

### 3.1 LOGICAL TOPOLOGY & SYSTEM COMPONENTS

```mermaid
graph TD
    ClientApp[Vite React Client Application] -->|JWT Auth Requests| ExpressBackend[Express API Backend]
    ClientApp -->|Read PDA State| SolanaLedger[Solana Devnet Validator Node]
    ExpressBackend -->|Query/Update State| PostgresDB[(Neon PostgreSQL Database)]
    ExpressBackend -->|Store Metadata Payload| IPFSGateway[Pinata IPFS Gateway]
    ExpressBackend -->|Dispatch Emails| SMTPClient[Nodemailer Dispatcher]
    SuperAdminDashboard[Super Admin Page] -->|Sign & Broadcast Multi-Sig| ExpressBackend
    ExpressBackend -->|Initialize Account| SolanaLedger
```

### 3.2 DETAILED TECH STACK DIRECTORY
The platform is built using the following technologies:

- **Core Technologies:**
  - **Structure:** HTML5 standard elements for semantics.
  - **Styling:** Custom CSS with dark mode variables, hover animations, and glassmorphic designs.
  - **Runtime Framework:** React with Vite build tool.

- **Frontend Dependencies:**
  - **Routing:** React Router DOM for routing.
  - **State Management:** Custom React Context providers for session tracking.
  - **Visual Dashboards:** Recharts library for charting growth and issuance metrics.
  - **Icons:** Lucide React.
  - **CSV Parser:** PapaParse for bulk uploads and CSV exporting.
  - **QR Code Rendering:** QRCode.react for canvas-based QR card displays.
  - **QR Code Scanning:** Html5-qrcode wrapper for camera capture and stream decoding.
  - **Solana Web3 Interface:** `@solana/web3.js` and `@solana/wallet-adapter-react`.
  - **Anchor Framework Integration:** `@coral-xyz/anchor`.

- **Backend Architecture:**
  - **Runtime environment:** Node.js.
  - **API Framework:** Express.js.
  - **Object Relational Mapper:** Prisma ORM.
  - **Security Tools:** bcryptjs for credentials, jsonwebtoken for sessions, express-rate-limit for abuse prevention.
  - **Mail Dispatcher:** Nodemailer with dynamic Ethereal Mail fallbacks.
  - **File Handler:** Multer for memory buffers during upload streams.

- **Blockchain Environment:**
  - **Smart Contract Language:** Rust.
  - **Blockchain SDK:** Anchor Framework.
  - **Target Network:** Solana Devnet.

- **Infrastructure & Storage:**
  - **Relational Database:** PostgreSQL hosted on Neon.
  - **Decentralized Storage:** Pinata IPFS Gateway.
  - **Frontend Hosting:** Netlify.
  - **Backend Hosting:** Railway.app.

</details>

---

## SECTION 4: DETAILED COMPONENT SPECIFICATIONS

<details>
<summary><b>Component Operations & Technical Working</b></summary>

### 4.1 THE FRONTEND CLIENT APPLICATION (VITE + REACT)
The frontend application acts as the hub for user interactions. It is responsive and handles local cryptographic operations to ensure maximum user privacy.

#### 4.1.1 Local Hashing Engine
The local hashing engine uses the browser's native Web Crypto API. When an admin uploads a certificate or a visitor drops a file to verify it, the engine calculates the SHA-256 hash locally. This client-side hashing ensures that the contents of a file are never sent to the network for verification, providing a high level of security.

#### 4.1.2 Zero-Knowledge Proof (ZKP) Simulator
The ZKP simulator allows users to verify specific claims of a credential without revealing the full dataset. Using SHA-256 hashing and unique random salts for each metadata field (e.g. name, email, role), the component generates a set of hashes. If a user only wants to share their email, the simulator exposes the email and its salt, but provides only the raw hashes of the redacted fields. The verifier combines these to reconstruct the root hash, which is checked against the on-chain registry to confirm the credential's validity.

#### 4.1.3 Progressive Web App (PWA) Layer
The PWA layer consists of a service worker and a manifest file. The service worker caches key assets like HTML, CSS, logos, and scripts, allowing the application to load quickly even under unstable connections. This is especially useful for mobile device screens when scanning employee QR codes.

---

### 4.2 THE BACKEND API MICROSERVICE (NODE.JS + EXPRESS)
The backend service processes business logic, handles database operations through Prisma, and interacts with external services like Pinata IPFS and Nodemailer.

#### 4.2.1 Authentication & Authorization
The authentication system secures endpoints using JWT. When a user logs in, the backend validates their credentials against the PostgreSQL database using bcrypt. If verified, it returns a JWT containing their user profile and role privileges, which is sent along in the header of subsequent requests.

#### 4.2.2 Document Upload & AI Heuristics
When an Admin registers a document, the backend receives the file stream via Multer, validates it against rate limits, and processes it. Heuristic rules inspect the file metadata and name to generate automated category tags and keywords. The file is then uploaded to Pinata IPFS to obtain a permanent content identifier (CID), and a database request record is created.

#### 4.2.3 Automatic Email Service
The email service is powered by Nodemailer. When a certificate is registered on the blockchain, the backend dispatches a verification notification containing the dynamic verification URL, the document hash, and the IPFS CID link. If no custom SMTP credentials are provided, the service falls back to generating an Ethereal Mail sandbox account and printing the preview link in the backend console logs.

---

### 4.3 THE BLOCKCHAIN LAYER (SOLANA PROGRAM)
The blockchain program is written in Rust using the Anchor framework, managing registration states on the Solana ledger.

#### 4.3.1 Account PDA Structure
Document accounts on Solana are derived dynamically using the string literal `document` and the unique 32-byte file hash as seeds. This allows the frontend to derive the account address directly, without needing to look up a map index.

#### 4.3.2 On-Chain Registration
The registration function registers the document hash, issuer address, IPFS CID, and timestamp to the derived PDA. If a PDA is already initialized, the transaction is rejected, preventing double-registration.

#### 4.3.3 On-Chain Revocation
The revocation function allows the issuer to mark a document account as revoked. The smart contract validates that the transaction signer matches the issuer address saved in the PDA account before writing the change.

---

### 4.4 THE PERSISTENCE LAYER (NEON POSTGRESQL)
The Neon PostgreSQL database acts as a Web2 metadata cache. It stores user accounts, system configuration states, pending multi-sig registration requests, and audit logs.

#### 4.4.1 Schema Indexing
To keep query times fast as audit records grow, the schema applies compound database indexes on frequently queried columns:
- **`AuditLog`**: Indexes are set on the user identifier and action columns, ensuring quick loads of user-specific histories.
- **`DocumentRequest`**: Indexes are set on the issuer and request status columns, keeping multi-sig dashboards responsive.

</details>

---

## SECTION 5: COMPONENT LINKAGE AND DATA FLOWS

<details>
<summary><b>Linked Workflows & Interactive System State Machines</b></summary>

### 5.1 VERIFICATION & ATTENDANCE WORKFLOW GRAPHICAL ANIMATION
Below is a live animated vector diagram mapping the interactive verification and data flow inside ProofChain:

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 220" width="100%" height="auto" style="background:#0f0f15; border-radius:12px; border:1px solid rgba(255,255,255,0.05); margin: 1rem 0;">
  <style>
    @keyframes flow {
      0% { stroke-dashoffset: 24; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes glow {
      0% { filter: drop-shadow(0 0 2px #6366f1); }
      50% { filter: drop-shadow(0 0 10px #a855f7); }
      100% { filter: drop-shadow(0 0 2px #6366f1); }
    }
    .flow-line { stroke: #6366f1; stroke-width: 2; stroke-dasharray: 6, 6; animation: flow 2s linear infinite; }
    .flow-line-reverse { stroke: #a855f7; stroke-width: 2; stroke-dasharray: 6, 6; animation: flow 2s linear infinite reverse; }
    .node { animation: glow 4s ease-in-out infinite; }
    .text-val { fill: #a1a1aa; font-family: 'Outfit', sans-serif; font-size: 11px; font-weight: 500; }
    .title-val { fill: #ffffff; font-family: 'Outfit', sans-serif; font-size: 13px; font-weight: bold; }
  </style>

  <!-- Connection Lines -->
  <line x1="160" y1="110" x2="340" y2="60" class="flow-line" />
  <line x1="160" y1="110" x2="340" y2="160" class="flow-line" />
  <line x1="460" y1="60" x2="640" y2="110" class="flow-line" />
  <line x1="460" y1="160" x2="640" y2="110" class="flow-line-reverse" />

  <!-- Node 1: Browser Client -->
  <g class="node">
    <rect x="20" y="70" width="140" height="80" rx="10" fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" stroke-width="2" />
    <text x="35" y="105" class="title-val">Vite React App</text>
    <text x="35" y="125" class="text-val">Local Hash & ZKP</text>
  </g>

  <!-- Node 2: Pinata IPFS -->
  <g class="node">
    <rect x="340" y="20" width="120" height="80" rx="10" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" stroke-width="2" />
    <text x="355" y="55" class="title-val">Pinata IPFS</text>
    <text x="355" y="75" class="text-val">Immutable Storage</text>
  </g>

  <!-- Node 3: Neon SQL Database -->
  <g class="node">
    <rect x="340" y="120" width="120" height="80" rx="10" fill="rgba(34, 197, 94, 0.15)" stroke="#22c55e" stroke-width="2" />
    <text x="355" y="155" class="title-val">Neon Postgres</text>
    <text x="355" y="175" class="text-val">User & Audit logs</text>
  </g>

  <!-- Node 4: Solana Devnet Program -->
  <g class="node">
    <rect x="640" y="70" width="140" height="80" rx="10" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" stroke-width="2" />
    <text x="655" y="105" class="title-val">Solana Program</text>
    <text x="655" y="125" class="text-val">PDA Registry Ledger</text>
  </g>
</svg>

### 5.2 QR SCANNER STATE MACHINE & LOG SHIFT ALGORITHM
This state machine describes how check-ins and check-outs are calculated and processed by the system when a QR code is scanned:

```mermaid
stateDiagram-v2
    [*] --> CheckedOut : User Enters System (Default)
    CheckedOut --> CheckedIn : QR Scan / Generate CHECK_IN log
    CheckedIn --> CheckedOut : QR Scan / Compare Timestamps / Compute working hours & Log CHECK_OUT
```

1. **Step One:** The employee navigates to their dashboard to view their unique QR attendance card, which encodes their database user identifier.
2. **Step Two:** The entrance scanner reads this QR code using the camera and dispatches a secure request to the backend.
3. **Step Three:** The backend queries the last check-in or check-out audit record for this user identifier.
4. **Step Four:** If the last record was a check-out, the system registers a new check-in log. If the last record was a check-in, the system registers a check-out log, calculates the difference in timestamps, and saves the shift duration.
5. **Step Five:** The backend returns the calculation result to the scanner screen, providing instant feedback of the check-in or check-out duration.

---

### 5.3 ADMIN CERTIFICATE ISSUANCE AND MULTI-SIG APPROVAL FLOW

```mermaid
sequenceDiagram
    autonumber
    Admin->>Browser: Selects file & inputs recipient email
    Browser->>Browser: Computes local SHA-256 hash & AI heuristics
    Browser->>ExpressAPI: Transmits draft metadata & signs local request
    ExpressAPI->>PinataIPFS: Pins metadata payload to IPFS (CIDs generated)
    ExpressAPI->>PostgresDB: Saves PENDING DocumentRequest in cache database
    SuperAdmin->>ExpressAPI: Fetch pending requests list
    SuperAdmin->>SolanaDevnet: Co-signs and broadcasts transaction
    SolanaDevnet-->>SuperAdmin: Confirm on-chain validation
    ExpressAPI->>PostgresDB: Updates status to APPROVED
    ExpressAPI->>Nodemailer: Triggers automatic email notification
```

---

### 5.4 BLOCKCHAIN REVOCATION AND UI BADGES SYNCHRONIZATION FLOW
1. **Step One:** The Admin views their dashboard and decides to revoke a certificate.
2. **Step Two:** The frontend prompts the Admin's wallet to sign the revocation transaction, which is broadcast to the Solana network.
3. **Step Three:** The smart contract updates the document record's revocation flag to true on the ledger.
4. **Step Four:** The Admin's frontend queries the ledger using the derived PDA, detects the revocation state, updates its local status, and filters the certificate out of the dashboard lists.

</details>

---

## SECTION 6: SYSTEM DESIGN & SECURITY CONTROLS

<details>
<summary><b>Cryptographic Schematics & Security Designs</b></summary>

### 6.1 DATABASE SCHEMATIC REPRESENTATION
The data relationships are organized around four core entities:

1. **User Table:**
   - Holds credentials, roles, and registration states.
   - One-to-many relationship with Audit Logs.
   - One-to-many relationship with Document Requests.

2. **AuditLog Table:**
   - Captures system activities (logins, check-ins, check-outs).
   - Relies on indexing to optimize performance as records scale.

3. **DocumentRequest Table:**
   - Holds details of registrations, including hashes, CIDs, and signatures.
   - Indexed to render dashboards quickly under load.

---

### 6.2 CRYPTOGRAPHIC LEDGER SCHEMATIC REPRESENTATION
The Solana Devnet ledger manages document states through Program Derived Addresses (PDAs):

- **Seed Derivation Engine:**
  - Seed One: Constant byte representation of `document`.
  - Seed Two: Cryptographic SHA-256 hash of the certificate.
  - Derivation output: A public key that serves as the storage address for the document state.

- **On-Chain State Layout:**
  - **Issuer Public Key:** 32 bytes.
  - **IPFS CID String:** 46 bytes.
  - **Timestamp:** 8 bytes.
  - **Revocation Flag:** 1 byte.
  - **PDA Bump Seed:** 1 byte.

---

### 6.3 ZERO-KNOWLEDGE CLAIM ATTRIBUTES SCHEMATIC
The ZK selective disclosure engine structure:

```mermaid
flowchart TD
    RawClaims[Original Fields: Name, Email, GPA, CID] --> SaltGen[Generate Unique Salts Client-Side]
    SaltGen --> FieldHashing[Hash each field individually with its salt]
    FieldHashing --> CombinedHash[Combine all hashes in deterministic order]
    CombinedHash --> RootHash[Generate Root Hash - Registers on Solana]
    
    RootHash --> VerificationPortal[Verify Link]
    VerificationPortal --> InputDisclosed[User provides: Email + Email_Salt + Redacted Field Hashes]
    InputDisclosed --> RecalculateRoot[Reconstruct Root Hash in browser]
    RecalculateRoot --> CheckOnChain[Check against Solana Registry PDA]
```

- **Original Claims:**
  - Name, Email, Classification, and IPFS CID.
- **Salt Generation:**
  - Random salts are generated locally for each metadata field.
- **Selective Hashing:**
  - Salted hashes are generated for each claim.
- **Verification Reconstruction:**
  - Verifiers combine disclosed claims, their salts, and redacted hashes to reconstruct the root hash, checking it against the on-chain ledger to verify the credential's authenticity.

</details>

---

## SECTION 7: SCALABILITY AND MAINTENANCE ROADMAP

<details>
<summary><b>Scalability, Load-Balancing & Performance Roadmaps</b></summary>

To ensure the platform remains stable as user volume grows, the following optimizations are integrated:

1. **Database Queries:**
   - Composite indexes on `AuditLog` and `DocumentRequest` speed up search queries under high transaction volume.
   - Fast Web2 caching layers offload reading from the database.

2. **Progressive Web App Caching:**
   - The PWA architecture caches static assets locally, reducing server bandwidth requirements during high-traffic scan events.

3. **On-Chain Optimization:**
   - Using deterministic PDAs avoids index table queries on-chain, keeping read times sub-second regardless of the number of registered documents.
   - Multi-sig requests are compiled in the database and processed as a single transaction batch on-chain, saving gas costs.

4. **Public Verification Sandbox:**
   - Document verification is performed client-side, offloading hashing processes to the user's browser.
   - RPC queries are load-balanced across multiple public Solana validator nodes to prevent API timeouts during peak times.

</details>
