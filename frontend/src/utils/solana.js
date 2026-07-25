import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
export const SOLANA_RPC_ENDPOINT = import.meta.env.VITE_SOLANA_RPC_ENDPOINT || "https://api.devnet.solana.com";

// Detect if a local validator is running on 127.0.0.1:8899
export const detectRpcEndpoint = async () => {
  try {
    const response = await fetch('http://127.0.0.1:8899', { method: 'GET' });
    if (response.ok) {
      return 'http://127.0.0.1:8899';
    }
  } catch (e) {
    // ignore
  }
  return SOLANA_RPC_ENDPOINT;
};
export const getProvider = async (wallet) => {
  const rpcEndpoint = await detectRpcEndpoint();
  const connection = new Connection(rpcEndpoint, 'processed');
  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  return provider;
};
export const getDocumentPda = (docHashHex) => {
  const docHashBytes = Buffer.from(docHashHex, 'hex');
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("document"), docHashBytes],
    PROGRAM_ID
  );
  return pda;
};
