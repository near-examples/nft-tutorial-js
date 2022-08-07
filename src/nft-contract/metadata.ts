// @ts-nocheck
import { Contract } from ".";

//defines the payout type we'll be returning as a part of the royalty standards.
export class Payout {
    payout: { [accountId: string]: bigint };
    constructor({ payout }: { payout: { [accountId: string]: bigint } }) {
        this.payout = payout;
    }
}

export class NFTContractMetadata {
    /*
        FILL THIS IN
    */
}

export class TokenMetadata {
    /*
        FILL THIS IN
    */
}

export class Token {
    /*
        FILL THIS IN
    */
}

//The Json token is what will be returned from view calls. 
export class JsonToken {
    /*
        FILL THIS IN
    */
}

//get the information for a specific token ID
export function internalNftMetadata({
    contract
}:{
    contract: Contract
}): NFTContractMetadata {
    /*
        FILL THIS IN
    */
}