import { near } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { assert, assert_at_least_one_yocto, assert_one_yocto, bytes_for_approved_account_id, internal_add_token_to_owner, internal_transfer, refundDeposit, refund_approved_account_ids, refund_approved_account_ids_iter, royalty_to_payout } from "./internals";
import { Token } from "./metadata";

//calculates the payout for a token given the passed in balance. This is a view method
export function internal_nft_payout(
    contract: Contract, 
    tokenId: string,
    balance: bigint, 
    maxLenPayout: number,
    ): { payout: {[key: string]: string }} {
    //get the token object
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token");
    }

    //get the owner of the token
    let ownerId = token.owner_id;
    //keep track of the total perpetual royalties
    let totalPerpetual = 0;
    //keep track of the payout object to send back
    let payoutObj: { [key: string]: string } = {};
    //get the royalty object from token
    let royalty = token.royalty;

    //make sure we're not paying out to too many people (GAS limits this)
    assert(Object.keys(royalty).length <= maxLenPayout, "Market cannot payout to that many receivers");
    
    //go through each key and value in the royalty object
    Object.entries(royalty).forEach(([key, value], index) => {
        //only insert into the payout if the key isn't the token owner (we add their payout at the end)
        if (key != ownerId) {
            payoutObj[key] = royalty_to_payout(value, balance);
            totalPerpetual += value;
        }
    });

    // payout to previous owner who gets 100% - total perpetual royalties
    payoutObj[ownerId] = royalty_to_payout(10000 - totalPerpetual, balance);

    //return the payout object
    return {
        payout: payoutObj
    }
}

//transfers the token to the receiver ID and returns the payout object that should be payed given the passed in balance. 
export function internal_nft_transfer_payout(
    contract: Contract, 
    receiverId: string, 
    tokenId: string,
    approvalId: number,
    memo: string,
    balance: bigint,
    maxLenPayout: number,
    ): { payout: {[key: string]: string }} {
    //assert that the user attached 1 yocto NEAR for security reasons
    assert_one_yocto();
    //get the sender ID
    let senderId = near.predecessorAccountId();
    //transfer the token to the passed in receiver and get the previous token object back
    let previousToken = internal_transfer(
        contract,
        senderId,
        receiverId,
        tokenId,
        approvalId,
        memo,
    );

    //refund the previous token owner for the storage used up by the previous approved account IDs
    refund_approved_account_ids(
        previousToken.owner_id,
        previousToken.approved_account_ids,
    );

    //get the owner of the token
    let ownerId = previousToken.owner_id;
    //keep track of the total perpetual royalties
    let totalPerpetual = 0;
    //keep track of the payout object to send back
    let payoutObj: { [key: string]: string } = {};
    //get the royalty object from token
    let royalty = previousToken.royalty;

    //make sure we're not paying out to too many people (GAS limits this)
    assert(Object.keys(royalty).length <= maxLenPayout, "Market cannot payout to that many receivers");
    
    //go through each key and value in the royalty object
    Object.entries(royalty).forEach(([key, value], index) => {
        //only insert into the payout if the key isn't the token owner (we add their payout at the end)
        if (key != ownerId) {
            payoutObj[key] = royalty_to_payout(value, balance);
            totalPerpetual += value;
        }
    });

    // payout to previous owner who gets 100% - total perpetual royalties
    payoutObj[ownerId] = royalty_to_payout(10000 - totalPerpetual, balance);

    //return the payout object
    return {
        payout: payoutObj
    }
}