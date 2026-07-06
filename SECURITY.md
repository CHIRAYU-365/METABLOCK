# METABLOCK & PROOFCHAIN: SECURITY SPECIFICATIONS AND THREAT DEFENSE MANUAL

This document details the security posture, threat modeling, and defensive controls implemented across the **METABLOCK** workspace (focusing on the **ProofChain** subsystem). It describes how the project mitigates common Web2 vulnerabilities, Web3 blockchain attack vectors, and specialized malware or user-centric exploits.

---

## 🛡️ Executive Summary of Security Controls

ProofChain integrates defense-in-depth across three layers:
1. **The Client (Vite React PWA):** Local cryptographic operations ensure raw document content never leaves the user's browser.
2. **The API Gateway (Node.js Express 5 + Prisma Postgres):** Sanitization, rate-limiting, secure headers, and strict authentication middleware protect the cache layer.
3. **The Ledger (Solana Devnet):** Rust-based Anchor programs enforce cryptographic constraints, preventing identity spoofing and collision attacks.

---

## 🔍 Attack Vectors & Defensive Implementations

### 1. On-Chain Re-Registration & Double Claiming (Collision Attacks)
* **The Threat:** An attacker attempts to register an existing document under their own name/key or replace an active document's metadata to claim false ownership.
* **The Defense:** 
  * Document registry addresses are derived as **Program Derived Addresses (PDAs)** using Solana's deterministic seed generation.
  * Seeds used: `[b"document", SHA-256_hash_of_document]`.
  * In the Rust program ([register_document.rs](file:///c:/Users/chira/OneDrive/ドキュメント/METABLOCK/METABLOCK/PROOFCHAIN/blockchain/programs/blockchain/src/instructions/register_document.rs)), the `init` constraint is applied:
    ```rust
    #[account(
        init,
        payer = issuer,
        space = DocumentRecord::MAX_SIZE,
        seeds = [b"document", doc_hash.as_ref()],
        bump
    )]
    ```
  * If the SHA-256 file hash matches an already registered document, Solana's runtime rejects the initialization, preventing duplicate or overlapping registries.

---

### 2. Unauthorized Revocation & Privilege Escalation (Access Control Bypass)
* **The Threat:** A malicious agent or compromised key tries to revoke certificates issued by legitimate administrators.
* **The Defense:**
  * The Anchor program enforces structural owner-checks on the PDA storage accounts.
  * In the revocation contract ([revoke_document.rs](file:///c:/Users/chira/OneDrive/ドキュメント/METABLOCK/METABLOCK/PROOFCHAIN/blockchain/programs/blockchain/src/instructions/revoke_document.rs)), the `has_one = issuer` constraint is defined:
    ```rust
    #[account(
        mut,
        seeds = [b"document", doc_hash.as_ref()],
        bump = document_record.bump,
        has_one = issuer
    )]
    pub document_record: Account<'info, DocumentRecord>,
    pub issuer: Signer<'info>,
    ```
  * This automatically asserts that `document_record.issuer == issuer.key()`. If any other address attempts to sign the transaction, the instruction fails at the validator consensus level.

---

### 3. Cross-Site Scripting (XSS)
* **The Threat:** Attackers input malicious JavaScript payloads in fields like user names, document titles, or emails, which execute inside another user's (e.g. Super Admin) dashboard.
* **The Defense:**
  * Express 5 query parameters (`req.query`) are read-only properties under getters. Standard sanitizers that overwrite query objects will crash the server.
  * In [app.js](file:///c:/Users/chira/OneDrive/ドキュメント/METABLOCK/METABLOCK/PROOFCHAIN/backend/src/app.js), a custom, crash-free **in-place sanitization engine** targets `req.body`, `req.query`, and `req.params`:
    ```javascript
    const sanitizeHtml = (str) => {
      if (typeof str !== 'string') return str;
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    };
    ```
  * This escaping engine mutates values directly within references, preventing script injections without breaking the Express 5 framework.

---

### 4. Denial of Service (DoS) via Large Payloads & API Flooding
* **The Threat:** Bad actors send extremely large JSON files or spam the upload/auth APIs to crash the Node process and degrade system availability.
* **The Defense:**
  * **Payload Limits:** App-wide JSON parsing in [app.js](file:///c:/Users/chira/OneDrive/ドキュメント/METABLOCK/METABLOCK/PROOFCHAIN/backend/src/app.js) is locked down to `10kb`:
    ```javascript
    app.use(express.json({ limit: '10kb' }));
    ```
  * **Rate Limiting:** Scoped `express-rate-limit` guards are deployed to defend against automated scans:
    * `/api/auth`: Restricted to 10 attempts per 5 minutes.
    * `/api/documents/upload`: Restricts file registration requests to 50 uploads per hour.
    * Public routes: Dynamic fallback rate limits (100 requests per 15 minutes) protect General APIs.

---

### 5. SQL Injection (SQLi)
* **The Threat:** Attackers manipulate input parameters to execute raw commands on the Neon PostgreSQL database.
* **The Defense:**
  * ProofChain integrates **Prisma ORM**. Database queries are constructed using Prisma's query engine, which implements parameterized queries and prevents user inputs from altering SQL logic.
  * System models (like `User`, `AuditLog`, and `DocumentRequest`) are strictly defined in [schema.prisma](file:///c:/Users/chira/OneDrive/ドキュメント/METABLOCK/METABLOCK/PROOFCHAIN/backend/prisma/schema.prisma) with explicit data-types.

---

### 6. Document Theft & Data Leakage (Privacy Exposure)
* **The Threat:** Sensitive documents (e.g. employee IDs, grade transcripts, or medical records) are leaked to unauthorized parties when uploaded to a central database or a public blockchain.
* **The Defense:**
  * **Zero-Knowledge (ZK) Selective Disclosure:** The browser client implements a ZK proof simulator using salted hashes. Instead of uploading the raw document metadata, fields (like `name` and `email`) are salted and hashed individually to generate a combined root hash. When verifying claims, users can selectively disclose a field along with its salt; the verifier reconstructs the root hash to compare with the on-chain value without learning any redacted fields.
  * **Client-Side Hashing:** When checking document validity, the file is hashed locally inside the browser using the native Web Crypto API (`crypto.subtle.digest`). The raw file is never uploaded to the backend server during verification.

---

### 7. Broken Object Level Authorization (BOLA / IDOR)
* **The Threat:** An authenticated standard user manipulates request URLs to view Super Admin records or access logs from other employees.
* **The Defense:**
  * Endpoints are protected by `authenticateToken` middleware which decodes and validates JWTs.
  * Strict role-based checks (`requireRole(['ADMIN'])` or `requireRole(['SUPER_ADMIN'])`) are applied directly on routes. For example, Super Admin logs and dashboards utilize isolated router scopes that reject non-authorized tokens immediately.

---

### 8. HTTP Header & Session Hijacking
* **The Threat:** Man-in-the-Middle (MitM) eavesdropping, clickjacking, or cross-site request forgery.
* **The Defense:**
  * The backend configures **Helmet.js** to secure response headers:
    * **Content Security Policy (CSP):** Restricts script sources to `'self'` and blocks inline execution.
    * **HTTP Strict Transport Security (HSTS):** Enforced for 365 days (`maxAge: 31536000`), including subdomains and preloading.
    * **Frame Protection:** Frame embedding is disabled (`frameSrc: ["'none'"]`) to prevent Clickjacking.
  * CORS settings restrict origin access to specific allowed domains and Vercel deployments, blocking unauthorized external fetch requests.

---

### 9. QR Code Replay Attacks (Attendance Tracker)
* **The Threat:** An employee copies another worker's QR attendance card to register fraudulent check-ins or check-outs.
* **The Defense:**
  * The system implements a deterministic state machine for scanning.
  * When a QR code is read, the system fetches the user's last audit log. If the last recorded action was a check-in, the system only allows a check-out (computing working hours). If the last action was a check-out, the system registers a check-in.
  * Timestamps are validated server-side based on the database transaction time, preventing local clock manipulation on the scanning device.

---

## 🛡️ Malware & Client-Side Phishing Defenses

### Wallet Adapter Isolation
ProofChain interacts with the Solana network via official, vetted wallet adapters (`@solana/wallet-adapter-react`). These adapters run inside isolated browser sandbox environments. Transactions are initiated by the application, but must be explicitly approved and signed inside the Phantom/Solana extension container, preventing malware from signing transactions silently.

### Input Parameter Validation (Zod)
Malicious inputs designed to exploit buffer overflows or language quirks (e.g. prototype pollution) are filtered out via **Zod schema validation** at the API gateway entry point before parsing. Any input containing anomalous characters or out-of-bound strings is rejected with an HTTP 400 response.
