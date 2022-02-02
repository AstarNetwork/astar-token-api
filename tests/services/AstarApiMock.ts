import { u128 } from '@polkadot/types';
import { TypeRegistry } from '@polkadot/types/create';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import BN from 'bn.js';
import { IAstarApi } from '../../src/client/AstarApi';
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
        return null;
    }

    public async getTvl(): Promise<BN> {
        return new BN('3,663,434,542,155,463,868,491,065,208');
    }
}
