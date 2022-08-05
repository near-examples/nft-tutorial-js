import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap, Vector, UnorderedSet, assert } from 'near-sdk-js'
import { assert_one_yocto, restoreOwners } from '../nft-contract/internals';

/// This spec can be treated like a version of the standard.
export const NFT_METADATA_SPEC = "nft-1.0.0";

/// This is the name of the NFT standard we're using
export const NFT_STANDARD_NAME = "nep171";

// TODO: don't hard code storage byte cost
export const storageCostPerByte = BigInt('10000000000000000000');

//the minimum storage to have a sale on the contract.
export const STORAGE_PER_SALE: bigint = BigInt(1000) * storageCostPerByte;

//every sale will have a unique ID which is `CONTRACT + DELIMITER + TOKEN_ID`
export const DELIMETER = ".";

@NearBindgen
export class Contract extends NearContract {
    //keep track of the owner of the contract
    owner_id: string;
    
    /*
        to keep track of the sales, we map the ContractAndTokenId to a Sale. 
        the ContractAndTokenId is the unique identifier for every sale. It is made
        up of the `contract ID + DELIMITER + token ID`
    */
    sales: UnorderedMap;
    
    //keep track of all the Sale IDs for every account ID
    byOwnerId: LookupMap;

    //keep track of all the token IDs for sale for a given contract
    byNftContractId: LookupMap;

    //keep track of the storage that accounts have payed
    storageDeposits: LookupMap;

    /*
        initialization function (can only be called once).
        this initializes the contract with metadata that was passed in and
        the owner_id. 
    */
    constructor({ owner_id }: { owner_id: string }) {
        super()
        this.owner_id = owner_id;
        this.sales = new UnorderedMap("sales");
        this.byOwnerId = new LookupMap("byOwnerId");
        this.byNftContractId = new LookupMap("byNftContractId");
        this.storageDeposits = new LookupMap("storageDeposits");
    }

    default() {
        return new Contract({owner_id: ''})
    }

    /*
        STORAGE
    */
    @call
    //Allows users to deposit storage. This is to cover the cost of storing sale objects on the contract
    //Optional account ID is to users can pay for storage for other people.
    storage_deposit({ account_id }: { account_id?: string }) {
        //get the account ID to pay for storage for
        let storageAccountId = account_id || near.predecessorAccountId();

        //get the deposit value which is how much the user wants to add to their storage
        let deposit = near.attachedDeposit().valueOf();

        //make sure the deposit is greater than or equal to the minimum storage for a sale
        assert(deposit >= STORAGE_PER_SALE, `Requires minimum deposit of ${STORAGE_PER_SALE}`);

        //get the balance of the account (if the account isn't in the map we default to a balance of 0)
        let balance: bigint = this.storageDeposits.get(storageAccountId) as bigint || BigInt(0);
        //add the deposit to their balance
        balance += deposit;
        //insert the balance back into the map for that account ID
        this.storageDeposits.set(storageAccountId, balance);
    }

    @call
    //Allows users to withdraw any excess storage that they're not using. Say Bob pays 0.01N for 1 sale
    //Alice then buys Bob's token. This means bob has paid 0.01N for a sale that's no longer on the marketplace
    //Bob could then withdraw this 0.01N back into his account. 
    storage_withdraw() {
        //make sure the user attaches exactly 1 yoctoNEAR for security purposes.
        //this will redirect them to the NEAR wallet (or requires a full access key). 
        assert_one_yocto();

        //the account to withdraw storage to is always the function caller
        let ownerId = near.predecessorAccountId();
        //get the amount that the user has by removing them from the map. If they're not in the map, default to 0
        let amount: bigint = this.storageDeposits.remove(ownerId) as bigint || BigInt(0);
        
        //how many sales is that user taking up currently. This returns a set
        let sales = restoreOwners(this.byOwnerId.get(ownerId));
        //get the length of that set. 
        let len = 0;
        if (sales != null) {
            len = sales.len();
        }   
        
        //how much NEAR is being used up for all the current sales on the account 
        let diff = BigInt(len) * STORAGE_PER_SALE;
        //the excess to withdraw is the total storage paid - storage being used up.
        amount -= diff;

        //if that excess to withdraw is > 0, we transfer the amount to the user.
        if (amount > 0) {
            const promise = near.promiseBatchCreate(ownerId);
            near.promiseBatchActionTransfer(promise, amount)
        }

        //we need to add back the storage being used up into the map if it's greater than 0.
        //this is so that if the user had 500 sales on the market, we insert that value here so
        //if those sales get taken down, the user can then go and withdraw 500 sales worth of storage.
        if (diff > 0) {
            this.storageDeposits.set(ownerId, diff);
        }
    }

    @view
    //return the minimum storage for 1 sale
    storage_minimum_balance(): string {
        return STORAGE_PER_SALE.toString()
    }

    @view
    //return how much storage an account has paid for
    storage_balance_of({ account_id }: { account_id: string}): string {
        return this.storageDeposits.get(account_id) as string || "0";
    }
}