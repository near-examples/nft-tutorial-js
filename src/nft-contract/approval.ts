// @ts-nocheck
import { assert, bytes, near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { assertAtLeastOneYocto, assertOneYocto, bytesForApprovedAccountId, internalAddTokenToOwner, refundDeposit, refundApprovedAccountIds, refundApprovedAccountIdsIter } from "./internal";
import { Token } from "./metadata";

const GAS_FOR_NFT_ON_APPROVE = 35_000_000_000_000;

//approve an account ID to transfer a token on your behalf
export function internalNftApprove({
    contract,
    tokenId,
    accountId,
    msg
}:{ 
    contract: Contract, 
    tokenId: string, 
    accountId: string, 
    msg: string 
}) {
    /*
        FILL THIS IN
    */
}

//check if the passed in account has access to approve the token ID
export function internalNftIsApproved({
    contract,
    tokenId,
    approvedAccountId,
    approvalId
}:{ 
    contract: Contract, 
    tokenId: string,
    approvedAccountId: string, 
    approvalId: number 
}) {
    /*
        FILL THIS IN
    */
}

//revoke a specific account from transferring the token on your behalf
export function internalNftRevoke({
    contract,
    tokenId,
    accountId
}:{ 
    contract: Contract, 
    tokenId: string, 
    accountId: string 
}) {
    /*
        FILL THIS IN
    */
}

//revoke all accounts from transferring the token on your behalf
export function internalNftRevokeAll({
    contract,
    tokenId
}:{ 
    contract: Contract, 
    tokenId: string 
}) {
    /*
        FILL THIS IN
    */
}