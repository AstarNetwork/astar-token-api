export interface DappStakingEventResponse {
    data: {
        stakingEvents: DappStakingEventData[];
    };
}

export enum UserTransactionType {
    BondAndStake = 'BondAndStake',
    UnbondAndUnstake = 'UnbondAndUnstake',
    Withdraw = 'Withdraw',
    WithdrawFromUnregistered = 'WithdrawFromUnregistered',
    NominationTransfer = 'NominationTransfer',
}

export interface DappStakingEventData {
    id: string;
    userAddress: string;
    transaction: UserTransactionType;
    contractAddress: string;
    amount: bigint;
    timestamp: bigint;
    blockNumber: bigint;
}
