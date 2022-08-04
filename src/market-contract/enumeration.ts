import { near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { restoreOwners } from "../nft-contract/internals";
import { internal_nft_token } from "./nft_core";

//Query for the total supply of NFTs on the contract
export function internal_total_supply(
    contract: Contract
) {
    //return the length of the token metadata by ID
    return contract.tokenMetadataById.len();
}

//Query for nft tokens on the contract regardless of the owner using pagination
export function internal_nft_tokens(
    contract: Contract, 
    fromIndex: number | null = 0, 
    limit: number | null = 50
) {
    let tokens = [];
    let keys = contract.tokenMetadataById.toArray();
    // Paginate through the keys using the fromIndex and limit
    for (let i = fromIndex; i < keys.length && i < fromIndex + limit; i++) {
        // get the token object from the keys
        let jsonToken = internal_nft_token(contract, keys[i][0]);
        tokens.push(jsonToken);
    }
    return tokens;
}

//get the total supply of NFTs for a given owner
export function internal_supply_for_owner(contract, accountId) {
    //get the set of tokens for the passed in owner
    let tokens = restoreOwners(contract.tokensPerOwner.get(accountId));

    //if there isn't a set of tokens for the passed in account ID, we'll return 0
    if (tokens == null) {
        return 0
    }

    //if there is some set of tokens, we'll return the length 
    return tokens.len();
}

//Query for all the tokens for an owner
export function internal_tokens_for_owner(contract, accountId, fromIndex, limit) {
    //get the set of tokens for the passed in owner
    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));

    //if there isn't a set of tokens for the passed in account ID, we'll return 0
    if (tokenSet == null) {
        return [];
    }
    
    //where to start pagination - if we have a fromIndex, we'll use that - otherwise start from 0 index
    let start = fromIndex ? fromIndex : 0;
    //take the first "limit" elements in the array. If we didn't specify a limit, use 50
    let max = limit ? limit : 50;

    let keys = tokenSet.toArray();
    let tokens = []
    for(let i = start; i < max; i++) {
        if(i >= keys.length) {
            near.log(`reached the end of keys with length: ${keys.length}`);
            return;
        }
        tokens.push(JSON.stringify(keys[i]))
        near.log(`el: ${JSON.stringify(keys[i])}`);
    }
    return tokens;
}