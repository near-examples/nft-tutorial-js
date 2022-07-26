import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap, utils, Vector, UnorderedSet } from 'near-sdk-js'
import { isUndefined } from 'lodash-es'
import { Token } from './metadata';
import { internal_mint } from './mint';
import { internal_nft_tokens, internal_supply_for_owner, internal_tokens_for_owner, internal_total_supply } from './enumeration';
import { internal_nft_token, internal_nft_transfer, internal_nft_transfer_call, internal_resolve_transfer } from './nft_core';

/// This spec can be treated like a version of the standard.
export const NFT_METADATA_SPEC = "nft-1.0.0";

/// This is the name of the NFT standard we're using
export const NFT_STANDARD_NAME = "nep171";

@NearBindgen
class Contract extends NearContract {
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
        this.tokenMetadataById = Object.assign(new UnorderedMap, this.tokenMetadataById)
        this.tokenMetadataById.keys = Object.assign(new Vector, this.tokenMetadataById.keys)
        this.tokenMetadataById.values = Object.assign(new Vector, this.tokenMetadataById.values)

        this.tokensById = Object.assign(new LookupMap, this.tokensById)
        this.tokensById.keys = Object.assign(new Vector, this.tokensById.keys)
        this.tokensById.values = Object.assign(new Vector, this.tokensById.values)


        this.tokensPerOwner = Object.assign(new LookupMap, this.tokensPerOwner)
        this.tokensPerOwner.keys = Object.assign(new Vector, this.tokensPerOwner.keys)
        this.tokensPerOwner.values = Object.assign(new UnorderedSet, this.tokensPerOwner.values)
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
}