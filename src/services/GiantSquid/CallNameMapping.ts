export interface Map {
    [key: string]: string;
}

export const CallNameMapping: Map = {
    bond_and_stake: 'BondAndStake',
    unbond_and_unstake: 'UnbondAndUnstake',
    nomination_transfer: 'NominationTransfer',
    withdraw_unbonded: 'Withdraw',
    withdraw_from_unregistered: 'WithdrawFromUnregistered',
    batch: 'Batch',
};
