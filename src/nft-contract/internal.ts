import { assert, near, UnorderedSet, Vector } from "near-sdk-js";
import { Contract, NFT_METADATA_SPEC, NFT_STANDARD_NAME } from ".";
import { Token } from "./metadata";

// Gets a collection and deserializes it into a set that can be used.
export function restoreOwners(collection) {
    if (collection == null) {
        return null;
    }
    return UnorderedSet.deserialize(collection as UnorderedSet);
}

//refund the initial deposit based on the amount of storage that was used up
export function refundDeposit(storageUsed: bigint) {
    //get how much it would cost to store the information
    let requiredCost = storageUsed * near.storageByteCost().valueOf()
    //get the attached deposit
    let attachedDeposit = near.attachedDeposit().valueOf();

    //make sure that the attached deposit is greater than or equal to the required cost
    assert(
        requiredCost <= attachedDeposit,
        `Must attach ${requiredCost} yoctoNEAR to cover storage`
    )

    //get the refund amount from the attached deposit - required cost
    let refund = attachedDeposit - requiredCost;
    near.log(`Refunding ${refund} yoctoNEAR`);

    //if the refund is greater than 1 yocto NEAR, we refund the predecessor that amount
    if (refund > 1) {
        // Send the money to the beneficiary (TODO: don't use batch actions)
        const promise = near.promiseBatchCreate(near.predecessorAccountId());
        near.promiseBatchActionTransfer(promise, refund)
    }
}

//used to make sure the user attached exactly 1 yoctoNEAR
export function assertOneYocto() {
    assert(near.attachedDeposit().toString() === "1", "Requires attached deposit of exactly 1 yoctoNEAR");
}

//add a token to the set of tokens an owner has
export function internalAddTokenToOwner(contract: Contract, accountId: string, tokenId: string) {
    //get the set of tokens for the given account
    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));

    if(tokenSet == null) {
        //if the account doesn't have any tokens, we create a new unordered set
        tokenSet = new UnorderedSet("tokensPerOwner" + accountId.toString());
    }

    //we insert the token ID into the set
    tokenSet.set(tokenId);

    //we insert that set for the given account ID. 
    contract.tokensPerOwner.set(accountId, tokenSet);
}

//remove a token from an owner (internal method and can't be called directly via CLI).
export function internalRemoveTokenFromOwner(contract: Contract, accountId: string, tokenId: string) {
    //we get the set of tokens that the owner has
    let tokenSet = restoreOwners(contract.tokensPerOwner.get(accountId));
    //if there is no set of tokens for the owner, we panic with the following message:
    if (tokenSet == null) {
        near.panic("Token should be owned by the sender");
    }

    //we remove the the token_id from the set of tokens
    tokenSet.remove(tokenId)

    //if the token set is now empty, we remove the owner from the tokens_per_owner collection
    if (tokenSet.isEmpty()) {
        contract.tokensPerOwner.remove(accountId);
    } else { //if the token set is not empty, we simply insert it back for the account ID. 
        contract.tokensPerOwner.set(accountId, tokenSet);
    }
}

//transfers the NFT to the receiver_id (internal method and can't be called directly via CLI).
export function internalTransfer(contract: Contract, senderId: string, receiverId: string, tokenId: string, memo: string): Token {
    //get the token object by passing in the token_id
    let token = contract.tokensById.get(tokenId) as Token;
    if (token == null) {
        near.panic("no token found");
    }

    //if the sender doesn't equal the owner, we panic
    assert(token.owner_id === senderId, "Token should be owned by the sender");

    //we make sure that the sender isn't sending the token to themselves
    assert(token.owner_id != receiverId, "The token owner and the receiver should be different")

    //we remove the token from it's current owner's set
    internalRemoveTokenFromOwner(contract, token.owner_id, tokenId);
    //we then add the token to the receiver_id's set
    internalAddTokenToOwner(contract, receiverId, tokenId);

    //we create a new token struct 
    let newToken = new Token ({
        ownerId: receiverId,
    });

    //insert that new token into the tokens_by_id, replacing the old entry 
    contract.tokensById.set(tokenId, newToken);

    //if there was some memo attached, we log it. 
    if (memo != null) {
        near.log(`Memo: ${memo}`);
    }

    //return the previous token object that was transferred.
    return token
}