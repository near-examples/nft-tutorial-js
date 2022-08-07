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
        approvedAccountIds: token.approved_account_ids,
        royalty: token.royalty
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
    //assert that the user attached exactly 1 yoctoNEAR. This is for security and so that the user will be redirected to the NEAR wallet. 
    assertOneYocto();
    //get the sender to transfer the token from the sender to the receiver
    let senderId = near.predecessorAccountId();

    //call the internal transfer method and get back the previous token so we can refund the approved account IDs
    let previousToken = internalTransfer(
        contract,
        senderId,
        receiverId,
        tokenId,
        approvalId,
        memo,
    );

    //we refund the owner for releasing the storage used up by the approved account IDs
    refundApprovedAccountIds(
        previousToken.owner_id,
        previousToken.approved_account_ids
    );
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
    //assert that the user attached exactly 1 yocto for security reasons. 
    assertOneYocto();
    //get the sender to transfer the token from the sender to the receiver
    let senderId = near.predecessorAccountId();

    //call the internal transfer method and get back the previous token so we can refund the approved account IDs
    let previousToken = internalTransfer(
        contract,
        senderId,
        receiverId,
        tokenId,
        approvalId,
        memo,
    );

    // Initiating receiver's call and the callback
    const promise = near.promiseBatchCreate(receiverId);
    near.promiseBatchActionFunctionCall(
        promise, 
        "nft_on_transfer", 
        bytes(JSON.stringify({ 
            sender_id: senderId,
            previous_owner_id: previousToken.owner_id,
            token_id: tokenId,
            msg
        })), 
        0, // no deposit 
        GAS_FOR_NFT_ON_TRANSFER
    );

    // We then resolve the promise and call nft_resolve_transfer on our own contract
    near.promiseThen(
        promise, 
        near.currentAccountId(), 
        "nft_resolve_transfer", 
        bytes(JSON.stringify({
            owner_id: previousToken.owner_id,
            receiver_id: receiverId,
            token_id: tokenId,
            approved_account_ids: previousToken.approved_account_ids
        })), 
        0, // no deposit 
        GAS_FOR_RESOLVE_TRANSFER
    );
    return near.promiseReturn(promise);
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
    assert(near.currentAccountId() === near.predecessorAccountId(), "Only the contract itself can call this method");
    // Whether receiver wants to return token back to the sender, based on `nft_on_transfer`
    // call result.
    let result = near.promiseResult(0);
    if (typeof result === 'string') {
        //As per the standard, the nft_on_transfer should return whether we should return the token to it's owner or not
        //if we need don't need to return the token, we simply return true meaning everything went fine
        if (result === 'false') {
            /* 
                since we've already transferred the token and nft_on_transfer returned false, we don't have to 
                revert the original transfer and thus we can just return true since nothing went wrong.
            */
            //we refund the owner for releasing the storage used up by the approved account IDs
            refundApprovedAccountIds(ownerId, approvedAccountIds);
            return true;
        }
    }

    //get the token object if there is some token object
    let token = contract.tokensById.get(tokenId) as Token;
    if (token != null) {
        if (token.owner_id != receiverId) {
            //we refund the owner for releasing the storage used up by the approved account IDs
            refundApprovedAccountIds(ownerId, approvedAccountIds);
            // The token is not owner by the receiver anymore. Can't return it.
            return true;
        }
    //if there isn't a token object, it was burned and so we return true
    } else {
        //we refund the owner for releasing the storage used up by the approved account IDs
        refundApprovedAccountIds(ownerId, approvedAccountIds);
        return true;
    }

    //we remove the token from the receiver
    internalRemoveTokenFromOwner(contract, receiverId, tokenId);
    //we add the token to the original owner
    internalAddTokenToOwner(contract, ownerId, tokenId);

    //we change the token struct's owner to be the original owner 
    token.owner_id = ownerId

    //we refund the receiver any approved account IDs that they may have set on the token
    refundApprovedAccountIds(receiverId, token.approved_account_ids);
    //reset the approved account IDs to what they were before the transfer
    token.approved_account_ids = approvedAccountIds;

    //we inset the token b  ack into the tokens_by_id collection
    contract.tokensById.set(tokenId, token);

    /*
        We need to log that the NFT was reverted back to the original owner.
        The old_owner_id will be the receiver and the new_owner_id will be the
        original owner of the token since we're reverting the transfer.
    */

    // Construct the transfer log as per the events standard.
    let nftTransferLog = {
        // Standard name ("nep171").
        standard: NFT_STANDARD_NAME,
        // Version of the standard ("nft-1.0.0").
        version: NFT_METADATA_SPEC,
        // The data related with the event stored in a vector.
        event: "nft_transfer",
        data: [
            {
                // The optional authorized account ID to transfer the token on behalf of the old owner.
                authorized_id: authorizedId,
                // The old owner's account ID.
                old_owner_id: receiverId,
                // The account ID of the new owner of the token.
                new_owner_id: ownerId,
                // A vector containing the token IDs as strings.
                token_ids: [tokenId],
                // An optional memo to include.
                memo,
            }
        ]
    }

    // Log the serialized json.
    near.log(JSON.stringify(nftTransferLog));

    //return false
    return false
}