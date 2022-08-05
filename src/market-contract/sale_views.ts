import { Contract } from ".";
import { restoreOwners } from "./internals";
import { Sale } from "./sale";
    
//returns the number of sales the marketplace has up (as a string)
export function internal_supply_sales(contract: Contract): string {
    //returns the sales object length wrapped as a string
    return contract.sales.len().toString();
}

//returns the number of sales for a given account (result is a string)
export function internal_supply_by_owner_id(contract, accountId): string {
    //get the set of sales for the given owner Id
    let byOwnerId = restoreOwners(contract.byOwnerId.get(accountId));
    //if there as some set, we return the length but if there wasn't a set, we return 0
    if (byOwnerId == null) {
        return "0"
    }

    return byOwnerId.len().toString();
}

//returns paginated sale objects for a given account. (result is a vector of sales)
export function internal_sales_by_owner_id(contract: Contract, accountId: string, fromIndex, limit): Sale[] {
    //get the set of token IDs for sale for the given account ID
    let tokenSet = restoreOwners(contract.byOwnerId.get(accountId));

    //if there was no set, we return an empty array
    if (tokenSet == null) {
        return [];
    }
    
    //where to start pagination - if we have a fromIndex, we'll use that - otherwise start from 0 index
    let start = fromIndex ? fromIndex : 0;
    //take the first "limit" elements in the array. If we didn't specify a limit, use 50
    let max = limit ? limit : 50;

    let keys = tokenSet.toArray();
    let sales: Sale[] = []
    for(let i = start; i < max; i++) {
        if(i >= keys.length) {
            break;
        }
        let sale = contract.sales.get(keys[i]) as Sale; 
        if (sale != null) {
            sales.push(sale);
        }
    }
    return sales;
}

//get the number of sales for an nft contract. (returns a string)
export function internal_supply_by_nft_contract_id(contract, nftContractId): string {
    //get the set of tokens for associated with the given nft contract
    let byNftContractId = restoreOwners(contract.byNftContractId.get(nftContractId));
    //if there as some set, we return the length but if there wasn't a set, we return 0
    if (byNftContractId == null) {
        return "0"
    }

    return byNftContractId.len().toString();
}

//returns paginated sale objects associated with a given nft contract. (result is a vector of sales)
export function internal_sales_by_nft_contract_id(contract: Contract, accountId: string, fromIndex, limit): Sale[] {
    //get the set of token IDs for sale for the given contract ID
    let tokenSet = restoreOwners(contract.byNftContractId.get(accountId));

    //if there was no set, we return an empty array
    if (tokenSet == null) {
        return [];
    }
    
    //where to start pagination - if we have a fromIndex, we'll use that - otherwise start from 0 index
    let start = fromIndex ? fromIndex : 0;
    //take the first "limit" elements in the array. If we didn't specify a limit, use 50
    let max = limit ? limit : 50;

    let keys = tokenSet.toArray();
    let sales: Sale[] = []
    for(let i = start; i < max; i++) {
        if(i >= keys.length) {
            break;
        }
        let sale = contract.sales.get(keys[i]) as Sale; 
        if (sale != null) {
            sales.push(sale);
        }
    }
    return sales;
}

//get a sale information for a given unique sale ID (contract + DELIMITER + token ID)
export function internal_get_sale(
    contract: Contract, 
    nftContractToken: string
) {
    //try and get the sale object for the given unique sale ID. Will return an option since
    //we're not guaranteed that the unique sale ID passed in will be valid.n);
    return contract.sales.get(nftContractToken);
}



