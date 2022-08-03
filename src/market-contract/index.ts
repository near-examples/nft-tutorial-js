import { NearContract, NearBindgen, near, call, view, LookupMap, UnorderedMap, Vector, UnorderedSet, assert } from 'near-sdk-js'

/// This spec can be treated like a version of the standard.
export const NFT_METADATA_SPEC = "nft-1.0.0";

/// This is the name of the NFT standard we're using
export const NFT_STANDARD_NAME = "nep171";

export const STORAGE_PER_SALE = 

@NearBindgen
export class Contract extends NearContract {
    //keep track of the owner of the contract
    owner_id: string;
    /*
        to keep track of the sales, we map the ContractAndTokenId to a Sale. 
        the ContractAndTokenId is the unique identifier for every sale. It is made
        up of the `contract ID + DELIMITER + token ID`
    */
    sales: UnorderedMap<string, Sale>;
    //keep track of all the Sale IDs for every account ID
    by_owner_id: LookupMap<string, UnorderedSet<string>>;
    //keep track of all the token IDs for sale for a given contract
    by_nft_contract_id: LookupMap<string, UnorderedSet<string>>;
    //keep track of the storage that accounts have payed
    storage_deposits: LookupMap<string, bigint>;

    /*
        initialization function (can only be called once).
        this initializes the contract with metadata that was passed in and
        the owner_id. 
    */
    constructor({ owner_id }: { owner_id: string }) {
        super()
        this.owner_id = owner_id;
        this.sales = new UnorderedMap("sales");
        this.by_owner_id = new LookupMap("by_owner_id");
        this.by_nft_contract_id = new LookupMap("by_nft_contract_id");
        this.storage_deposits = new LookupMap("storage_deposits");
    }

    deserialize() {
        super.deserialize()
        this.sales = new UnorderedMap("sales");
        this.by_owner_id = new LookupMap("by_owner_id");
        this.by_nft_contract_id = new LookupMap("by_nft_contract_id");
        this.storage_deposits = new LookupMap("storage_deposits");
    }

    /*
        MINT
    */
    @call
    storage_deposit({ account_id }: { account_id?: string }) {
        //get the account ID to pay for storage for
        let storage_account_id = near.predecessorAccountId();
        if (account_id != null) {
            storage_account_id = account_id;
        }
        let deposit = near.attachedDeposit().valueOf();
        assert(deposit >= STORAGE_PER_SALE, `Requires minimum storage deposit of ${STORAGE_PER_SALE}`);
    }
}