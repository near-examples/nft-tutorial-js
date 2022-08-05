import { assert, near } from "near-sdk-js";
import { internal_supply_by_owner_id } from "./sale_views";

/// where we add the sale because we know nft owner can only call nft_approve
export function internal_nft_on_approve(contract, tokenId, ownerId, approvalId, msg) {
    // get the contract ID which is the predecessor
    let contractId = near.predecessorAccountId();
    //get the signer which is the person who initiated the transaction
    let signerId = near.signerAccountId();
    
    //make sure that the signer isn't the predecessor. This is so that we're sure
    //this was called via a cross-contract call
    assert(signerId != contractId, "this function can only be called via a cross-contract call");
    //make sure the owner ID is the signer. 
    assert(ownerId == signerId, "only the owner of the token can approve it");
    
    //we need to enforce that the user has enough storage for 1 EXTRA sale.  
    let storageAmount = contract.storage_minimum_balance();
    //get the total storage paid by the owner
    let ownerPaidStorage = contract.storageDeposits.get(signerId) || BigInt(0);
    //get the storage required which is simply the storage for the number of sales they have + 1 
    let signerStorageRequired = (BigInt(internal_supply_by_owner_id(contract, signerId)) + BigInt(1)) * BigInt(storageAmount); 
    
    //make sure that the total paid is >= the required storage
    assert(ownerPaidStorage >= signerStorageRequired, "the owner does not have enough storage to approve this token");
    
}


    assert!(
        owner_paid_storage >= signer_storage_required,
        "Insufficient storage paid: {}, for {} sales at {} rate of per sale",
        owner_paid_storage, signer_storage_required / STORAGE_PER_SALE, STORAGE_PER_SALE
    );

    //if all these checks pass we can create the sale conditions object.
    let SaleArgs { sale_conditions } =
        //the sale conditions come from the msg field. The market assumes that the user passed
        //in a proper msg. If they didn't, it panics. 
        near_sdk::serde_json::from_str(&msg).expect("Not valid SaleArgs");

    //create the unique sale ID which is the contract + DELIMITER + token ID
    let contract_and_token_id = format!("{}{}{}", nft_contract_id, DELIMETER, token_id);
    
    //insert the key value pair into the sales map. Key is the unique ID. value is the sale object
    self.sales.insert(
        &contract_and_token_id,
        &Sale {
            owner_id: owner_id.clone(), //owner of the sale / token
            approval_id, //approval ID for that token that was given to the market
            nft_contract_id: nft_contract_id.to_string(), //NFT contract the token was minted on
            token_id: token_id.clone(), //the actual token ID
            sale_conditions, //the sale conditions 
       },
    );

    //Extra functionality that populates collections necessary for the view calls 

    //get the sales by owner ID for the given owner. If there are none, we create a new empty set
    let mut by_owner_id = self.by_owner_id.get(&owner_id).unwrap_or_else(|| {
        UnorderedSet::new(
            StorageKey::ByOwnerIdInner {
                //we get a new unique prefix for the collection by hashing the owner
                account_id_hash: hash_account_id(&owner_id),
            }
            .try_to_vec()
            .unwrap(),
        )
    });
    
    //insert the unique sale ID into the set
    by_owner_id.insert(&contract_and_token_id);
    //insert that set back into the collection for the owner
    self.by_owner_id.insert(&owner_id, &by_owner_id);

    //get the token IDs for the given nft contract ID. If there are none, we create a new empty set
    let mut by_nft_contract_id = self
        .by_nft_contract_id
        .get(&nft_contract_id)
        .unwrap_or_else(|| {
            UnorderedSet::new(
                StorageKey::ByNFTContractIdInner {
                    //we get a new unique prefix for the collection by hashing the owner
                    account_id_hash: hash_account_id(&nft_contract_id),
                }
                .try_to_vec()
                .unwrap(),
            )
        });
    
    //insert the token ID into the set
    by_nft_contract_id.insert(&token_id);
    //insert the set back into the collection for the given nft contract ID
    self.by_nft_contract_id
        .insert(&nft_contract_id, &by_nft_contract_id);
}