import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap, Vector, UnorderedSet } from 'near-sdk-js'
import { NFTContractMetadata, Token, TokenMetadata, internal_nft_metadata } from './metadata.ts';
import { internal_mint } from './mint.ts';
import { internal_nft_tokens, internal_supply_for_owner, internal_tokens_for_owner, internal_total_supply } from './enumeration.ts';
import { internal_nft_token, internal_nft_transfer, internal_nft_transfer_call, internal_resolve_transfer } from './nft_core.ts';
import { internal_nft_approve, internal_nft_is_approved, internal_nft_revoke, internal_nft_revoke_all } from './approvals.ts';
import { internal_nft_payout, internal_nft_transfer_payout } from './royalty.ts';

/// This spec can be treated like a version of the standard.
export const NFT_METADATA_SPEC = "nft-1.0.0";

/// This is the name of the NFT standard we're using
export const NFT_STANDARD_NAME = "nep171";

@NearBindgen
export class Contract extends NearContract {
    owner_id: string;
    tokensPerOwner: LookupMap<string, UnorderedSet<string>>;
    tokensById: LookupMap<string, Token>;
    tokenMetadataById: UnorderedMap<string, TokenMetadata>;
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
        this.tokensById = new LookupMap("tokensPerOwner");
        this.tokenMetadataById = new UnorderedMap("tokenMetadataById");
        this.metadata = metadata;
    }

    deserialize() {
        super.deserialize()
        this.tokensPerOwner = new LookupMap("tokensPerOwner");
        this.tokensById = new LookupMap("tokensPerOwner");
        this.tokenMetadataById = new UnorderedMap("tokenMetadataById");
    }

    /*
        MINT
    */
    @call
    nft_mint({ token_id, metadata, receiver_id, perpetual_royalties }) {
        internal_mint(this, token_id, metadata, receiver_id, perpetual_royalties);
    }

    /*
        CORE
    */
    @view
    //get the information for a specific token ID
    nft_token({ token_id }) {
        return internal_nft_token(this, token_id);
    }

    @call
    //implementation of the nft_transfer method. This transfers the NFT from the current owner to the receiver. 
    nft_transfer({ receiver_id, token_id, approval_id, memo }) {
        return internal_nft_transfer(this, receiver_id, token_id, approval_id, memo);
    }

    @call
    //implementation of the transfer call method. This will transfer the NFT and call a method on the receiver_id contract
    nft_transfer_call({ receiver_id, token_id, approval_id, memo, msg }) {
        return internal_nft_transfer_call(this, receiver_id, token_id, approval_id, memo, msg);
    }

    @call
    //resolves the cross contract call when calling nft_on_transfer in the nft_transfer_call method
    //returns true if the token was successfully transferred to the receiver_id
    nft_resolve_transfer({ authorized_id, owner_id, receiver_id, token_id, approved_account_ids, memo }) {
        return internal_resolve_transfer(this, authorized_id, owner_id, receiver_id, token_id, approved_account_ids, memo);
    }

    /*
        APPROVALS
    */
    @view
    //check if the passed in account has access to approve the token ID
    nft_is_approved({ token_id, approved_account_id, approval_id }) {
        return internal_nft_is_approved(this, token_id, approved_account_id, approval_id);
    }

    @call
    //approve an account ID to transfer a token on your behalf
    nft_approve({ token_id, account_id, msg }) {
        return internal_nft_approve(this, token_id, account_id, msg);
    }

    /*
        ROYALTY
    */
    @view
    //calculates the payout for a token given the passed in balance. This is a view method
    nft_payout({ token_id, balance, max_len_payout }) {
        return internal_nft_payout(this, token_id, balance, max_len_payout);
    }

    @call
    //transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance. 
    nft_transfer_payout({ receiver_id, token_id, approval_id, memo, balance, max_len_payout }) {
        return internal_nft_transfer_payout(this, receiver_id, token_id, approval_id, memo, balance, max_len_payout);
    }

    @call
    //approve an account ID to transfer a token on your behalf
    nft_revoke({ token_id, account_id }) {
        return internal_nft_revoke(this, token_id, account_id);
    }

    @call
    //approve an account ID to transfer a token on your behalf
    nft_revoke_all({ token_id }) {
        return internal_nft_revoke_all(this, token_id);
    }

    /*
        ENUMERATION
    */
    @view
    //Query for the total supply of NFTs on the contract
    nft_total_supply() {
        return internal_total_supply(this);
    }

    @view
    //Query for nft tokens on the contract regardless of the owner using pagination
    nft_tokens({ from_index, limit }) {
        return internal_nft_tokens(this, from_index, limit);
    }

    @view
    //get the total supply of NFTs for a given owner
    nft_tokens_for_owner({ account_id, from_index, limit }) {
        return internal_tokens_for_owner(this, account_id, from_index, limit);
    }

    @view
    //Query for all the tokens for an owner
    nft_supply_for_owner({ account_id }) {
        return internal_supply_for_owner(this, account_id);
    }

    /*
        METADATA
    */
    @view
    //Query for all the tokens for an owner
    nft_metadata() {
        return internal_nft_metadata(this);
    }
}