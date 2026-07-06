use anchor_lang::prelude::*;
use crate::state::DocumentRecord;
#[derive(Accounts)]
#[instruction(doc_hash: [u8; 32])]
pub struct RevokeDocument<'info> {
    #[account(
        mut,
        seeds = [b"document", doc_hash.as_ref()],
        bump = document_record.bump,
        has_one = issuer
    )]
    pub document_record: Account<'info, DocumentRecord>,
    pub issuer: Signer<'info>,
}
pub fn handle_revoke_document(ctx: Context<RevokeDocument>, _doc_hash: [u8; 32]) -> Result<()> {
    let document_record = &mut ctx.accounts.document_record;
    document_record.is_revoked = true;
    Ok(())
}
