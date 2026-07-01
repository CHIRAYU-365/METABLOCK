# ProofChain

<p align="left">
  <img src="https://img.shields.io/badge/Solana-9b51e0?style=for-the-badge&logo=solana&logoColor=white" alt="Solana" />
  <img src="https://img.shields.io/badge/Rust-black?style=for-the-badge&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61dafb" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/IPFS-65C2CB?style=for-the-badge&logo=ipfs&logoColor=white" alt="IPFS" />
  <img src="https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />
</p>

- ProofChain is a secure, document registration and verification system.
- It combines on-chain registries on the Solana blockchain with decentralized storage on IPFS.
- Offline access controls and metadata tracking are handled via PostgreSQL.
- It provides a fast, zero-knowledge verification model.
- Verification operations are processed client-side.
- Verifiers calculate file hashes locally and query the blockchain using Program Derived Addresses.
- This ensures the original documents are never uploaded or transmitted during verification.

---

## Section 1: Architectural Design

- The system separates Web2 storage caches from Web3 transaction verification.
- The client application communicates with both the Express API and the Solana blockchain.
- The Express API is used for metadata and sharing list queries.
- The Solana network is used for registering documents, revoking documents, and verifying document status.
- The PostgreSQL database acts as a Web2 metadata cache and stores access control lists.
- The IPFS network hosts the actual raw document file.

---

## Section 2: <img src="https://img.shields.io/badge/Solana-9b51e0?style=for-the-badge&logo=solana&logoColor=white" height="25" /> Smart Contract

- The blockchain program is written in Rust using the Anchor Framework.
- It manages document records using deterministic seeds to enforce structure and validation rules.

### Section 2.1: Document Record State

- The document record account holds the state for each registered document.
- It stores the public key of the document issuer.
- It stores the IPFS CID string representing the raw file metadata.
- It stores the UNIX timestamp of registration.
- It stores the revocation state flag as a boolean.
- It stores the PDA bump seed to validate the account derivation.
- The size of this account is strictly constrained to prevent rent exhaustion attacks.

### Section 2.2: Register Document Function

- This function initializes a new document record account for a given document hash seed.
- The transaction fails if the document hash has already been registered, protecting against registry front-running.
- The program asserts that the caller is the signer.
- The program instantiates the document record storage.
- The program writes the issuer's public key.
- The program writes the registration timestamp.
- The program writes the IPFS CID string.
- The program sets the revocation flag to false.
- The program saves the bump seed.

### Section 2.3: Revoke Document Function

- This function sets the revocation flag of a document record account to true.
- This action is irreversible.
- The program checks that the transaction signer matches the issuer address saved in the document record account.
- This constraint prevents unauthorized revocation by third parties.
- If the signer does not match, the execution halts and returns a custom error code.

### Section 2.4: Address Derivation

- Solana accounts are created at deterministic addresses derived from specific seeds.
- This enables verifiers to locate document state accounts on the blockchain ledger without storing index mapping on-chain.
- The PDA for any registered document is derived using specific seeds.
- The first seed is a literal ASCII byte array for the document identifier.
- The second seed is the 32-byte cryptographic hash of the document file binary.
- Using these seeds, the Solana runtime derives a unique address for the document record.
- If the account exists at this address, it means the document has been registered.

### Section 2.5: Custom Errors

- The program defines custom return codes for validation failures.
- A specific error code is returned when an unauthorized user attempts to revoke a document record.

---

## Section 3: <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" height="25" /> Backend API and Database

- The backend server is built using Node.js, Express, and Prisma ORM to interact with a PostgreSQL database.

### Section 3.1: Database Schema

- The database schema manages user records, authentication, and offline metadata.
- The User model stores the unique user identifier, username, email, and password hash.
- It also tracks the registration date and update timestamps.
- The Document model stores the unique document identifier, name, IPFS CID, and client-generated hash.
- It links each document to its owner in the User model.
- The Share model manages access control lists.
- It links a document to a recipient email address, allowing shared document access.
- All tables use unique constraints to prevent duplicate entries.

### Section 3.2: Authentication Endpoints

- The registration endpoint creates a new user account.
- It validates the input, checks for existing usernames or emails, hashes the password, and saves the new user record.
- The login endpoint validates the credentials.
- It compares the password hash, generates a JWT token, and returns the token along with user profile information.
- The profile endpoint decodes the JWT header and returns the authenticated user data.

### Section 3.3: Document Endpoints

- The upload endpoint receives the file and client hash.
- It validates the input, uploads the file to IPFS, and saves the document record in PostgreSQL.
- The document listing endpoint retrieves all documents owned by or shared with the authenticated user.

---

## Section 4: <img src="https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61dafb" height="25" /> Frontend State and Security

- The frontend implements session-scoped states to prevent cached token and wallet adapter security issues.

### Section 4.1: Session Management

- The JWT authorization token is saved in session storage instead of local storage.
- Closing the browser window or tab immediately clears this token, logging the user out.
- The wallet provider is configured to disable auto-connection.
- This prevents the browser wallet from silently mounting and exposing accounts without explicit user intent.
- Storage clear-downs for tokens and selected wallet instances run on application launch.
- This ensures a fully clean state whenever the application starts.

### Section 4.2: Navigation Guards

- Protected pages are wrapped in a route guard component.
- This component checks for the presence of a valid session token.
- If no token exists, the user is redirected to the login page.

---

## Section 5: Setup and Orchestration

- The workspace provides an automated concurrent runner to launch the development environment.

### Section 5.1: Installation

- Install dependencies across the root, frontend, and backend packages concurrently using the workspace package manager.

### Section 5.2: Environment Setup

- Create the environment configuration file in the backend directory.
- Specify the database connection URL, the JWT secret key, and the IPFS gateway credentials.
- Run the database migrations to sync the schema with the PostgreSQL instance.

### Section 5.3: Running the Stack

- Launch the development stack using the concurrent run script.
- This script starts the local Solana validator.
- It uses a native Linux directory for the ledger path to bypass filesystem locking bugs on mounted Windows drives.
- It waits for the RPC port to boot up before deploying the Anchor program.
- It starts the Express backend server.
- It starts the Vite frontend development server.

---

## Section 6: Public Network Deployment

### Section 6.1: Configuration Updates

- Update the program address in your configuration files before deploying to public clusters.
- The program address must be updated in the Anchor configuration file.
- The program address must be updated in the smart contract source file.
- The program address must be updated in the frontend client configuration.

### Section 6.2: Target Settings

- Configure the provider target to point to the desired cluster, such as the Solana devnet.
- Specify the path to the local deployer keypair.

### Section 6.3: Deploying the Contract

- Ensure the deployer keypair is funded with SOL on the target network.
- Build and deploy the contract using the Anchor CLI tools.

---

## Section 7: Troubleshooting Guide

### Section 7.1: Connection Refused Error

- This error indicates the local validator is not running.
- Check the terminal logs for the validator service or start it manually.

### Section 7.2: Gossip Panic on Startup

- Gossip cannot bind to an unspecified IP address.
- Run the validator without binding to all interfaces, allowing it to use the default localhost address.

### Section 7.3: Program Not Found Error

- This error indicates the contract has not been deployed to the validator.
- Run the deployment script to initialize the program account on the active ledger.

### Section 7.4: Wallet Connection Issues

- Verify that the browser wallet extension is in developer mode.
- Confirm the active network in the wallet is set to localhost.

### Section 7.5: WSL Filesystem Errors

- Solana validator operations fail on mounted Windows drives due to filesystem locking limitations.
- Ensure the ledger directory is configured inside the native Linux filesystem.

---

## Section 8: Production Hardening Checklist

- Enforce secret key rotations for all JWT and configuration signing keys.
- Configure secure database connections using SSL verification.
- Disable development migration commands and use managed schema migration deployments.
- Protect the frontend by ensuring it never manages or accesses the user's private keys.
- Add rate-limiting middleware to prevent API abuse.
- Configure a dedicated IPFS gateway with access keys for reliable asset retrieval.
- Transfer program upgrade authority to a secure multi-signature wallet.
- Enforce HTTPS encryption across all frontend and backend communication channels.
- Restrict CORS configurations in the backend to allow requests only from your production domains.
- Align the frontend RPC configuration with a dedicated private RPC provider for higher throughput and stability.

---

## Section 9: Infrastructure and Containerization

### Section 9.1: Containerized Builds

- The application backend uses a multi-stage container configuration.
- The builder stage compiles dependencies and generates the database client.
- The runner stage installs only production dependencies and executes the server.
- This keeps the production image size minimal and secure.

### Section 9.2: Reverse Proxy Configuration

- Host the static frontend and forward API requests using a reverse proxy server.
- Route requests to the root path directly to the compiled frontend static directory.
- Forward requests matching the API prefix to the backend application server port.
- Ensure headers are forwarded correctly to support connection upgrades and proxy caching bypasses.

---

## Section 10: Document Verification Flow

### Section 10.1: Cryptographic Calculations

- The verification process relies on client-side cryptographic hashing.
- The user selects a file through the browser interface.
- The application reads the file as an array buffer.
- It computes the SHA-256 hash using the WebCrypto API.
- The computed hash is converted to a hexadecimal string.
- This hexadecimal string is used as the unique identifier for all subsequent operations.

### Section 10.2: Blockchain Account Lookup

- The client derives the document record PDA using the computed hash.
- It queries the Solana connection provider for account information at that derived address.
- If no account exists, the document is flagged as not registered.
- If the account exists, the client reads the account data payload.
- It parses the issuer key, registration timestamp, IPFS CID, and revocation status.
- If the revocation flag is true, the document is flagged as revoked.
- If the revocation flag is false, the document is flagged as authentic.

### Section 10.3: User Actions

- Issuers upload files to register them on the blockchain.
- The application computes the hash and uploads the file to the backend.
- The backend pins the file to IPFS and returns the CID.
- The frontend prompts the wallet to sign the registration transaction.
- This transaction initializes the on-chain record.
- Issuers can also revoke documents they have registered.
- The application calls the revocation instruction, which marks the record as revoked on-chain.
- Verifiers use the zero-knowledge validation tool.
- They upload a file to calculate its hash and look up the status.
- No transactions or database entries are created during validation.

---

## Section 11: Developer Guidelines

### Section 11.1: Code Standards

- Maintain clean code separation between the frontend, backend, and blockchain components.
- Ensure all smart contract instructions are tested locally before deployment.
- Keep database queries optimized by using index fields for lookups.
- Ensure all user inputs are validated on the backend to prevent SQL injection or scripting attacks.

### Section 11.2: Version Control

- Do not commit private keys, environment files, or build artifacts to the repository.
- Ensure the gitignore file remains configured with paths for node modules, target build folders, local ledgers, and env configurations.
- Always test contract changes against a local validator instance before deploying to public testnets.
- Coordinate database migrations with api updates to prevent schema mismatches in live environments.
- Verify that all front-end builds compile cleanly without syntax errors before pushing to production hosting environments.
- Follow standard semantic versioning practices for all package dependencies.
- Keep documentation updated as new features or integrations are added to the system.

---

## Section 12: Summary of Security Policies

- Authentication tokens must never be persisted on the user's hard drive.
- Wallet adapters must require manual confirmation for every connection attempt.
- RPC connections must be unified across the application to prevent inconsistent network queries.
- Smart contract instructions must validate caller authority on every state change.
- Account allocations must be fixed in size to prevent memory-inflation vectors.
- All file payloads must be validated for integrity before pinning to decentralized storage.
- Database access control lists must be synchronized with on-chain registration records.
- All production communications must be encrypted using secure sockets layer protocols.
- Access to configuration endpoints must be restricted to authenticated administrators.

---

## Section 13: System Configuration Reference

- The application backend coordinates with an IPFS pinning service.
- This service requires a valid JWT token for authentication.
- The token must be configured in the backend environment file under the IPFS credential key.
- The service also coordinates with a custom gateway URL.
- This gateway URL is used to retrieve pinned assets from the decentralized network.
- The database configuration requires a valid PostgreSQL connection string.
- This string contains the protocol, user credentials, server address, port, database name, and connection options.
- The frontend coordinates with the active Solana cluster RPC endpoint.
- This endpoint must be accessible from the client's network.
- Ensure the RPC URL matches the active network in the client's browser wallet extension.
- The local development environment uses the default Solana localnet port.
- This port must not be blocked by other services or firewalls on your system.

---

## Section 14: Lifecycle of a Transaction

- A document transaction begins when the user triggers an action in the frontend.
- For registrations, the frontend calculates the document hash.
- The frontend sends the file payload to the backend.
- The backend uploads the file to the decentralized storage provider and returns the CID.
- The frontend builds a Solana transaction referencing the register instruction.
- This transaction includes the document hash and the IPFS CID as parameters.
- The frontend prompts the user's wallet to sign the built transaction.
- Once signed, the transaction is sent to the active Solana RPC network.
- The network validators process the transaction and initialize the on-chain document record.
- The frontend monitors the transaction signature for finality confirmation.
- Once confirmed, the frontend updates the UI state to show the document is registered.
- For revocations, the owner triggers the revoke action.
- The frontend builds a transaction referencing the revoke instruction and the document hash.
- The frontend prompts the wallet to sign the revocation transaction.
- The transaction is sent to the network, and validators update the on-chain record's revocation flag.
- The frontend confirms the signature and updates the document status list in the UI.
- For validation, the user uploads a document to verify.
- The frontend calculates the hash and derives the account address.
- The frontend sends a read request to the Solana RPC node for the account data.
- The node returns the account state, which the frontend parses to display the verification status.

---

## Section 15: Operational Best Practices

- Monitor the validator's log file for performance metrics and error logs during development.
- Use private RPC endpoints for production applications to guarantee network availability.
- Enforce multi-signature authentication for all administrative updates to the smart contract.
- Audit the smart contract code regularly to identify potential vulnerability paths.
- Ensure database backups are executed on a regular schedule to protect offline metadata.
- Keep database indexes updated to maintain query performance as the user base grows.
- Regularly rotate the backend JWT secret key to protect user sessions.
- Review access control lists periodically to ensure document permissions remain correct.
- Validate all incoming file types on the backend to prevent malicious uploads.
- Monitor IPFS pin states to ensure registered documents remain accessible.
- Keep the frontend built assets optimized to guarantee fast load times for verifiers.
- Test the system's behavior under high network latency to identify potential bottlenecks.
- Ensure all team members follow secure key management practices when handling deployment credentials.
- Coordinate development updates across the team using isolated feature branches and pull requests.
