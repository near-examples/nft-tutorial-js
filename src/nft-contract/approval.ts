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
        assert at least one yocto for security reasons - this will cause a redirect to the NEAR wallet.
        The user needs to attach enough to pay for storage on the contract
    */
    assertAtLeastOneYocto();

    //get the token object from the token ID
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }
    //make sure that the person calling the function is the owner of the token
    assert(near.predecessorAccountId() === token.owner_id, "Predecessor must be the token owner");

    //get the next approval ID if we need a new approval
    let approvalId = token.next_approval_id;

    //check if the account has been approved already for this token
    let isNewApproval = token.approved_account_ids.hasOwnProperty(accountId);
    token.approved_account_ids[accountId] = approvalId;

    //if it was a new approval, we need to calculate how much storage is being used to add the account.
    let storageUsed = isNewApproval ? bytesForApprovedAccountId(accountId) : 0;

    //increment the token's next approval ID by 1
    token.next_approval_id += 1;
    //insert the token back into the tokens_by_id collection
    contract.tokensById.set(tokenId, token);

    //refund any excess storage attached by the user. If the user didn't attach enough, panic. 
    refundDeposit(BigInt(storageUsed));
    
    //if some message was passed into the function, we initiate a cross contract call on the
    //account we're giving access to. 
    if (msg != null) {
        // Initiating receiver's call and the callback
        const promise = near.promiseBatchCreate(accountId);
        near.promiseBatchActionFunctionCall(
            promise, 
            "nft_on_approve", 
            bytes(JSON.stringify({ 
                token_id: tokenId,
                owner_id: token.owner_id,
                approval_id: approvalId,
                msg
            })), 
            0, // no deposit 
            GAS_FOR_NFT_ON_APPROVE
        );

        near.promiseReturn(promise);
    }
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
    //get the token object from the token_id
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }

    //get the approval number for the passed in account ID
    let approval = token.approved_account_ids[approvedAccountId];

    //if there was no approval ID found for the account ID, we simply return false
    if (approval == null) {
        return false
    }

    //if there was some approval ID found for the account ID
    //if there was no approval_id passed into the function, we simply return true
    if (approvalId == null) {
        return true
    }

    //if a specific approval_id was passed into the function
    //return if the approval ID passed in matches the actual approval ID for the account
    return approvalId == approval;
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
    //assert that the user attached exactly 1 yoctoNEAR for security reasons
    assertOneYocto();

    //get the token object using the passed in token_id
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }

    //get the caller of the function and assert that they are the owner of the token
    let predecessorAccountId = near.predecessorAccountId();
    assert(predecessorAccountId == token.owner_id, "only token owner can revoke");
     
    //if the account ID was in the token's approval, we remove it
    if (token.approved_account_ids.hasOwnProperty(accountId)) {
        delete token.approved_account_ids[accountId];
        
        //refund the funds released by removing the approved_account_id to the caller of the function
        refundApprovedAccountIdsIter(predecessorAccountId, [accountId]);
        
        //insert the token back into the tokens_by_id collection with the account_id removed from the approval list
        contract.tokensById.set(tokenId, token);
    }
}

//revoke all accounts from transferring the token on your behalf
export function internalNftRevokeAll({
    contract,
    tokenId
}:{ 
    contract: Contract, 
    tokenId: string 
}) {
    //assert that the caller attached exactly 1 yoctoNEAR for security
    assertOneYocto();

    //get the token object from the passed in token ID
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }

    //get the caller and make sure they are the owner of the tokens
    let predecessorAccountId = near.predecessorAccountId();
    assert(predecessorAccountId == token.owner_id, "only token owner can revoke");

    //only revoke if the approved account IDs for the token is not empty
    if (token.approved_account_ids && Object.keys(token.approved_account_ids).length === 0 && Object.getPrototypeOf(token.approved_account_ids) === Object.prototype) {
        //refund the approved account IDs to the caller of the function
        refundApprovedAccountIds(predecessorAccountId, token.approved_account_ids);
        //clear the approved account IDs
        token.approved_account_ids = {};
        //insert the token back into the tokens_by_id collection with the approved account IDs cleared
        contract.tokensById.set(tokenId, token);
    }
}