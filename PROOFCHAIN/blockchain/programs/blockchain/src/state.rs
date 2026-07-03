use anchor_lang::prelude::*;
#[account]
pub struct DocumentRecord {
    pub issuer: Pubkey,       
    pub ipfs_cid: String,     
    pub timestamp: i64,       
    pub is_revoked: bool,     
    pub bump: u8,             
}
impl DocumentRecord {
    pub const MAX_SIZE: usize = 8 + 32 + (4 + 64) + 8 + 1 + 1;
}
