
import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap, Vector, UnorderedSet } from 'near-sdk-js'
import { NFTContractMetadata, Token, TokenMetadata, internalNftMetadata } from './metadata';
import { internalMint } from './mint';
import { internalNftTokens, internalSupplyForOwner, internalTokensForOwner, internalTotalSupply } from './enumeration';
import { internalNftToken, internalNftTransfer, internalNftTransferCall, internalResolveTransfer } from './nft_core';
import { internalNftApprove, internalNftIsApproved, internalNftRevoke, internalNftRevokeAll } from './approval';
import { internalNftPayout, internalNftTransferPayout } from './royalty';

/// This spec can be treated like a version of the standard.
export const NFT_METADATA_SPEC = "nft-1.0.0";

/// This is the name of the NFT standard we're using
export const NFT_STANDARD_NAME = "nep171";

@NearBindgen
export class Contract extends NearContract {
    owner_id: string;
    tokensPerOwner: LookupMap;
    tokensById: LookupMap;
    tokenMetadataById: UnorderedMap;
    metadata: NFTContractMetadata;

    /*
        initialization function (can only be called once).
        this initializes the contract with metadata that was passed in and
        the owner_id. 
    */
    constructor({
        owner_id,
        metadata = {
            spec: "nft-1.0.0",
            name: "NFT Tutorial Contract",
            symbol: "GOTEAM"
        }
    }) {
        super()
        this.owner_id = owner_id;
        this.tokensPerOwner = new LookupMap("tokensPerOwner");
        this.tokensById = new LookupMap("tokensById");
        this.tokenMetadataById = new UnorderedMap("tokenMetadataById");
        this.metadata = metadata;
    }

    default() {
        return new Contract({ owner_id: '' })
    }

    /*
        MINT
    */
    @call
    nft_mint({ token_id, metadata, receiver_id, perpetual_royalties }) {
        return internalMint({ contract: this, tokenId: token_id, metadata: metadata, receiverId: receiver_id, perpetualRoyalties: perpetual_royalties });
    }

    /*
        CORE
    */
    //get the information for a specific token ID
    @view
    nft_token({ token_id }) {
        return internalNftToken({ contract: this, tokenId: token_id });
    }

    //implementation of the nft_transfer method. This transfers the NFT from the current owner to the receiver. 
    @call
    nft_transfer({ receiver_id, token_id, approval_id, memo }) {
        return internalNftTransfer({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo });
    }

    //implementation of the transfer call method. This will transfer the NFT and call a method on the receiver_id contract
    @call
    nft_transfer_call({ receiver_id, token_id, approval_id, memo, msg }) {
        return internalNftTransferCall({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo, msg: msg });
    }

    //resolves the cross contract call when calling nft_on_transfer in the nft_transfer_call method
    @call
    //returns true if the token was successfully transferred to the receiver_id
    nft_resolve_transfer({ authorized_id, owner_id, receiver_id, token_id, approved_account_ids, memo }) {
        return internalResolveTransfer({ contract: this, authorizedId: authorized_id, ownerId: owner_id, receiverId: receiver_id, tokenId: token_id, approvedAccountIds: approved_account_ids, memo: memo });
    }

    /*
        APPROVALS
    */
    //check if the passed in account has access to approve the token ID
    @view
    nft_is_approved({ token_id, approved_account_id, approval_id }) {
        return internalNftIsApproved({ contract: this, tokenId: token_id, approvedAccountId: approved_account_id, approvalId: approval_id });
    }

    //approve an account ID to transfer a token on your behalf
    @call
    nft_approve({ token_id, account_id, msg }) {
        return internalNftApprove({ contract: this, tokenId: token_id, accountId: account_id, msg: msg });
    }

    /*
        ROYALTY
    */
    //calculates the payout for a token given the passed in balance. This is a view method
    @view
    nft_payout({ token_id, balance, max_len_payout }) {
        return internalNftPayout({ contract: this, tokenId: token_id, balance: balance, maxLenPayout: max_len_payout });
    }

    //transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance. 
    @call
    nft_transfer_payout({ receiver_id, token_id, approval_id, memo, balance, max_len_payout }) {
        return internalNftTransferPayout({ contract: this, receiverId: receiver_id, tokenId: token_id, approvalId: approval_id, memo: memo, balance: balance, maxLenPayout: max_len_payout });
    }

    //approve an account ID to transfer a token on your behalf
    @call
    nft_revoke({ token_id, account_id }) {
        return internalNftRevoke({ contract: this, tokenId: token_id, accountId: account_id });
    }

    //approve an account ID to transfer a token on your behalf
    @call
    nft_revoke_all({ token_id }) {
        return internalNftRevokeAll({ contract: this, tokenId: token_id });
    }

    /*
        ENUMERATION
    */
    //Query for the total supply of NFTs on the contract
    @view
    nft_total_supply() {
        return internalTotalSupply({ contract: this });
    }

    //Query for nft tokens on the contract regardless of the owner using pagination
    @view
    nft_tokens({ from_index, limit }) {
        return internalNftTokens({ contract: this, fromIndex: from_index, limit: limit });
    }

    //get the total supply of NFTs for a given owner
    @view
    nft_tokens_for_owner({ account_id, from_index, limit }) {
        return internalTokensForOwner({ contract: this, accountId: account_id, fromIndex: from_index, limit: limit });
    }

    //Query for all the tokens for an owner
    @view
    nft_supply_for_owner({ account_id }) {
        return internalSupplyForOwner({ contract: this, accountId: account_id });
    }

    /*
        METADATA
    */
    //Query for all the tokens for an owner
    @view
    nft_metadata() {
        return internalNftMetadata({ contract: this });
    }
}