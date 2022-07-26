import {near, utils} from 'near-sdk-js'
import { assert } from './internals';

//defines the payout type we'll be returning as a part of the royalty standards.
export class Payout {
    constructor({ payout }) {
        this.payout = payout;
    }
}

export class NFTContractMetadata {
    constructor({spec, name, symbol, icon, baseUri, reference, referenceHash}) {
        this.spec = spec  // required, essentially a version like "nft-1.0.0"
        this.name = name  // required, ex. "Mosaics"
        this.symbol = symbol // required, ex. "MOSIAC"
        this.icon = icon // Data URL
        this.base_uri = baseUri // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
        this.reference = reference // URL to a JSON file with more info
        this.reference_hash = referenceHash // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
    }

    assert_valid() {
        assert(self.spec == NFT_METADATA_SPEC, "Spec is not NFT metadata");
        assert(
            (self.reference != null) == (self.reference_hash != null),
            "Reference and reference hash must be present"
        );
        if (this.reference_hash != null) {
            assert(this.reference_hash.length == 32, "Hash has to be 32 bytes");
        }
    }
}

export class TokenMetadata {
    constructor({title, description, media, mediaHash, copies, issuedAt, expiresAt, startsAt, updatedAt, extra, reference, referenceHash}) {
        this.title = title // ex. "Arch Nemesis: Mail Carrier" or "Parcel #5055"
        this.description = description // free-form description
        this.media = media // URL to associated media, preferably to decentralized, content-addressed storage
        this.media_hash = mediaHash // Base64-encoded sha256 hash of content referenced by the `media` field. Required if `media` is included.
        this.copies = copies // number of copies of this set of metadata in existence when token was minted.
        this.issued_at = issuedAt // ISO 8601 datetime when token was issued or minted
        this.expires_at = expiresAt // ISO 8601 datetime when token expires
        this.starts_at = startsAt // ISO 8601 datetime when token starts being valid
        this.updated_at = updatedAt // ISO 8601 datetime when token was last updated
        this.extra = extra // anything extra the NFT wants to store on-chain. Can be stringified JSON.
        this.reference = reference // URL to an off-chain JSON file with more info.
        this.reference_hash = referenceHash // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
    }

    assert_valid() {        
        assert((this.media != null) == (this.media_hash != null));
        if (this.media_hash != null) {
            assert(this.media_hash.length == 32, "Media hash has to be 32 bytes");
        }

        assert((this.reference != null) == (this.reference_hash != null));
        if (this.reference_hash != null) {
            assert(this.reference_hash.length == 32, "Reference hash has to be 32 bytes");
        }
    }
}

export class Token {
    constructor({ ownerId, approvedAccountIds, nextApprovalId, royalty }) {
        //owner of the token
        this.owner_id = ownerId,
        //list of approved account IDs that have access to transfer the token. This maps an account ID to an approval ID
        this.approved_account_ids = approvedAccountIds,
        //the next approval ID to give out. 
        this.next_approval_id = nextApprovalId,
        //keep track of the royalty percentages for the token in a hash map
        this.royalty = royalty
    }
}

//The Json token is what will be returned from view calls. 
export class JsonToken {
    constructor({ tokenId, ownerId, metadata, approvedAccountIds, royalty }) {
        //token ID
        this.token_id = tokenId,
        //owner of the token
        this.owner_id = ownerId,
        //token metadata
        this.metadata = metadata,
        //list of approved account IDs that have access to transfer the token. This maps an account ID to an approval ID
        this.approved_account_ids = approvedAccountIds,
        //keep track of the royalty percentages for the token in a hash map
        this.royalty = royalty
    }
}