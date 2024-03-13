export interface DappStakingEventResponse {
    data: {
        stakingEvents: DappStakingEventData[];
    };
}

export interface DappStakingAggregatedResponse {
    data: {
        groupedStakingEvents: DappStakingAggregatedData[];
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

export interface DappStakingAggregatedData {
    id: string;
    transaction: UserTransactionType;
    amount: bigint;
    timestamp: bigint;
}

export interface DappStakingTvlData {
    timestamp: bigint;
    amount: bigint;
}
