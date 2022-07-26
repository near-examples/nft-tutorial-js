import { near, UnorderedSet } from "near-sdk-js";

export function assert(statement, message) {
    if (!statement) {
        throw Error(`Assertion failed: ${message}`)
    }
}

//add a token to the set of tokens an owner has
export function internalAddTokenToOwner(contract, accountId, tokenId) {
    //get the set of tokens for the given account
    let tokenSet = contract.tokensPerOwner[accountId];

    if(!(accountId in contract.tokensPerOwner)) {
        //if the account doesn't have any tokens, we create a new unordered set
        tokenSet = new UnorderedSet(accountId);
    }

    //we insert the token ID into the set
    tokenSet.insert(tokenId);

    //we insert that set for the given account ID. 
    contract.tokensPerOwner[accountId] = tokenSet;
}

//refund the initial deposit based on the amount of storage that was used up
export function refundDeposit(storageUsed) {
    //get how much it would cost to store the information
    // TODO: don't hard code storage byte cost
    let requiredCost = storageUsed / 100000;
    //get the attached deposit
    let attachedDeposit = near.attachedDeposit();

    //make sure that the attached deposit is greater than or equal to the required cost
    assert(
        requiredCost <= attachedDeposit,
        `Must attach ${requiredCost} yoctoNEAR to cover storage`
    )

    //get the refund amount from the attached deposit - required cost
    let refund = attachedDeposit - requiredCost;

    //if the refund is greater than 1 yocto NEAR, we refund the predecessor that amount
    if (refund > 1) {
        // Send the money to the beneficiary (TODO: don't use batch actions)
        const promise = near.promiseBatchCreate(near.predecessorAccountId());
        near.promiseBatchActionTransfer(promise, refund)
    }
}