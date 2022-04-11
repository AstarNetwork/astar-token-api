import { Struct } from '@polkadot/types';
import { Balance, Perbill } from '@polkadot/types/interfaces';

export interface EraRewardAndStake extends Struct {
    readonly rewards: Balance;
    readonly staked: Balance;
}

export interface RewardDistributionConfig extends Struct {
    readonly baseTreasuryPercent: Perbill;
    readonly baseStakerPercent: Perbill;
    readonly dappsPercent: Perbill;
    readonly collatorsPercent: Perbill;
    readonly adjustablePercent: Perbill;
    readonly idealDappsStakingTvl: Perbill;
}

export interface RewardInfo extends Struct {
    readonly stakers: Balance;
    readonly dapps: Balance;
}

export interface EraInfo extends Struct {
    readonly rewards: RewardInfo;
    readonly staked: Balance;
    readonly locked: Balance;
}
