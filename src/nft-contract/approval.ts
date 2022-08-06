// @ts-nocheck
import { assert, bytes, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { assertAtLeastOneYocto, assertOneYocto, bytesForApprovedAccountId, internalAddTokenToOwner, refundDeposit, refundApprovedAccountIds, refundApprovedAccountIdsIter } from "./internal";
import { Token } from "./metadata";

const GAS_FOR_NFT_ON_APPROVE = 35_000_000_000_000;

//approve an account ID to transfer a token on your behalf
export function internalNftApprove(
    contract: Contract, 
    tokenId: string, 
    accountId: string, 
    msg: string
) {
    /*
        FILL THIS IN
    */
}

//check if the passed in account has access to approve the token ID
export function internalNftIsApproved(
    contract: Contract, 
    tokenId: string, 
    approvedAccountId: string, 
    approvalId: number
) {
    /*
        FILL THIS IN
    */
}

//revoke a specific account from transferring the token on your behalf
export function internalNftRevoke(
    contract: Contract, 
    tokenId: string, 
    accountId: string
) {
    /*
        FILL THIS IN
    */
}

//revoke all accounts from transferring the token on your behalf
export function internalNftRevokeAll(
    contract: Contract, 
    tokenId: string
) {
    /*
        FILL THIS IN
    */
}