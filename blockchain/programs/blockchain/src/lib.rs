pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
use anchor_lang::prelude::*;
pub use constants::*;
pub use instructions::*;
pub use state::*;
declare_id!("FikMPetL3GTukxxgX2AAgqv7aYfrMisbzNwvzHgxqmKb");
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
