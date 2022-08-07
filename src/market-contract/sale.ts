import { assert, bytes, near } from "near-sdk-js";
import { Contract, DELIMETER } from ".";
import { assertOneYocto, internallyRemoveSale } from "./internal";

//GAS constants to attach to calls
const GAS_FOR_ROYALTIES = 115_000_000_000_000;
const GAS_FOR_NFT_TRANSFER = 15_000_000_000_000;

//struct that holds important information about each sale on the market
export class Sale {
    //owner of the sale
    owner_id: string;
    //market contract's approval ID to transfer the token on behalf of the owner
    approval_id: number;
    //nft contract where the token was minted
    nft_contract_id: string;
    //actual token ID for sale
    token_id: String;
    //sale price in yoctoNEAR that the token is listed for
    sale_conditions: string;
    
    constructor(
        {
            ownerId,
            approvalId,
            nftContractId,
            tokenId,
            saleConditions,
        }:{ 
            ownerId: string,
            approvalId: number,
            nftContractId: string,
            tokenId: String,
            saleConditions: string,
        }) {
        this.owner_id = ownerId;
        this.approval_id = approvalId;
        this.nft_contract_id = nftContractId;
        this.token_id = tokenId;
        this.sale_conditions = saleConditions;
    }
}

//removes a sale from the market. 
export function internalRemoveSale({
    contract,
    nftContractId,
    tokenId
}:{ 
    contract: Contract, 
    nftContractId: string, 
    tokenId: string 
}) {
    //assert that the user has attached exactly 1 yoctoNEAR (for security reasons)
    assertOneYocto();
    
    //get the sale object as the return value from removing the sale internally
    let sale = internallyRemoveSale(contract, nftContractId, tokenId);

    //get the predecessor of the call and make sure they're the owner of the sale
    let ownerId = near.predecessorAccountId();

    //assert that the owner of the sale is the same as the caller of the function
    assert(ownerId == sale.owner_id, "only the owner of the sale can remove it");
}

//updates the price for a sale on the market
export function internalUpdatePrice({
    contract,
    nftContractId,
    tokenId,
    price
}:{ 
    contract: Contract, 
    nftContractId: string, 
    tokenId: string, 
    price: string 
}) {
    //assert that the user has attached exactly 1 yoctoNEAR (for security reasons)
    assertOneYocto();

    //create the unique sale ID from the nft contract and token
    let contractAndTokenId = `${nftContractId}${DELIMETER}${tokenId}`;

    //get the sale object from the unique sale ID. If there is no token, panic. 
    let sale = contract.sales.get(contractAndTokenId) as Sale;
    if (sale == null) {
        near.panic("no sale");
    }

    assert(near.predecessorAccountId() == sale.owner_id, "only the owner of the sale can update it");
    //set the sale conditions equal to the passed in price
    sale.sale_conditions = price; 
    //insert the sale back into the map for the unique sale ID
    contract.sales.set(contractAndTokenId, sale);
}

//place an offer on a specific sale. The sale will go through as long as your deposit is greater than or equal to the list price
export function internalOffer({
    contract,
    nftContractId,
    tokenId
}:{
    contract: Contract, 
    nftContractId: string, 
    tokenId: string
}) {
    //get the attached deposit and make sure it's greater than 0
    let deposit = near.attachedDeposit().valueOf();
    assert(deposit > 0, "deposit must be greater than 0");
 
    //get the unique sale ID (contract + DELIMITER + token ID)
    let contractAndTokenId = `${nftContractId}${DELIMETER}${tokenId}`;
    //get the sale object from the unique sale ID. If the sale doesn't exist, panic.
    let sale = contract.sales.get(contractAndTokenId) as Sale;
    if (sale == null) {
        near.panic("no sale");
    }

    //get the buyer ID which is the person who called the function and make sure they're not the owner of the sale
    let buyerId = near.predecessorAccountId();
    assert(buyerId != sale.owner_id, "you can't offer on your own sale");

    //get the u128 price of the token (dot 0 converts from U128 to u128)
    let price = BigInt(sale.sale_conditions);
    //make sure the deposit is greater than the price
    assert(deposit >= price, "deposit must be greater than or equal to price");
    
    //process the purchase (which will remove the sale, transfer and get the payout from the nft contract, and then distribute royalties) 
    processPurchase({contract, nftContractId, tokenId, price: deposit.toString(), buyerId});
}

//private function used when a sale is purchased. 
//this will remove the sale, transfer and get the payout from the nft contract, and then distribute royalties
export function processPurchase({
    contract,
    nftContractId,
    tokenId,
    price,
    buyerId
}:{
    contract: Contract, 
    nftContractId: string, 
    tokenId: string, 
    price: string, 
    buyerId: string
}) {
    //get the sale object by removing the sale
    let sale = internallyRemoveSale(contract, nftContractId, tokenId);

    //initiate a cross contract call to the nft contract. This will transfer the token to the buyer and return
    //a payout object used for the market to distribute funds to the appropriate accounts.
    const promise = near.promiseBatchCreate(nftContractId);
    near.promiseBatchActionFunctionCall(
        promise, 
        "nft_transfer_payout", 
        bytes(JSON.stringify({ 
                receiver_id: buyerId, //purchaser (person to transfer the NFT to)
                token_id: tokenId, //token ID to transfer
                approval_id: sale.approval_id, //market contract's approval ID in order to transfer the token on behalf of the owner
                memo: "payout from market", //memo (to include some context)
                /*
                    the price that the token was purchased for. This will be used in conjunction with the royalty percentages
                    for the token in order to determine how much money should go to which account. 
                */
                balance: price, 
                max_len_payout : 10 //the maximum amount of accounts the market can payout at once (this is limited by GAS)
        })), 
        1, // 1 yoctoNEAR
        GAS_FOR_NFT_TRANSFER
    );

    //after the transfer payout has been initiated, we resolve the promise by calling our own resolve_purchase function. 
    //resolve purchase will take the payout object returned from the nft_transfer_payout and actually pay the accounts
    near.promiseThen(
        promise, 
        near.currentAccountId(), 
        "resolve_purchase", 
        bytes(JSON.stringify({
            buyer_id: buyerId, //the buyer and price are passed in incase something goes wrong and we need to refund the buyer
            price: price
        })), 
        0, // no deposit 
        GAS_FOR_ROYALTIES
    );
    return near.promiseReturn(promise);
}

/*
    private method used to resolve the promise when calling nft_transfer_payout. This will take the payout object and 
    check to see if it's authentic and there's no problems. If everything is fine, it will pay the accounts. If there's a problem,
    it will refund the buyer for the price. 
*/
export function internalResolvePurchase({
    buyerId,
    price
}:{
    buyerId: string, 
    price: string
}) {
    assert(near.currentAccountId() === near.predecessorAccountId(), "Only the contract itself can call this method");

    // checking for payout information returned from the nft_transfer_payout method
    let result = near.promiseResult(0);
    let payout = null;
    if (typeof result === 'string') {
        //if we set the payout_option to None, that means something went wrong and we should refund the buyer
        
        try {
            let payoutOption = JSON.parse(result);
            if (Object.keys(payoutOption.payout).length > 10 || Object.keys(payoutOption.payout).length < 1) {
                //we'll check if length of the payout object is > 10 or it's empty. In either case, we return None
                throw "Cannot have more than 10 royalties";
            //if the payout object is the correct length, we move forward
            } else {
                //we'll keep track of how much the nft contract wants us to payout. Starting at the full price payed by the buyer
                let remainder = BigInt(price);
                //loop through the payout and subtract the values from the remainder. 
                Object.entries(payoutOption.payout).forEach(([key, value], index) => {
                    remainder = remainder - BigInt(value as string);
                });

                //Check to see if the NFT contract sent back a faulty payout that requires us to pay more or too little. 
                //The remainder will be 0 if the payout summed to the total price. The remainder will be 1 if the royalties
                //we something like 3333 + 3333 + 3333.
                if (remainder == BigInt(0) || remainder == BigInt(1)) {
                    //set the payout because nothing went wrong
                    payout = payoutOption.payout;
                } else {
                    //if the remainder was anything but 1 or 0, we return None
                    throw "Payout is not correct";
                }
            }
        } catch (e) {
            near.log(`error parsing payout object ${result}`);
            payout = null;
        }
    }
    
    //if the payout was null, we refund the buyer for the price they payed and return
    if (payout == null) {
        const promise = near.promiseBatchCreate(buyerId);
        near.promiseBatchActionTransfer(promise, BigInt(price))
        return price;
    } 
    // NEAR payouts
    for (let [key, value] of Object.entries(payout)) {
        const promise = near.promiseBatchCreate(key);
        near.promiseBatchActionTransfer(promise, BigInt(value as string))
    }

    //return the price payout out
    return price;
}