use anchor_lang::prelude::*;

#[account]
pub struct DocumentRecord {
    pub issuer: Pubkey,       // 32 bytes
    pub ipfs_cid: String,     // 4 + 64 bytes
    pub timestamp: i64,       // 8 bytes
    pub is_revoked: bool,     // 1 byte
    pub bump: u8,             // 1 byte
}

impl DocumentRecord {
    pub const MAX_SIZE: usize = 8 + 32 + (4 + 64) + 8 + 1 + 1;
}
