import { u128 } from '@polkadot/types';
import { TypeRegistry } from '@polkadot/types/create';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { IApiFactory, ApiFactory } from '../../src/client/ApiFactory';
import { IAstarApi } from '../../src/client/AstarApi';
import { TokenStats } from '../../src/models/TokenStats';
import { StatsService } from '../../src/services/StatsService';

class AstarApiMock implements IAstarApi {
    public async getTotalSupply(): Promise<u128> {
        return new u128(new TypeRegistry(), '100000000000000000000');
    }

    public async getBalances(addresses: string[]): Promise<PalletBalancesAccountData[]> {
        return [
            {
                free: new u128(new TypeRegistry(), '10000000000000000000'),
                reserved: new u128(new TypeRegistry(), 0),
                miscFrozen: new u128(new TypeRegistry(), '1000000000000000000'),
                feeFrozen: new u128(new TypeRegistry(), 0),
            } as PalletBalancesAccountData,
            {
                free: new u128(new TypeRegistry(), '5000000000000000000'),
                reserved: new u128(new TypeRegistry(), 0),
                miscFrozen: new u128(new TypeRegistry(), '1000000000000000000'),
                feeFrozen: new u128(new TypeRegistry(), 0),
            } as PalletBalancesAccountData,
        ];
    }

    public async getChainDecimals(): Promise<number> {
        return 18;
    }
}

describe('getTokeStats', () => {
    let apiFactory: IApiFactory;

    beforeEach(() => {
        apiFactory = new ApiFactory();
        apiFactory.getApiInstance = jest.fn().mockReturnValue(new AstarApiMock());
    });

    it('calculates circulating supply', async () => {
        const service = new StatsService(apiFactory);

        const result = await service.getTokenStats('not important');

        expect(result.circulatingSupply).toBe(83);
    });

    it('returns valid total supply', async () => {
        const service = new StatsService(apiFactory);

        const result = await service.getTokenStats('not important');

        expect(result.totalSupply).toBe(100);
    });
});
