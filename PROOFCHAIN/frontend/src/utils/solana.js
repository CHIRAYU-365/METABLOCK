import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Buffer } from 'buffer';

export const PROGRAM_ID = new PublicKey("Bm4JopwFvvvH2magffE1xivMtZCC2gTZe2BBNeSC4rew");

export const getProvider = (wallet) => {
  const connection = new Connection("http://127.0.0.1:8899", 'processed');
  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  return provider;
};

export const getDocumentPda = (docHashHex) => {
  // Hex decode yields a 32-byte Buffer instead of a 64-byte UTF-8 string
  const docHashBytes = Buffer.from(docHashHex, 'hex');
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("document"), docHashBytes],
    PROGRAM_ID
  );
  return pda;
};
