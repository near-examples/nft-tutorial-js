import { near } from "near-sdk-js";
import { NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { assert, assert_at_least_one_yocto, bytes_for_approved_account_id, internal_add_token_to_owner, internal_transfer, refundDeposit, refund_approved_account_ids_iter, royalty_to_payout } from "./internals";
import { Token } from "./metadata";

//calculates the payout for a token given the passed in balance. This is a view method
export function internal_nft_payout(contract, tokenId, balance, maxLenPayout) {
    //get the token object
    let token = contract.tokensById.get(tokenId);
    if (token == null) {
        near.panic("no token");
    }

    //get the owner of the token
    let ownerId = token.owner_id;
    //keep track of the total perpetual royalties
    let totalPerpatual = 0;
    //keep track of the payout object to send back
    let payoutObj = {};
    //get the royalty object from token
    let royalty = token.royalty;

    //make sure we're not paying out to too many people (GAS limits this)
    assert(Object.keys(royalty).length <= maxLenPayout, "Market cannot payout to that many receivers");
    
    //go through each key and value in the royalty object
    for (const [key, value] of Object.entries(royalty)) {
        //only insert into the payout if the key isn't the token owner (we add their payout at the end)
        if (key != ownerId) {
            payoutObj[key] = royalty_to_payout(value, balance);
            totalPerpatual += value;
        }
    }

    // payout to previous owner who gets 100% - total perpetual royalties
    payoutObj[ownerId] = royalty_to_payout(10000 - totalPerpatual, balance);

    //return the payout object
    return {
        payout: payoutObj
    }
}

//transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance. 
export function internal_nft_transfer_payout(contract, receiverId, tokenId, approvalId, memo, balance, maxLenPayout) {
    //assert that the user attached 1 yocto NEAR for security reasons
    assert_one_yocto();
    //get the sender ID
    let senderId = near.predecessorAccountId();
    //transfer the token to the passed in receiver and get the previous token object back
    let previousToken = internal_transfer(
        senderId,
        receiverId,
        tokenId,
        approvalId,
        memo,
    );

    //refund the previous token owner for the storage used up by the previous approved account IDs
    refund_approved_account_ids_iter(
        previousToken.owner_id,
        previousToken.approved_account_ids,
    );

    //get the owner of the token
    let ownerId = token.owner_id;
    //keep track of the total perpetual royalties
    let totalPerpatual = 0;
    //keep track of the payout object to send back
    let payoutObj = {};
    //get the royalty object from token
    let royalty = token.royalty;

    //make sure we're not paying out to too many people (GAS limits this)
    assert(Object.keys(royalty).length <= maxLenPayout, "Market cannot payout to that many receivers");
    
    //go through each key and value in the royalty object
    for (const [key, value] of Object.entries(royalty)) {
        //only insert into the payout if the key isn't the token owner (we add their payout at the end)
        if (key != ownerId) {
            payoutObj[key] = royalty_to_payout(value, balance);
            totalPerpatual += value;
        }
    }

    // payout to previous owner who gets 100% - total perpetual royalties
    payoutObj[ownerId] = royalty_to_payout(10000 - totalPerpatual, balance);

    //return the payout object
    return {
        payout: payoutObj
    }
}