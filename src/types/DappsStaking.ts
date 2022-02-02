import { Struct } from '@polkadot/types';
import { Balance } from '@polkadot/types/interfaces';

export interface PalletDapsStakingEraRewardAndStake extends Struct {
    readonly rewards: Balance;
    readonly staked: Balance;
}
