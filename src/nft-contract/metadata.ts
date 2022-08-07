import { Contract } from ".";

//defines the payout type we'll be returning as a part of the royalty standards.
export class Payout {
    payout: { [accountId: string]: bigint };
    constructor({ payout }: { payout: { [accountId: string]: bigint } }) {
        this.payout = payout;
    }
}

export class NFTContractMetadata {
    spec: string;
    name: string;
    symbol: string;
    icon?: string;
    base_uri?: string;
    reference?: string;
    reference_hash?: string;
    
    constructor(
        {
            spec, 
            name, 
            symbol, 
            icon, 
            baseUri, 
            reference, 
            referenceHash
        }:{ 
            spec: string, 
            name: string, 
            symbol: string, 
            icon?: string, 
            baseUri?: string, 
            reference?: string, 
            referenceHash?: string
        }) {
        this.spec = spec  // required, essentially a version like "nft-1.0.0"
        this.name = name  // required, ex. "Mosaics"
        this.symbol = symbol // required, ex. "MOSAIC"
        this.icon = icon // Data URL
        this.base_uri = baseUri // Centralized gateway known to have reliable access to decentralized storage assets referenced by `reference` or `media` URLs
        this.reference = reference // URL to a JSON file with more info
        this.reference_hash = referenceHash // Base64-encoded sha256 hash of JSON from reference field. Required if `reference` is included.
    }
}

export class TokenMetadata {
    title?: string;
    description?: string;
    media?: string;
    media_hash?: string;
    copies?: number;
    issued_at?: string;
    expires_at?: string;
    starts_at?: string;
    updated_at?: string;
    extra?: string;
    reference?: string;
    reference_hash?: string;

    constructor(
        {
            title, 
            description, 
            media, 
            mediaHash, 
            copies, 
            issuedAt, 
            expiresAt, 
            startsAt, 
            updatedAt, 
            extra, 
            reference, 
            referenceHash
        }:{
            title?: string, 
            description?: string, 
            media?: string, 
            mediaHash?: string, 
            copies?: number, 
            issuedAt?: string, 
            expiresAt?: string, 
            startsAt?: string, 
            updatedAt?: string, 
            extra?: string, 
            reference?: string, 
            referenceHash?: string}
        ) {
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
}

export class Token {
    owner_id: string;
    approved_account_ids: { [accountId: string]: number };
    next_approval_id: number;
    royalty: { [accountId: string]: number };

    constructor({ 
        ownerId, 
        approvedAccountIds, 
        nextApprovalId, 
        royalty 
    }:{ 
        ownerId: string, 
        approvedAccountIds: { [accountId: string]: number }, 
        nextApprovalId: number, 
        royalty: { [accountId: string]: number } 
    }) {
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
    token_id: string;
    owner_id: string;
    metadata: TokenMetadata;
    approved_account_ids: { [accountId: string]: number };
    royalty: { [accountId: string]: number };

    constructor({ 
        tokenId, 
        ownerId, 
        metadata, 
        approvedAccountIds, 
        royalty 
    }:{
        tokenId: string,
        ownerId: string,
        metadata: TokenMetadata,
        approvedAccountIds: { [accountId: string]: number },
        royalty: { [accountId: string]: number }
    }) {
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

//get the information for a specific token ID
export function internalNftMetadata({
    contract
}:{
    contract: Contract
}): NFTContractMetadata {
    return contract.metadata;
}