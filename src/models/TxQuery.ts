/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TransferDetails {
    from: string;
    to: string;
    amount: string;
    isSuccess: boolean;
    symbol: string;
    timestamp: number;
}

export interface SubscanExtrinsics {
    block_timestamp: number;
    block_num: number;
    extrinsic_index: string;
    call_module_function: string;
    call_module: string;
    params: any;
    account_id: string;
    account_index: string;
    signature: string;
    nonce: number;
    extrinsic_hash: string;
    success: boolean;
    fee: string;
    fee_used: string;
    from_hex: string;
    finalized: boolean;
    account_display: { address: string };
}

export interface XvmTxHistory {
    timestamp: number;
    extrinsicHash: string;
    destination: string;
    amount: string;
    erc20Address: string;
}
