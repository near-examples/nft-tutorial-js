// @ts-nocheck
import { assert, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { internalAddTokenToOwner, refundDeposit } from "./internal";
import { Token, TokenMetadata } from "./metadata";

export function internalMint({
    contract,
    tokenId,
    metadata,
    receiverId,
    perpetualRoyalties
}:{ 
    contract: Contract, 
    tokenId: string, 
    metadata: TokenMetadata, 
    receiverId: string 
    perpetualRoyalties: {[key: string]: number}
}): void {
    //measure the initial storage being used on the contract TODO
    let initialStorageUsage = near.storageUsage();

    //specify the token struct that contains the owner ID 
    let token = new Token ({
        //set the owner ID equal to the receiver ID passed into the function
        ownerId: receiverId
    });

    //insert the token ID and token struct and make sure that the token doesn't exist
    assert(!contract.tokensById.containsKey(tokenId), "Token already exists");
    contract.tokensById.set(tokenId, token)

    //insert the token ID and metadata
    contract.tokenMetadataById.set(tokenId, metadata);

    //call the internal method for adding the token to the owner
    internalAddTokenToOwner(contract, token.owner_id, tokenId)

    //calculate the required storage which was the used - initial TODO
    let requiredStorageInBytes = near.storageUsage().valueOf() - initialStorageUsage.valueOf();

    //refund any excess storage if the user attached too much. Panic if they didn't attach enough to cover the required.
    refundDeposit(requiredStorageInBytes);
}