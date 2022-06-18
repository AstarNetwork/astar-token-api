import { u32, u64, u128 } from '@polkadot/types';
import { TypeRegistry } from '@polkadot/types/create';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import BN from 'bn.js';
import { IAstarApi } from '../../src/client/BaseApi';
import { AprCalculationData } from '../../src/models/AprCalculationData';

/**
 * Astar Polkadot API mock.
 */
export class AstarApiMock implements IAstarApi {
    public async getTotalSupply(): Promise<u128> {
        return new u128(new TypeRegistry(), '100000000000000000000');
    }

    /**
     * Mocks balances for accounts that holds tokens not in circulation
     * @param addresses to exclude for calculation, not used in the mock implementation
     * @returns Mocked accounts balances.
     */
    public async getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]> {
        return [
            {
                free: new u128(new TypeRegistry(), '10000000000000000000'),
                reserved: new u128(new TypeRegistry(), '1000000000000000000'),
                miscFrozen: new u128(new TypeRegistry(), '1000000000000000000'),
                feeFrozen: new u128(new TypeRegistry(), '1000000000000000000'),
            } as PalletBalancesAccountData,
            {
                free: new u128(new TypeRegistry(), '5000000000000000000'),
                reserved: new u128(new TypeRegistry(), '1000000000000000000'),
                miscFrozen: new u128(new TypeRegistry(), '1000000000000000000'),
                feeFrozen: new u128(new TypeRegistry(), '1000000000000000000'),
            } as PalletBalancesAccountData,
        ];
    }

    public async getChainDecimals(): Promise<number> {
        return 18;
    }

    public async getAprCalculationData(): Promise<AprCalculationData> {
        const blockRewards = new u128(new TypeRegistry(), '266400000000000000000');
        const timeStamp = new u64(new TypeRegistry(), '1643779416196');
        const latestBlock = new u32(new TypeRegistry(), '325833');
        const developerRewardPercentage = 0.01;
        const blockPerEra = new u32(new TypeRegistry(), '7200');

        return {
            blockRewards,
            timeStamp,
            latestBlock,
            developerRewardPercentage,
            blockPerEra,
        };
    }

    public async getTvl(): Promise<BN> {
        return new BN('3663434542155463868491065208');
    }

    public async getPreapprovedDevelopers(): Promise<Map<string, string>> {
        const result = new Map<string, string>();
        result.set('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', '');
        result.set('Wwfs24NNBLsdN9BHHj29spDsq5vkjk771dxPvMrXwraLywn', '');

        return Promise.resolve(result);
    }

    public async getRegisteredDevelopers(): Promise<Map<string, string>> {
        const result = new Map<string, string>();
        result.set('Wwfs24NNBLsdN9BHHj29spDsq5vkjk771dxPvMrXwraLywn', '');

        return Promise.resolve(result);
    }

    public getRegisterDappPayload(dappAdress: string): Promise<string> {
        return Promise.resolve('This is a text message');
    }

    public async getChainName(): Promise<string> {
        return Promise.resolve('development');
    }
}
