import { u32, u64, u128 } from '@polkadot/types';

export class AprCalculationData {
    public blockRewards: u128;
    public timeStamp: u64;
    public latestBlock: u32;
    public developerRewardPercentage: number;
    public blockPerEra: u32;
}
