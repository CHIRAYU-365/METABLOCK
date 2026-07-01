use anchor_lang::prelude::*;
use crate::state::DocumentRecord;

#[derive(Accounts)]
#[instruction(doc_hash: [u8; 32])]
pub struct RegisterDocument<'info> {
    #[account(
        init,
        payer = issuer,
        space = DocumentRecord::MAX_SIZE,
        seeds = [b"document", doc_hash.as_ref()],
        bump
    )]
    pub document_record: Account<'info, DocumentRecord>,

    #[account(mut)]
    pub issuer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handle_register_document(ctx: Context<RegisterDocument>, _doc_hash: [u8; 32], ipfs_cid: String) -> Result<()> {
    let document_record = &mut ctx.accounts.document_record;
    let clock = Clock::get()?;

    document_record.issuer = ctx.accounts.issuer.key();
    document_record.ipfs_cid = ipfs_cid;
    document_record.timestamp = clock.unix_timestamp;
    document_record.is_revoked = false;
    document_record.bump = ctx.bumps.document_record;

    Ok(())
}
