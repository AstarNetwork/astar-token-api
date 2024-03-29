import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { u32, u64, u128 } from '@polkadot/types';
import { TypeRegistry } from '@polkadot/types/create';
import { Call } from '@polkadot/types/interfaces';
import { PalletBalancesAccountData } from '@polkadot/types/lookup';
import { ISubmittableResult } from '@polkadot/types/types';
import BN from 'bn.js';
import { DappInfo, IAstarApi } from '../../src/client/BaseApi';
import { AprCalculationData } from '../../src/models/AprCalculationData';

/**
 * Astar Polkadot API mock.
 */
export class AstarApiMock implements IAstarApi {
    getCurrentEra(): Promise<number> {
        throw new Error('Method not implemented.');
    }
    getCallFromHex(callHex: string): Promise<Call> {
        throw new Error('Method not implemented.');
    }
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
        const timeStamp = new u64(new TypeRegistry(), '1663656384177');
        const latestBlock = new u32(new TypeRegistry(), '1898332');
        const developerRewardPercentage = 0.01;
        const blockPerEra = new u32(new TypeRegistry(), '7200');
        const adjustablePercent = 0.45;
        const baseStakerPercent = 0.2;
        const idealDappsStakingTvl = 0.6000000000000001;
        const totalIssuance = 7489316530.548266;
        const block7EraAgo = new u32(new TypeRegistry(), '1847932');
        const tsBlock7EraAgo = new u64(new TypeRegistry(), '1663037112230');

        return {
            blockRewards,
            timeStamp,
            latestBlock,
            developerRewardPercentage,
            blockPerEra,
            block7EraAgo,
            tsBlock7EraAgo,
            baseStakerPercent,
            adjustablePercent,
            idealDappsStakingTvl,
            totalIssuance,
        };
    }

    public async getTvl(): Promise<BN> {
        return new BN('3663434542155463868491065208');
    }

    public async getChainName(): Promise<string> {
        return Promise.resolve('development');
    }

    public async getTransactionFromHex(
        _transactionHex: string,
    ): Promise<SubmittableExtrinsic<'promise', ISubmittableResult>> {
        return null;
    }

    public async sendTransaction(transaction: SubmittableExtrinsic<'promise', ISubmittableResult>): Promise<string> {
        return Promise.resolve('123');
    }

    public async getRegisterDappPayload(dappAddress: string, developerAddress: string): Promise<string> {
        return Promise.resolve(`Payload for dapp ${dappAddress} and developer ${developerAddress}`);
    }

    public async getRegisteredDapp(dappAddress: string): Promise<DappInfo | undefined> {
        return undefined;
    }

    // Fixme: mock ApiPromise
    public async getApiPromise(): Promise<ApiPromise> {
        throw new Error('Method not implemented.');
    }
}
