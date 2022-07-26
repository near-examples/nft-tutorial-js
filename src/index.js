import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap, utils, Vector } from 'near-sdk-js'
import { isUndefined } from 'lodash-es'
import { Token } from './metadata';
import { mint } from './mint';

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
        this.tokensById = Object.assign(new LookupMap, this.tokensById)
        
        this.tokensPerOwner = Object.assign(new LookupMap, this.tokensPerOwner)
        this.tokensPerOwner.keys = Object.assign(new Vector, this.tokensPerOwner.values)
        this.tokensPerOwner.values = Object.assign(new Vector, this.tokensPerOwner.values)
    }

    @call
    nft_mint({ token_id, metadata, receiver_id, perpetual_royalties }) {
        mint(this, token_id, metadata, receiver_id, perpetual_royalties);
    }
}

