// @ts-nocheck
import { assert, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { internalAddTokenToOwner, refundDeposit } from "./internal";
import { Token, TokenMetadata } from "./metadata";

export function internalMint(
    contract: Contract, 
    tokenId: string, 
    metadata: TokenMetadata, 
    receiverId: string, 
) {
    /*
        FILL THIS IN
    */
}