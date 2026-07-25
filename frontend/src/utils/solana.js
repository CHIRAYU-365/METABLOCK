import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';
export const SOLANA_RPC_ENDPOINT = import.meta.env.VITE_SOLANA_RPC_ENDPOINT || "http://127.0.0.1:8899";
export const detectRpcEndpoint = async () => SOLANA_RPC_ENDPOINT;

export const PROGRAM_ID = new PublicKey("FikMPetL3GTukxxgX2AAgqv7aYfrMisbzNwvzHgxqmKb");

export const getProvider = async (wallet) => {
  const connection = new Connection(SOLANA_RPC_ENDPOINT, 'processed');
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
