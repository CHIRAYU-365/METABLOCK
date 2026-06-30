import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

export const PROGRAM_ID = new PublicKey("Bm4JopwFvvvH2magffE1xivMtZCC2gTZe2BBNeSC4rew");

export const getProvider = (wallet) => {
  const connection = new Connection(clusterApiUrl('devnet'), 'processed');
  const provider = new anchor.AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
  return provider;
};

export const getDocumentPda = (docHashHex) => {
  const docHashBytes = Buffer.from(docHashHex, 'utf8');
  const [pda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from("document"), docHashBytes],
    PROGRAM_ID
  );
  return pda;
};
