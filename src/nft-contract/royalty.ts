// @ts-nocheck
import { assert, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { assertAtLeastOneYocto, assertOneYocto, bytesForApprovedAccountId, internalAddTokenToOwner, internalTransfer, refundDeposit, refundApprovedAccountIds, refundApprovedAccountIdsIter, royaltyToPayout } from "./internal";
import { Token } from "./metadata";

//calculates the payout for a token given the passed in balance. This is a view method
export function internalNftPayout({
    contract,
    tokenId,
    balance,
    maxLenPayout
}:{
    contract: Contract, 
    tokenId: string,
    balance: bigint, 
    maxLenPayout: number,
}): { payout: {[key: string]: string }} {
    /*
        FILL THIS IN
    */
}

//transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance. 
export function internalNftTransferPayout({
    contract,
    receiverId,
    tokenId,
    approvalId,
    memo,
    balance,
    maxLenPayout
}:{
    contract: Contract, 
    receiverId: string, 
    tokenId: string,
    approvalId: number,
    memo: string,
    balance: bigint,
    maxLenPayout: number,
}): { payout: {[key: string]: string }} {
    /*
        FILL THIS IN
    */
}