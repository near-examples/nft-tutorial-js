// @ts-nocheck
import { assert, bytes, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { assertOneYocto, internalAddTokenToOwner, internalRemoveTokenFromOwner, internalTransfer, refundDeposit, refundApprovedAccountIds } from "./internal";
import { JsonToken, Token, TokenMetadata } from "./metadata";

const GAS_FOR_RESOLVE_TRANSFER = 40_000_000_000_000;
const GAS_FOR_NFT_ON_TRANSFER = 35_000_000_000_000;

//get the information for a specific token ID
export function internalNftToken({
    contract,
    tokenId
}:{ 
    contract: Contract, 
    tokenId: string 
}) {
    let token = contract.tokensById.get(tokenId) as Token;
    //if there wasn't a token ID in the tokens_by_id collection, we return None
    if (token == null) {
        return null;
    }

    //if there is some token ID in the tokens_by_id collection
    //we'll get the metadata for that token
    let metadata = contract.tokenMetadataById.get(tokenId) as TokenMetadata;
    
    //we return the JsonToken
    let jsonToken = new JsonToken({
        tokenId: tokenId,
        ownerId: token.owner_id,
        metadata,
    });
    return jsonToken;
}

//implementation of the nft_transfer method. This transfers the NFT from the current owner to the receiver. 
export function internalNftTransfer({
    contract,
    receiverId,
    tokenId,
    approvalId,
    memo,
}:{
    contract: Contract, 
    receiverId: string, 
    tokenId: string, 
    approvalId: number
    memo: string
}) {
    /*
        FILL THIS IN
    */
}

//implementation of the transfer call method. This will transfer the NFT and call a method on the receiver_id contract
export function internalNftTransferCall({
    contract,
    receiverId,
    tokenId,
    approvalId,
    memo,
    msg
}:{
    contract: Contract,
    receiverId: string, 
    tokenId: string, 
    approvalId: number,
    memo: string,
    msg: string  
}) {
    /*
        FILL THIS IN
    */
}

//resolves the cross contract call when calling nft_on_transfer in the nft_transfer_call method
//returns true if the token was successfully transferred to the receiver_id
export function internalResolveTransfer({
    contract,
    authorizedId,
    ownerId,
    receiverId,
    tokenId,
    approvedAccountIds,
    memo
}:{
    contract: Contract,
    authorizedId: string,
    ownerId: string,
    receiverId: string,
    tokenId: string,
    approvedAccountIds: { [key: string]: number },
    memo: string    
}) {
    /*
        FILL THIS IN
    */
}