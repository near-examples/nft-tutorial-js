// @ts-nocheck
import { near, UnorderedSet } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { restoreOwners } from "./internal";
import { JsonToken } from "./metadata";
import { internalNftToken } from "./nft_core";

//Query for the total supply of NFTs on the contract
export function internalTotalSupply({
    contract
}:{
    contract: Contract
}): number {
    //return the length of the token metadata by ID
    return contract.tokenMetadataById.len();
}

//Query for nft tokens on the contract regardless of the owner using pagination
export function internalNftTokens({
    contract,
    fromIndex,
    limit
}:{ 
    contract: Contract, 
    fromIndex?: string, 
    limit?: number
}): JsonToken[] {
    let tokens = [];

    //where to start pagination - if we have a fromIndex, we'll use that - otherwise start from 0 index
    let start = fromIndex ? parseInt(fromIndex) : 0;
    //take the first "limit" elements in the array. If we didn't specify a limit, use 50
    let max = limit ? limit : 50;

    let keys = contract.tokenMetadataById.toArray();
    // Paginate through the keys using the fromIndex and limit
    for (let i = start; i < keys.length && i < start + max; i++) {
        // get the token object from the keys
        let jsonToken = internalNftToken({contract, tokenId: keys[i][0]});
        tokens.push(jsonToken);
    }
    return tokens;
}

//get the total supply of NFTs for a given owner
export function internalSupplyForOwner({
    contract,
    accountId
}:{
    contract: Contract, 
    accountId: string
}): number {
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
export function internalTokensForOwner({
    contract,
    accountId,
    fromIndex,
    limit
}:{
    contract: Contract, 
    accountId: string, 
    fromIndex?: string, 
    limit?: number
}): JsonToken[] {
    //get the set of tokens for the passed in owner
    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));

    //if there isn't a set of tokens for the passed in account ID, we'll return 0
    if (tokenSet == null) {
        return [];
    }
    
    //where to start pagination - if we have a fromIndex, we'll use that - otherwise start from 0 index
    let start = fromIndex ? parseInt(fromIndex) : 0;
    //take the first "limit" elements in the array. If we didn't specify a limit, use 50
    let max = limit ? limit : 50;

    let keys = tokenSet.toArray();
    let tokens: JsonToken[] = []
    for(let i = start; i < max; i++) {
        if(i >= keys.length) {
            break;
        }
        let token = internalNftToken({contract, tokenId: keys[i]});
        tokens.push(token);
    }
    return tokens;
}